
const express = require('express');
const http = require('http');
const cors = require('cors');

const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

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

// Cambia COM3 por el puerto que tenga tu Arduino.
// Puedes verlo en Arduino IDE > Herramientas > Puerto.

const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3';
const BAUD_RATE = 9600;
const SERVER_PORT = 3000;

// ============================================
// INVENTARIO
// ============================================

const inventario = {
  COCA_LATA: 0,
  COCA_BOTELLA: 0,
  PEPSI_LATA: 0,
};

const nombres = {
  COCA_LATA: 'Coca-Cola lata',
  COCA_BOTELLA: 'Coca-Cola botella',
  PEPSI_LATA: 'Pepsi lata',
};

const pedidosPendientes = new Set();

let puertoArduino = null;
let conectadoArduino = false;

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

    console.log(
      'Movimiento:',
      accion,
      nombres[producto] || producto
    );

    io.emit('inventoryEvent', {
      accion,
      producto,
      nombre: nombres[producto] || producto,
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
      nombre: nombres[producto] || producto,
      resultado,
      mensaje:
        resultado === 'OK'
          ? 'El motor terminó el ciclo de entrega.'
          : resultado === 'EMPTY'
          ? 'No hay existencias de este producto.'
          : resultado,
    });
  }

  else if (tipo === 'FULL') {
    io.emit('inventoryEvent', {
      accion: 'FULL',
      producto: partes[1],
      nombre: nombres[partes[1]] || partes[1],
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
        mensaje: `Pedido enviado: ${nombres[producto]}`,
      });
    });
  });

  socket.on('disconnect', () => {
    console.log('Aplicación desconectada:', socket.id);
  });
});

// ============================================
// RUTA DE PRUEBA
// ============================================

app.get('/', (req, res) => {
  res.json({
    servidor: 'Servidor de la máquina expendedora',
    arduino: conectadoArduino,
    inventario,
  });
});

app.get('/inventario', (req, res) => {
  res.json(inventario);
});

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log('Servidor iniciado en el puerto', SERVER_PORT);
  conectarArduino();
});
