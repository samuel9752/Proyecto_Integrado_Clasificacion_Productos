
const express = require('express');
const http = require('http');
const cors = require('cors');

const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const admin = require('firebase-admin');

// ============================================
// FIREBASE ADMIN
// ============================================

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

// ============================================
// SERVIDOR
// ============================================

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ============================================
// CONFIGURACION
// ============================================

const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3';
const BAUD_RATE = 9600;
const SERVER_PORT = 3000;

// ============================================
// PRODUCTOS
// ============================================

const inventario = {
  COCA_LATA: 0,
  COCA_BOTELLA: 0,
  PEPSI_LATA: 0,
};

const productos = {
  COCA_LATA: {
    nombre: 'Coca-Cola',
    presentacion: 'Lata',
    precio: 8,
  },
  COCA_BOTELLA: {
    nombre: 'Coca-Cola',
    presentacion: 'Botella',
    precio: 12,
  },
  PEPSI_LATA: {
    nombre: 'Pepsi',
    presentacion: 'Lata',
    precio: 7,
  },
};

const pedidosPendientes = new Set();

let puertoArduino = null;
let conectadoArduino = false;

// ============================================
// GUARDAR VENTA EN FIRESTORE
// ============================================

async function guardarVenta(producto) {
  const datosProducto = productos[producto];

  if (!datosProducto) {
    console.error('Producto no válido para registrar venta:', producto);
    return;
  }

  try {
    const venta = {
      producto: producto,
      nombre: datosProducto.nombre,
      presentacion: datosProducto.presentacion,
      precio: datosProducto.precio,
      cantidad: 1,
      fecha: FieldValue.serverTimestamp(),
    };

    const referencia = await db.collection('ventas').add(venta);

    console.log('Venta guardada correctamente:', referencia.id);

    io.emit('venta:nueva', {
      id: referencia.id,
      ...venta,
      fecha: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error al guardar venta:', error.message);
  }
}

// ============================================
// ENVIAR DATOS A LA APLICACION
// ============================================

function enviarInventario() {
  io.emit('stock', { ...inventario });
}

function enviarEstado() {
  io.emit('connectionStatus', {
    conectado: conectadoArduino,
    mensaje: conectadoArduino
      ? 'Arduino conectado'
      : 'Arduino desconectado',
  });
}

// ============================================
// CONEXION SERIAL
// ============================================

function conectarArduino() {
  try {
    puertoArduino = new SerialPort({
      path: ARDUINO_PORT,
      baudRate: BAUD_RATE,
      autoOpen: false,
    });

    const parser = puertoArduino.pipe(
      new ReadlineParser({ delimiter: '\r\n' })
    );

    puertoArduino.open((error) => {
      if (error) {
        conectadoArduino = false;
        console.error('No se pudo abrir Arduino:', error.message);
        enviarEstado();
        return;
      }

      conectadoArduino = true;

      console.log('Arduino conectado en', ARDUINO_PORT);

      enviarEstado();

      puertoArduino.write('GET_STOCK\n');
    });

    parser.on('data', (linea) => {
      procesarMensajeArduino(linea.trim());
    });

    puertoArduino.on('error', (error) => {
      conectadoArduino = false;
      console.error('Error serial:', error.message);
      enviarEstado();
    });

    puertoArduino.on('close', () => {
      conectadoArduino = false;
      console.log('Arduino desconectado');
      enviarEstado();
    });

  } catch (error) {
    console.error('Error de conexión:', error.message);
  }
}

// ============================================
// INTERPRETAR MENSAJES DE ARDUINO
// ============================================

function procesarMensajeArduino(mensaje) {
  if (!mensaje) return;

  console.log('Arduino:', mensaje);

  const partes = mensaje.split(',');
  const tipo = partes[0];

  if (tipo === 'READY') {
    console.log('Sistema Arduino listo');
  }

  // STOCK,PRODUCTO,CANTIDAD
  else if (tipo === 'STOCK') {
    const producto = partes[1];
    const cantidad = Number(partes[2]);

    if (
      Object.prototype.hasOwnProperty.call(inventario, producto) &&
      Number.isInteger(cantidad) &&
      cantidad >= 0 &&
      cantidad <= 4
    ) {
      inventario[producto] = cantidad;
      enviarInventario();
    }
  }

  // EVENT,IN/OUT,PRODUCTO,CANTIDAD
  else if (tipo === 'EVENT') {
    const accion = partes[1];
    const producto = partes[2];

    io.emit('inventoryEvent', {
      accion,
      producto,
      nombre: productos[producto]?.nombre || producto,
      cantidad: Number(partes[3]),
    });
  }

  // RESULT,DISPENSE,PRODUCTO,RESULTADO
  else if (tipo === 'RESULT' && partes[1] === 'DISPENSE') {
    const producto = partes[2];
    const resultado = partes[3];

    pedidosPendientes.delete(producto);

    io.emit('pedido:resultado', {
      producto,
      nombre: productos[producto]?.nombre || producto,
      resultado,
      mensaje:
        resultado === 'OK'
          ? 'La bebida fue entregada correctamente.'
          : resultado === 'EMPTY'
          ? 'No hay existencias de este producto.'
          : resultado,
    });

    // Registrar venta solamente si Arduino confirma OK
    if (resultado === 'OK') {
      guardarVenta(producto);
    }
  }

  else if (tipo === 'FULL') {
    io.emit('inventoryEvent', {
      accion: 'FULL',
      producto: partes[1],
      nombre: productos[partes[1]]?.nombre || partes[1],
      mensaje: 'La banda está llena.',
    });
  }

  else if (tipo === 'UNKNOWN') {
    io.emit('inventoryEvent', {
      accion: 'UNKNOWN',
      mensaje: 'Envase no reconocido.',
    });
  }
}

// ============================================
// RECIBIR PEDIDOS DESDE REACT NATIVE
// ============================================

io.on('connection', (socket) => {
  console.log('Aplicación conectada:', socket.id);

  socket.emit('stock', { ...inventario });

  socket.emit('connectionStatus', {
    conectado: conectadoArduino,
    mensaje: conectadoArduino
      ? 'Arduino conectado'
      : 'Arduino desconectado',
  });

  socket.on('pedido', (datos) => {
    const producto = datos?.producto;

    if (!Object.prototype.hasOwnProperty.call(inventario, producto)) {
      socket.emit('pedido:respuesta', {
        ok: false,
        mensaje: 'Producto no válido.',
      });
      return;
    }

    if (!conectadoArduino || !puertoArduino?.isOpen) {
      socket.emit('pedido:respuesta', {
        ok: false,
        mensaje: 'Arduino no está conectado.',
      });
      return;
    }

    if (pedidosPendientes.has(producto)) {
      socket.emit('pedido:respuesta', {
        ok: false,
        mensaje: 'Ya hay un pedido en proceso para este producto.',
      });
      return;
    }

    pedidosPendientes.add(producto);

    puertoArduino.write(`DISPENSE,${producto}\n`, (error) => {
      if (error) {
        pedidosPendientes.delete(producto);

        socket.emit('pedido:respuesta', {
          ok: false,
          mensaje: 'No se pudo enviar el pedido a Arduino.',
        });

        return;
      }

      socket.emit('pedido:respuesta', {
        ok: true,
        mensaje: `Pedido enviado: ${productos[producto].nombre}`,
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('Aplicación desconectada:', socket.id);
  });
});

// ============================================
// RUTAS DEL SERVIDOR
// ============================================

app.get('/', (req, res) => {
  res.json({
    servidor: 'Servidor de la máquina expendedora SMARTGO',
    arduino: conectadoArduino,
    inventario,
  });
});

// Consultar inventario
app.get('/inventario', (req, res) => {
  res.json(inventario);
});

// Consultar historial de ventas
app.get('/ventas', async (req, res) => {
  try {
    const resultado = await db
      .collection('ventas')
      .orderBy('fecha', 'desc')
      .get();

    const ventas = resultado.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
      fecha: documento.data().fecha?.toDate().toISOString() || null,
    }));

    res.json(ventas);

  } catch (error) {
    console.error('Error al consultar ventas:', error.message);

    res.status(500).json({
      error: 'No se pudo obtener el historial de ventas.',
    });
  }
});

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log('Servidor iniciado en el puerto', SERVER_PORT);
  conectarArduino();
});
