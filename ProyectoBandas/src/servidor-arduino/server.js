
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

// ============================================
// FIREBASE
// ============================================

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

const SERVER_PORT = 3000;
const BAUD_RATE = 9600;

// ============================================
// CONFIGURACIÓN DE LOS DOS ARDUINOS
// ============================================

const ARDUINO1_PORT = process.env.ARDUINO1_PORT || 'COM17';
const ARDUINO2_PORT = process.env.ARDUINO2_PORT || 'COM18';

const PUERTO_ENTREGA = 1;

// ============================================
// SENSOR DE LLAMA
// ============================================

// Umbral provisional para pruebas.
// Debe calibrarse con las lecturas reales del sensor.

const UMBRAL_LLAMA = Number(process.env.UMBRAL_LLAMA || 900);

const LECTURAS_PARA_ALERTA = 3;

let lecturaLlama = null;
let llamaDetectada = false;

let lecturasConsecutivas = 0;
let lecturasNormales = 0;

let ultimaActualizacionLlama = 0;
let estadoLlamaGuardado = null;

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

// ============================================
// CONEXIONES
// ============================================

let puertoArduino1 = null;
let puertoArduino2 = null;

let conectadoArduino1 = false;
let conectadoArduino2 = false;

function obtenerPuertoEntrega() {
  return PUERTO_ENTREGA === 1
    ? puertoArduino1
    : puertoArduino2;
}

function estaConectadoArduino() {
  const puerto = obtenerPuertoEntrega();

  if (PUERTO_ENTREGA === 1) {
    return conectadoArduino1 && puerto?.isOpen === true;
  }

  return conectadoArduino2 && puerto?.isOpen === true;
}

// ============================================
// PEDIDOS Y COLA
// ============================================

const pedidos = new Map();
const colaPedidos = [];

let procesandoCola = false;
let comandoPendiente = null;

// ============================================
// INVENTARIO
// ============================================

function enviarInventario() {
  io.emit('stock', { ...inventario });
}

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

// ============================================
// SENSOR DE LLAMA Y FIREBASE
// ============================================

async function procesarLecturaLlama(valorRecibido) {

  const valor = Number(valorRecibido);

  // Validar lectura analógica del Arduino.
  if (
    !Number.isFinite(valor) ||
    valor < 0 ||
    valor > 1023
  ) {
    return;
  }

  lecturaLlama = valor;

  // Si el valor baja del umbral,
  // acumular lecturas consecutivas.

  if (valor <= UMBRAL_LLAMA) {

    lecturasConsecutivas++;
    lecturasNormales = 0;

  } else {

    lecturasNormales++;
    lecturasConsecutivas = 0;

  }

  // Activar alerta después de 3 lecturas bajas.
  if (lecturasConsecutivas >= LECTURAS_PARA_ALERTA) {
    llamaDetectada = true;
  }

  // Restablecer alerta después de 3 lecturas normales.
  if (lecturasNormales >= LECTURAS_PARA_ALERTA) {
    llamaDetectada = false;
  }

  const ahora = Date.now();

  const cambioEstado =
    estadoLlamaGuardado !== llamaDetectada;

  const actualizarLectura =
    ahora - ultimaActualizacionLlama >= 2000;

  // No escribir en Firebase innecesariamente.
  if (!cambioEstado && !actualizarLectura) {
    return;
  }

  try {

    await db.collection('maquina')
      .doc('seguridad')
      .set({

        llamaDetectada: llamaDetectada,

        lecturaLlama: lecturaLlama,

        sensorActualizado: FieldValue.serverTimestamp(),

      }, { merge: true });

    estadoLlamaGuardado = llamaDetectada;
    ultimaActualizacionLlama = ahora;

    console.log(
      `Sensor de llama: ${lecturaLlama} | Estado: ${
        llamaDetectada ? 'ALERTA' : 'NORMAL'
      }`
    );

    // Enviar también el estado mediante Socket.IO.
    io.emit('seguridad', {
      llamaDetectada,
      lecturaLlama,
    });

  } catch (error) {

    console.error(
      'Error actualizando seguridad en Firebase:',
      error.message
    );

  }
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
      producto,
      nombre: datosProducto.nombre,
      presentacion: datosProducto.presentacion,
      precio: datosProducto.precio,
      cantidad: 1,
      total: datosProducto.precio,
      usuario,
      fecha: new Date().toISOString(),
    });

  } catch (error) {

    console.error('Error guardando venta:', error.message);

  }
}

// ============================================
// ESTADO DE LOS ARDUINOS
// ============================================

function enviarEstado() {

  io.emit('connectionStatus', {

    conectado: estaConectadoArduino(),

    arduino1: conectadoArduino1,

    arduino2: conectadoArduino2,

    mensaje: estaConectadoArduino()
      ? 'Arduino de entregas conectado'
      : 'Arduino de entregas desconectado',

  });

}

// ============================================
// ENVIAR COMANDO DE ENTREGA
// ============================================

function dispensarProducto(producto) {

  return new Promise((resolve, reject) => {

    const puerto = obtenerPuertoEntrega();

    if (!estaConectadoArduino() || !puerto) {
      reject(new Error('Arduino de entregas no está conectado.'));
      return;
    }

    if (comandoPendiente) {
      reject(new Error('Hay otro comando en proceso.'));
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

        reject(
          new Error('Arduino no respondió a tiempo.')
        );

      }

    }, 30000);

    puerto.write(`DISPENSE,${producto}\n`, (error) => {

      if (error && comandoPendiente === pendiente) {

        clearTimeout(pendiente.temporizador);
        comandoPendiente = null;

        reject(
          new Error('No se pudo enviar el comando a Arduino.')
        );

      }

    });

  });

}

// ============================================
// PROGRESO DEL PEDIDO
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
// PROCESAR PEDIDOS
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

            pedido.mensaje =
              `Entregando ${productos[producto].nombre} ${productos[producto].presentacion}.`;

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

    if (colaPedidos.length > 0) {
      procesarColaPedidos();
    }

  }

}

// ============================================
// RECIBIR MENSAJES DE LOS ARDUINOS
// ============================================

function procesarMensajeArduino(mensaje, origen) {

  if (!mensaje) return;

  console.log(`[${origen}] ${mensaje}`);

  const partes = mensaje.split(',');
  const tipo = partes[0];

  // ==========================================
  // SENSOR DE LLAMA
  // ==========================================

  if (tipo === 'LLAMA') {

    // El sensor está conectado al Arduino principal.
    if (origen === 'ARDUINO1') {

      procesarLecturaLlama(partes[1]);

    }

    return;

  }

  // ==========================================
  // ARDUINO LISTO
  // ==========================================

  if (tipo === 'READY') {

    console.log(`${origen} está listo.`);

  }

  // ==========================================
  // INVENTARIO
  // ==========================================

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

  // ==========================================
  // EVENTOS DE INVENTARIO
  // ==========================================

  else if (tipo === 'EVENT') {

    const accion = partes[1];
    const producto = partes[2];

    io.emit('inventoryEvent', {

      accion,
      producto,

      nombre: productos[producto]?.nombre || producto,

      cantidad: Number(partes[3]),

      arduino: origen,

    });

  }

  // ==========================================
  // RESULTADO DE ENTREGA
  // ==========================================

  else if (tipo === 'RESULT' && partes[1] === 'DISPENSE') {

    const producto = partes[2];
    const resultado = partes[3];

    if (origen !== `ARDUINO${PUERTO_ENTREGA}`) {

      console.log('Resultado ignorado: Arduino secundario.');

      return;

    }

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

  // ==========================================
  // BANDA LLENA
  // ==========================================

  else if (tipo === 'FULL') {

    io.emit('inventoryEvent', {

      accion: 'FULL',

      producto: partes[1],

      nombre: productos[partes[1]]?.nombre || partes[1],

      mensaje: 'La banda está llena.',

      arduino: origen,

    });

  }

  // ==========================================
  // PRODUCTO DESCONOCIDO
  // ==========================================

  else if (tipo === 'UNKNOWN') {

    io.emit('inventoryEvent', {

      accion: 'UNKNOWN',

      mensaje: 'Envase no reconocido.',

      arduino: origen,

    });

  }

}

// ============================================
// CONECTAR UN ARDUINO
// ============================================

function conectarUnArduino(numero, puertoCOM) {

  const nombre = `ARDUINO${numero}`;

  const puerto = new SerialPort({

    path: puertoCOM,
    baudRate: BAUD_RATE,
    autoOpen: false,

  });

  const parser = puerto.pipe(
    new ReadlineParser({
      delimiter: '\n',
    })
  );

  if (numero === 1) {
    puertoArduino1 = puerto;
  } else {
    puertoArduino2 = puerto;
  }

  puerto.open((error) => {

    if (error) {

      console.error(
        `No se pudo conectar ${nombre} en ${puertoCOM}:`,
        error.message
      );

      if (numero === 1) conectadoArduino1 = false;
      else conectadoArduino2 = false;

      enviarEstado();

      return;

    }

    console.log(`${nombre} conectado en ${puertoCOM}`);

    if (numero === 1) conectadoArduino1 = true;
    else conectadoArduino2 = true;

    enviarEstado();

    // Solicitar inventario solamente al Arduino 1.
    if (numero === 1) {
      puerto.write('GET_STOCK\n');
    }

  });

  parser.on('data', (linea) => {

    procesarMensajeArduino(
      linea.trim(),
      nombre
    );

  });

  puerto.on('error', (error) => {

    console.error(`Error en ${nombre}:`, error.message);

    if (numero === 1) conectadoArduino1 = false;
    else conectadoArduino2 = false;

    enviarEstado();

    if (
      numero === PUERTO_ENTREGA &&
      comandoPendiente
    ) {

      clearTimeout(comandoPendiente.temporizador);

      comandoPendiente.reject(
        new Error('Se perdió la conexión con Arduino.')
      );

      comandoPendiente = null;

    }

  });

  puerto.on('close', () => {

    console.log(`${nombre} desconectado`);

    if (numero === 1) conectadoArduino1 = false;
    else conectadoArduino2 = false;

    enviarEstado();

  });

}

// ============================================
// CONECTAR LOS DOS ARDUINOS
// ============================================

function conectarArduino() {

  conectarUnArduino(1, ARDUINO1_PORT);

  conectarUnArduino(2, ARDUINO2_PORT);

}

// ============================================
// CREAR PEDIDO DESDE LA APP
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

  if (!estaConectadoArduino()) {

    return res.status(503).json({

      ok: false,
      mensaje: 'Arduino de entregas no está conectado.',

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

    if (
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > 4
    ) {

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
// CONSULTAR PEDIDO
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
// ESTADO GENERAL
// ============================================

app.get('/', (req, res) => {

  res.json({

    servidor: 'SMARTGO',

    arduino: estaConectadoArduino(),

    arduino1: conectadoArduino1,

    arduino2: conectadoArduino2,

    inventario,

    seguridad: {
      llamaDetectada,
      lecturaLlama,
    },

  });

});

// ============================================
// INVENTARIO
// ============================================

app.get('/inventario', (req, res) => {

  res.json({

    conectado: estaConectadoArduino(),

    arduino1: conectadoArduino1,

    arduino2: conectadoArduino2,

    productos: inventario,

  });

});

// ============================================
// ESTADO DE SEGURIDAD
// ============================================

app.get('/seguridad', (req, res) => {

  res.json({

    llamaDetectada,

    lecturaLlama,

    umbral: UMBRAL_LLAMA,

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
// SOCKET.IO
// ============================================

io.on('connection', (socket) => {

  console.log('Aplicación conectada:', socket.id);

  socket.emit('stock', { ...inventario });

  socket.emit('connectionStatus', {

    conectado: estaConectadoArduino(),

    arduino1: conectadoArduino1,

    arduino2: conectadoArduino2,

  });

  socket.emit('seguridad', {

    llamaDetectada,

    lecturaLlama,

  });

  socket.on('disconnect', () => {

    console.log('Aplicación desconectada:', socket.id);

  });

});

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(SERVER_PORT, '0.0.0.0', () => {

  console.log('');

  console.log('====================================');

  console.log('       SMARTGO - SERVIDOR');

  console.log('====================================');

  console.log(`Servidor: http://localhost:${SERVER_PORT}`);

  console.log(`Arduino 1: ${ARDUINO1_PORT}`);

  console.log(`Arduino 2: ${ARDUINO2_PORT}`);

  console.log(`Baudios: ${BAUD_RATE}`);

  console.log(`Umbral provisional de llama: ${UMBRAL_LLAMA}`);

  console.log('====================================');

  console.log('');

  conectarArduino();

});
