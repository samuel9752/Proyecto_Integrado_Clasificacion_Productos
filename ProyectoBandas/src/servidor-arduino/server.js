
require('dotenv').config();
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

let geminiAI = null;

async function obtenerGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('No se encontró GEMINI_API_KEY en el archivo .env');
  }

  if (!geminiAI) {
    const { GoogleGenAI } = await import('@google/genai');

    geminiAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return geminiAI;
}

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
// CONFIGURACIÓN DE ARDUINOS
// ============================================

const ARDUINO1_PORT = process.env.ARDUINO1_PORT || 'COM17';
const ARDUINO2_PORT = process.env.ARDUINO2_PORT || 'COM18';

const PUERTO_ENTREGA = 1;

// ============================================
// SENSOR DE LLAMA
// ============================================

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
  // Este formato es compatible con las pantallas
  // que reciben datos.productos o datos directamente.
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
      activa: cantidad > 0,
      actualizado: FieldValue.serverTimestamp(),
    }, { merge: true });

  } catch (error) {
    console.error(
      'Error sincronizando inventario:',
      error.message
    );
  }
}

// ============================================
// REGISTRAR ENTREGA CONFIRMADA
// DESCONTAR INVENTARIO Y REGISTRAR VENTA
// ============================================

async function registrarEntregaConfirmada(
  producto,
  usuario,
  pedidoId,
  indiceItem,
  numeroUnidad
) {
  const datosProducto = productos[producto];

  if (!datosProducto) {
    throw new Error(`Producto desconocido: ${producto}`);
  }

  // ID único por unidad entregada.
  const movimientoId =
    `${pedidoId}_${indiceItem}_${numeroUnidad}`;

  const inventarioRef = db
    .collection('inventario')
    .doc(producto);

  const movimientoRef = db
    .collection('movimientos')
    .doc(movimientoId);

  const ventaRef = db
    .collection('ventas')
    .doc(movimientoId);

  let resultado;

  for (let intento = 1; intento <= 3; intento++) {
    try {
      resultado = await db.runTransaction(async (transaction) => {

        // Primero todas las lecturas.
        const movimientoDoc = await transaction.get(movimientoRef);
        const inventarioDoc = await transaction.get(inventarioRef);

        // Evitar duplicar una entrega.
        if (movimientoDoc.exists) {
          const movimiento = movimientoDoc.data();

          return {
            duplicado: true,
            cantidad: Number(movimiento.cantidadRestante),
          };
        }

        const cantidadActual = inventarioDoc.exists
          ? Number(inventarioDoc.data().cantidad)
          : Number(inventario[producto]);

        if (
          !Number.isInteger(cantidadActual) ||
          cantidadActual <= 0
        ) {
          throw new Error(
            `Inventario inválido o agotado para ${producto}`
          );
        }

        const cantidadNueva = cantidadActual - 1;

        const usuarioVenta = {
          uid: usuario.uid || '',
          nombre: usuario.nombre || 'Usuario',
          correo: usuario.correo || '',
        };

        // Actualizar inventario.
        transaction.set(inventarioRef, {
          producto,
          nombre: datosProducto.nombre,
          presentacion: datosProducto.presentacion,
          cantidad: cantidadNueva,
          capacidad: 4,
          precio: datosProducto.precio,
          activa: cantidadNueva > 0,
          actualizado: FieldValue.serverTimestamp(),
        }, { merge: true });

        // Registrar movimiento.
        transaction.set(movimientoRef, {
          id: movimientoId,
          pedidoId,
          producto,
          nombre: datosProducto.nombre,
          presentacion: datosProducto.presentacion,
          tipo: 'VENTA',
          cantidad: 1,
          cantidadAnterior: cantidadActual,
          cantidadRestante: cantidadNueva,
          usuario: usuarioVenta,
          fecha: FieldValue.serverTimestamp(),
        });

        // Registrar venta.
        transaction.set(ventaRef, {
          producto,
          nombre: datosProducto.nombre,
          presentacion: datosProducto.presentacion,
          precio: datosProducto.precio,
          cantidad: 1,
          total: datosProducto.precio,
          usuario: usuarioVenta,
          pedidoId,
          fecha: FieldValue.serverTimestamp(),
        });

        return {
          duplicado: false,
          cantidad: cantidadNueva,
        };
      });

      break;

    } catch (error) {
      console.error(
        `Error guardando entrega. Intento ${intento}/3:`,
        error.message
      );

      if (intento === 3) {
        throw error;
      }

      await new Promise(resolve =>
        setTimeout(resolve, intento * 1000)
      );
    }
  }

  // Actualizar inventario en memoria.
  inventario[producto] = resultado.cantidad;

  // Actualizar las pantallas.
  enviarInventario();

  if (!resultado.duplicado) {
    console.log('================================');
    console.log('VENTA REGISTRADA CORRECTAMENTE');
    console.log('Producto:', producto);
    console.log('Cantidad vendida: 1');
    console.log('Existencias restantes:', resultado.cantidad);
    console.log('================================');

    io.emit('venta:nueva', {
      id: movimientoId,
      producto,
      nombre: datosProducto.nombre,
      presentacion: datosProducto.presentacion,
      precio: datosProducto.precio,
      cantidad: 1,
      total: datosProducto.precio,
      usuario,
      pedidoId,
      fecha: new Date().toISOString(),
    });

    io.emit('inventoryEvent', {
      accion: 'VENTA',
      producto,
      nombre: datosProducto.nombre,
      cantidad: resultado.cantidad,
      mensaje:
        `Se vendió 1 ${datosProducto.presentacion} de ` +
        `${datosProducto.nombre}. Quedan ${resultado.cantidad}.`,
    });

  } else {
    console.log(
      'Entrega repetida ignorada:',
      movimientoId
    );
  }

  return resultado;
}

// ============================================
// SENSOR DE LLAMA
// ============================================

async function procesarLecturaLlama(valorRecibido) {
  const valor = Number(valorRecibido);

  if (
    !Number.isFinite(valor) ||
    valor < 0 ||
    valor > 1023
  ) {
    console.log('Lectura inválida:', valorRecibido);
    return;
  }

  lecturaLlama = valor;

  if (valor <= UMBRAL_LLAMA) {
    lecturasConsecutivas++;
    lecturasNormales = 0;
  } else {
    lecturasNormales++;
    lecturasConsecutivas = 0;
  }

  if (lecturasConsecutivas >= LECTURAS_PARA_ALERTA) {
    llamaDetectada = true;
  }

  if (lecturasNormales >= LECTURAS_PARA_ALERTA) {
    llamaDetectada = false;
  }

  console.log(
    `LECTURA: ${valor} | ` +
    `UMBRAL: ${UMBRAL_LLAMA} | ` +
    `BAJAS: ${lecturasConsecutivas} | ` +
    `NORMALES: ${lecturasNormales} | ` +
    `ALERTA: ${llamaDetectada ? 'ACTIVA' : 'NORMAL'}`
  );

  const ahora = Date.now();

  const cambioEstado =
    estadoLlamaGuardado !== llamaDetectada;

  const actualizarLectura =
    ahora - ultimaActualizacionLlama >= 2000;

  if (!cambioEstado && !actualizarLectura) {
    return;
  }

  try {
    await db.collection('maquina')
      .doc('seguridad')
      .set({
        llamaDetectada,
        lecturaLlama,
        sensorActualizado: FieldValue.serverTimestamp(),
      }, { merge: true });

    estadoLlamaGuardado = llamaDetectada;
    ultimaActualizacionLlama = ahora;

    console.log(
      'FIREBASE ACTUALIZADO:',
      llamaDetectada ? 'ALERTA ACTIVA' : 'NORMAL'
    );

    io.emit('seguridad', {
      llamaDetectada,
      lecturaLlama,
    });

  } catch (error) {
    console.error(
      'ERROR ACTUALIZANDO FIREBASE:',
      error.message
    );
  }
}

// ============================================
// ESTADO DE ARDUINOS
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
      reject(
        new Error('Arduino de entregas no está conectado.')
      );
      return;
    }

    if (comandoPendiente) {
      reject(
        new Error('Hay otro comando en proceso.')
      );
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

      for (
        let indiceItem = 0;
        indiceItem < pedido.productos.length;
        indiceItem++
      ) {
        const item = pedido.productos[indiceItem];
        const producto = item.producto;

        for (
          let unidad = 0;
          unidad < item.solicitada;
          unidad++
        ) {
          if (inventario[producto] <= 0) {
            item.fallidas++;
            item.resultados.push('SIN_EXISTENCIAS');

            emitirProgreso(pedido);
            continue;
          }

          try {
            pedido.mensaje =
              `Entregando ${productos[producto].nombre} ` +
              `${productos[producto].presentacion}.`;

            emitirProgreso(pedido);

            const resultado = await dispensarProducto(producto);

            if (resultado === 'OK') {

              // Arduino confirmó la entrega.
              item.entregadas++;
              item.resultados.push('OK');

              try {
                await registrarEntregaConfirmada(
                  producto,
                  pedido.usuario,
                  pedido.id,
                  indiceItem,
                  unidad
                );

              } catch (error) {
                console.error(
                  'ERROR GUARDANDO LA VENTA:',
                  error.message
                );

                pedido.mensaje =
                  'Arduino entregó el producto, pero hubo un error al actualizar Firebase.';

                detenerPedido = true;
              }

            } else if (resultado === 'EMPTY') {

              item.fallidas++;
              item.resultados.push('SIN_EXISTENCIAS');

            } else {

              item.fallidas++;
              item.resultados.push(resultado);

            }

            emitirProgreso(pedido);

            if (detenerPedido) break;

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

      pedido.estado = detenerPedido
        ? 'error'
        : 'completado';

      pedido.mensaje = detenerPedido
        ? 'El pedido se detuvo por un problema de comunicación o registro.'
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
// RECIBIR MENSAJES DE ARDUINO
// ============================================

function procesarMensajeArduino(mensaje, origen) {
  if (!mensaje) return;

  console.log(`[${origen}] ${mensaje}`);

  const partes = mensaje.split(',');
  const tipo = partes[0];

  // SENSOR DE LLAMA
  if (tipo === 'LLAMA') {
    if (origen === 'ARDUINO1') {
      void procesarLecturaLlama(partes[1]);
    }

    return;
  }

  // ARDUINO LISTO
  if (tipo === 'READY') {
    console.log(`${origen} está listo.`);
  }

  // INVENTARIO
  else if (tipo === 'STOCK') {
    const producto = partes[1];
    const cantidad = Number(partes[2]);

    if (
      Object.prototype.hasOwnProperty.call(inventario, producto) &&
      Number.isInteger(cantidad) &&
      cantidad >= 0 &&
      cantidad <= 4
    ) {
      // IMPORTANTE:
      // Este mensaje representa el inventario físico informado
      // por Arduino. No debe enviarse una lectura antigua después
      // de una venta. Arduino debe informar el stock actualizado.

      inventario[producto] = cantidad;

      enviarInventario();

      void sincronizarInventario(producto, cantidad);
    }
  }

  // EVENTOS
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

  // RESULTADO DE ENTREGA
  else if (
    tipo === 'RESULT' &&
    partes[1] === 'DISPENSE'
  ) {
    const producto = partes[2];
    const resultado = partes[3];

    if (origen !== `ARDUINO${PUERTO_ENTREGA}`) {
      console.log(
        'Resultado ignorado: Arduino secundario.'
      );
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

    } else {
      console.log(
        'Respuesta sin comando pendiente ignorada:',
        mensaje
      );
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

  // BANDA LLENA
  else if (tipo === 'FULL') {
    io.emit('inventoryEvent', {
      accion: 'FULL',
      producto: partes[1],
      nombre: productos[partes[1]]?.nombre || partes[1],
      mensaje: 'La banda está llena.',
      arduino: origen,
    });
  }

  // PRODUCTO DESCONOCIDO
  else if (tipo === 'UNKNOWN') {
    io.emit('inventoryEvent', {
      accion: 'UNKNOWN',
      mensaje: 'Envase no reconocido.',
      arduino: origen,
    });
  }
}

// ============================================
// CONECTAR ARDUINO
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
// CREAR PEDIDO
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
        mensaje:
          `No hay suficientes existencias de ` +
          `${productos[producto].nombre} ` +
          `${productos[producto].presentacion}.`,
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
// SEGURIDAD
// ============================================

app.get('/seguridad', (req, res) => {
  res.json({
    llamaDetectada,
    lecturaLlama,
    umbral: UMBRAL_LLAMA,
    lecturasConsecutivas,
    lecturasNormales,
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
    console.error(
      'Error al consultar ventas:',
      error.message
    );

    res.status(500).json({
      error: 'No se pudo obtener el historial de ventas.',
    });
  }
});

// ============================================
// HISTORIAL DE MOVIMIENTOS
// ============================================

app.get('/movimientos', async (req, res) => {
  try {
    const resultado = await db
      .collection('movimientos')
      .orderBy('fecha', 'desc')
      .get();

    const movimientos = resultado.docs.map((documento) => {
      const datos = documento.data();

      return {
        id: documento.id,
        pedidoId: datos.pedidoId,
        producto: datos.producto,
        nombre: datos.nombre,
        presentacion: datos.presentacion,
        tipo: datos.tipo,
        cantidad: datos.cantidad,
        cantidadAnterior: datos.cantidadAnterior,
        cantidadRestante: datos.cantidadRestante,
        usuario: datos.usuario || null,

        fecha: datos.fecha
          ? datos.fecha.toDate().toISOString()
          : null,
      };
    });

    res.json(movimientos);

  } catch (error) {
    console.error(
      'Error consultando movimientos:',
      error.message
    );

    res.status(500).json({
      ok: false,
      mensaje: 'No se pudo obtener el historial de movimientos.',
    });
  }
});

app.post('/api/asistente', async (req, res) => {
  try {
    const { pregunta, modo, datos } = req.body;

    if (!pregunta || !pregunta.trim()) {
      return res.status(400).json({
        error: 'Debes escribir una pregunta.',
      });
    }

    const gemini = await obtenerGemini();

    const instrucciones = `
Eres el asistente inteligente de SMARTGO,
una aplicación de clasificación y venta de bebidas.

Tu función depende del tipo de usuario:

${modo === 'admin'
  ? 'Eres el asistente administrativo. Ayuda a analizar ventas, inventario y existencias.'
  : 'Eres el asistente de un cliente. Ayuda con sus compras y recomendaciones de bebidas.'}

Utiliza únicamente los datos proporcionados.
No inventes ventas, cantidades ni compras.
Responde en español, de forma clara, amable y útil.

Datos disponibles:
${JSON.stringify(datos || {}, null, 2)}

Pregunta del usuario:
${pregunta}
`;

    const resultado = await gemini.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: instrucciones,
    });

    res.json({
      respuesta: resultado.text || 'No pude generar una respuesta.',
    });

  } catch (error) {
    console.error('Error en el asistente Gemini:', error);

    res.status(500).json({
      error: 'No se pudo obtener una respuesta de Gemini.',
    });
  }
});

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
    console.log(
      'Aplicación desconectada:',
      socket.id
    );
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