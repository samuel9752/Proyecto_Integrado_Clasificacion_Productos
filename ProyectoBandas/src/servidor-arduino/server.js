
const express = require('express');
const http = require('http');
const cors = require('cors');
const { randomUUID } = require('crypto');

const { Server } = require('socket.io');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

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

const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3';
const BAUD_RATE = 9600;
const SERVER_PORT = 3000;

// ============================================
// PRODUCTOS E INVENTARIO
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

let puertoArduino = null;
let conectadoArduino = false;

// ============================================
// PEDIDOS Y COLA DE ENTREGA
// ============================================

const pedidos = new Map();
const colaPedidos = [];

let procesandoCola = false;
let comandoPendiente = null;

// ============================================
// INVENTARIO EN FIRESTORE
// ============================================

async function sincronizarInventario(producto, cantidad) {
  const datos = productos[producto];
  if (!datos) return;

  try {
    await db.collection('inventario').doc(producto).set({
      producto,
      nombre: datos.nombre,
      presentacion: datos.presentacion,
      cantidad,
      capacidad: 4,
      precio: datos.precio,
      activa: true,
      actualizado: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error sincronizando inventario:', error.message);
  }
}

function enviarInventario() {
  io.emit('stock', { ...inventario });
}

// ============================================
// GUARDAR VENTA
// ============================================

async function guardarVenta(producto, usuario) {
  const datosProducto = productos[producto];
  if (!datosProducto) return;

  try {
    const venta = {
      producto,
      nombre: datosProducto.nombre,
      presentacion: datosProducto.presentacion,
      precio: datosProducto.precio,
      cantidad: 1,
      total: datosProducto.precio,
      usuario: {
        uid: usuario.uid,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
      fecha: FieldValue.serverTimestamp(),
    };

    const referencia = await db.collection('ventas').add(venta);

    console.log('Venta guardada:', referencia.id);

    io.emit('venta:nueva', {
      id: referencia.id,
      ...venta,
      fecha: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error guardando venta:', error.message);
  }
}

// ============================================
// ESTADO DE ARDUINO
// ============================================

function enviarEstado() {
  io.emit('connectionStatus', {
    conectado: conectadoArduino,
    mensaje: conectadoArduino
      ? 'Arduino conectado'
      : 'Arduino desconectado',
  });
}

// ============================================
// ENVIAR UN PRODUCTO A ARDUINO Y ESPERAR
// ============================================

function dispensarProducto(producto) {
  return new Promise((resolve, reject) => {
    if (!conectadoArduino || !puertoArduino?.isOpen) {
      reject(new Error('Arduino no está conectado.'));
      return;
    }

    if (comandoPendiente) {
      reject(new Error('Hay otro comando de Arduino en proceso.'));
      return;
    }

    const pendiente = {
      producto,
      resolve,
      reject,
      temporizador: null,
    };

    comandoPendiente = pendiente;

    pendiente.temporizador = setTimeout(() => {
      if (comandoPendiente === pendiente) {
        comandoPendiente = null;
        reject(new Error('Arduino no respondió a tiempo.'));
      }
    }, 30000);

    puertoArduino.write(`DISPENSE,${producto}\n`, (error) => {
      if (error && comandoPendiente === pendiente) {
        clearTimeout(pendiente.temporizador);
        comandoPendiente = null;
        reject(new Error('No se pudo enviar el comando a Arduino.'));
      }
    });
  });
}

// ============================================
// ACTUALIZAR PEDIDO
// ============================================

function emitirProgreso(pedido) {
  io.emit('pedido:progreso', {
    pedidoId: pedido.id,
    estado: pedido.estado,
    productos: pedido.productos,
    mensaje: pedido.mensaje,
  });
}

// ============================================
// PROCESAR PEDIDOS DE UNO EN UNO
// ============================================

async function procesarColaPedidos() {
  if (procesandoCola) return;

  procesandoCola = true;

  try {
    while (colaPedidos.length > 0) {
      const pedido = colaPedidos.shift();
      pedido.estado = 'procesando';
      pedido.mensaje = 'Preparando tu pedido.';
      emitirProgreso(pedido);

      let detenerPedido = false;

      for (const item of pedido.productos) {
        const producto = item.producto;

        for (let unidad = 0; unidad < item.solicitada; unidad++) {
          if (inventario[producto] <= 0) {
            item.fallidas++;
            item.resultados.push('SIN_EXISTENCIAS');
            emitirProgreso(pedido);
            continue;
          }

          try {
            pedido.mensaje = `Entregando ${productos[producto].nombre} ${productos[producto].presentacion}.`;
            emitirProgreso(pedido);

            const resultado = await dispensarProducto(producto);

            if (resultado === 'OK') {
              item.entregadas++;
              item.resultados.push('OK');

              await guardarVenta(producto, pedido.usuario);
            } else if (resultado === 'EMPTY') {
              item.fallidas++;
              item.resultados.push('SIN_EXISTENCIAS');
            } else {
              item.fallidas++;
              item.resultados.push(resultado);
            }

            emitirProgreso(pedido);

          } catch (error) {
            item.fallidas++;
            item.resultados.push('ERROR');
            pedido.mensaje = error.message;
            detenerPedido = true;
            emitirProgreso(pedido);
            break;
          }
        }

        if (detenerPedido) break;
      }

      pedido.estado = detenerPedido ? 'error' : 'completado';
      pedido.mensaje = detenerPedido
        ? 'El pedido se detuvo por un problema de comunicación con Arduino.'
        : 'El pedido terminó. Revisa las unidades entregadas.';

      pedido.finalizado = new Date().toISOString();
      emitirProgreso(pedido);
    }

  } finally {
    procesandoCola = false;

    // Por si llegó otro pedido mientras terminaba el anterior.
    if (colaPedidos.length > 0) {
      procesarColaPedidos();
    }
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
      sincronizarInventario(producto, cantidad);
    }
  }

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

  else if (tipo === 'RESULT' && partes[1] === 'DISPENSE') {
    const producto = partes[2];
    const resultado = partes[3];

    // STARTED significa que comenzó la entrega.
    // No se debe liberar la cola todavía.
    if (resultado === 'STARTED') {
      io.emit('pedido:resultado', {
        producto,
        resultado,
        mensaje: 'Arduino comenzó la entrega.',
      });
      return;
    }

    if (
      comandoPendiente &&
      comandoPendiente.producto === producto
    ) {
      const pendiente = comandoPendiente;
      clearTimeout(pendiente.temporizador);
      comandoPendiente = null;
      pendiente.resolve(resultado);
    }

    io.emit('pedido:resultado', {
      producto,
      nombre: productos[producto]?.nombre || producto,
      resultado,
      mensaje: resultado === 'OK'
        ? 'Arduino terminó el ciclo de entrega.'
        : resultado === 'EMPTY'
        ? 'No hay existencias de este producto.'
        : resultado,
    });
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
// CONEXIÓN SERIAL
// ============================================

function conectarArduino() {
  try {
    puertoArduino = new SerialPort({
      path: ARDUINO_PORT,
      baudRate: BAUD_RATE,
      autoOpen: false,
    });

    const parser = puertoArduino.pipe(
      new ReadlineParser({ delimiter: '\n' })
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

      if (comandoPendiente) {
        clearTimeout(comandoPendiente.temporizador);
        comandoPendiente.reject(new Error('Se perdió la conexión con Arduino.'));
        comandoPendiente = null;
      }
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
// CREAR PEDIDO DESDE LA APLICACIÓN
// ============================================

app.post('/pedido', (req, res) => {
  const items = req.body?.items;
  const usuarioRecibido = req.body?.usuario;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'El carrito está vacío.',
    });
  }

  if (
    !usuarioRecibido?.uid ||
    !usuarioRecibido?.correo
  ) {
    return res.status(400).json({
      ok: false,
      mensaje: 'No se recibió la información del usuario.',
    });
  }

  if (!conectadoArduino || !puertoArduino?.isOpen) {
    return res.status(503).json({
      ok: false,
      mensaje: 'Arduino no está conectado.',
    });
  }

  const productosPedido = [];

  for (const item of items) {
    const producto = item.producto;
    const cantidad = Number(item.cantidad);

    if (!Object.prototype.hasOwnProperty.call(productos, producto)) {
      return res.status(400).json({
        ok: false,
        mensaje: `Producto no válido: ${producto}`,
      });
    }

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 4) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Cada producto debe tener entre 1 y 4 unidades.',
      });
    }

    if (cantidad > inventario[producto]) {
      return res.status(400).json({
        ok: false,
        mensaje: `No hay suficientes existencias de ${productos[producto].nombre} ${productos[producto].presentacion}.`,
      });
    }

    productosPedido.push({
      producto,
      solicitada: cantidad,
      entregadas: 0,
      fallidas: 0,
      resultados: [],
    });
  }

  const usuario = {
    uid: String(usuarioRecibido.uid),
    correo: String(usuarioRecibido.correo),
    nombre: String(
      usuarioRecibido.nombre ||
      usuarioRecibido.correo.split('@')[0]
    ),
  };

  const pedido = {
    id: randomUUID(),
    usuario,
    productos: productosPedido,
    estado: 'en_cola',
    mensaje: 'Tu pedido está en espera.',
    creado: new Date().toISOString(),
  };

  pedidos.set(pedido.id, pedido);
  colaPedidos.push(pedido);

  res.status(202).json({
    ok: true,
    pedidoId: pedido.id,
    mensaje: 'Pedido recibido correctamente.',
  });

  procesarColaPedidos();
});

// ============================================
// CONSULTAR ESTADO DE UN PEDIDO
// ============================================

app.get('/pedido/:id', (req, res) => {
  const pedido = pedidos.get(req.params.id);

  if (!pedido) {
    return res.status(404).json({
      ok: false,
      mensaje: 'No se encontró el pedido.',
    });
  }

  res.json({
    ok: true,
    pedidoId: pedido.id,
    estado: pedido.estado,
    mensaje: pedido.mensaje,
    productos: pedido.productos,
    creado: pedido.creado,
    finalizado: pedido.finalizado || null,
  });
});

// ============================================
// RUTAS GENERALES
// ============================================

app.get('/', (req, res) => {
  res.json({
    servidor: 'SMARTGO',
    arduino: conectadoArduino,
    inventario,
  });
});

app.get('/inventario', (req, res) => {
  res.json({
    conectado: conectadoArduino,
    productos: inventario,
  });
});

// ============================================
// HISTORIAL DE VENTAS
// ============================================

app.get('/ventas', async (req, res) => {
  try {
    const resultado = await db
      .collection('ventas')
      .orderBy('fecha', 'desc')
      .get();

    const ventas = resultado.docs.map((documento) => {
      const datos = documento.data();

      return {
        id: documento.id,
        producto: datos.producto,
        nombre: datos.nombre,
        presentacion: datos.presentacion,
        precio: datos.precio,
        cantidad: datos.cantidad,
        total: datos.total,
        usuario: datos.usuario || null,
        fecha: datos.fecha
          ? datos.fecha.toDate().toISOString()
          : null,
      };
    });

    res.json(ventas);

  } catch (error) {
    console.error('Error al consultar ventas:', error.message);

    res.status(500).json({
      error: 'No se pudo obtener el historial de ventas.',
    });
  }
});

// ============================================
// INICIAR
// ============================================

server.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log('Servidor SMARTGO iniciado en el puerto', SERVER_PORT);
  console.log(`Dirección local: http://192.168.1.120:${SERVER_PORT}`);
  conectarArduino();
});
