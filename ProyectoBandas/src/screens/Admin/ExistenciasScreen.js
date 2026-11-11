
import React, { useEffect, useState, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { io } from 'socket.io-client';

// CAMBIA ESTA IP POR LA DIRECCIÓN IPv4 DE TU COMPUTADORA
const SERVER_URL = 'http://192.168.1.120:3000';

const CAPACIDAD_MAXIMA = 4;

// PRODUCTOS DE LA MÁQUINA
const productos = [
  {
    id: 'COCA_LATA',
    nombre: 'Coca-Cola',
    presentacion: 'Lata · 355 ml',
    banda: 'BANDA 01',
    color: '#E31E32',
    simbolo: 'C',
  },
  {
    id: 'COCA_BOTELLA',
    nombre: 'Coca-Cola',
    presentacion: 'Botella · 500 ml',
    banda: 'BANDA 02',
    color: '#E31E32',
    simbolo: 'C',
  },
  {
    id: 'PEPSI_LATA',
    nombre: 'Pepsi',
    presentacion: 'Lata · 355 ml',
    banda: 'BANDA 03',
    color: '#1769C2',
    simbolo: 'P',
  },
];

const inventarioInicial = {
  COCA_LATA: 0,
  COCA_BOTELLA: 0,
  PEPSI_LATA: 0,
};

// COMPONENTE DE CADA PRODUCTO
function BandaCard({
  producto,
  cantidad,
  conectado,
  pendiente,
  solicitar,
}) {
  const porcentaje = Math.max(
    0,
    Math.min(100, (cantidad / CAPACIDAD_MAXIMA) * 100)
  );

  let estado = 'Disponible';
  let colorEstado = '#16A36A';

  if (cantidad === 0) {
    estado = 'Agotada';
    colorEstado = '#DC3545';
  } else if (cantidad === CAPACIDAD_MAXIMA) {
    estado = 'Llena';
    colorEstado = '#1769C2';
  } else if (cantidad <= 1) {
    estado = 'Poca existencia';
    colorEstado = '#D99016';
  }

  const botonDeshabilitado =
    !conectado || cantidad <= 0 || pendiente;

  return (
    <View style={styles.productCard}>

      <View style={styles.productHeader}>

        <View
          style={[
            styles.productIcon,
            { backgroundColor: producto.color },
          ]}
        >
          <Text style={styles.productIconText}>
            {producto.simbolo}
          </Text>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>
            {producto.nombre}
          </Text>

          <Text style={styles.productPresentation}>
            {producto.presentacion}
          </Text>
        </View>

        <View style={styles.bandBadge}>
          <Text style={styles.bandText}>
            {producto.banda}
          </Text>
        </View>

      </View>

      <View style={styles.stockRow}>
        <Text style={styles.stockLabel}>
          Existencias actuales
        </Text>

        <Text style={styles.stockNumber}>
          {cantidad}
          <Text style={styles.stockTotal}> / 4</Text>
        </Text>
      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${porcentaje}%`,
              backgroundColor: producto.color,
            },
          ]}
        />
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: colorEstado },
          ]}
        />

        <Text
          style={[
            styles.statusText,
            { color: colorEstado },
          ]}
        >
          {estado}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.dispenseButton,
          botonDeshabilitado && styles.disabledButton,
        ]}
        disabled={botonDeshabilitado}
        onPress={() => solicitar(producto.id)}
        activeOpacity={0.8}
      >
        {pendiente ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.dispenseButtonText}>
            {cantidad === 0
              ? 'Sin existencias'
              : !conectado
              ? 'Máquina desconectada'
              : 'Entregar bebida'}
          </Text>
        )}
      </TouchableOpacity>

    </View>
  );
}

// PANTALLA PRINCIPAL
export default function ExistenciasScreen() {

  const [inventario, setInventario] = useState(inventarioInicial);

  const [conectado, setConectado] = useState(false);

  const [mensaje, setMensaje] = useState(
    'Conectando con el servidor...'
  );

  const [pedidoPendiente, setPedidoPendiente] = useState(null);

  const [ultimoEvento, setUltimoEvento] = useState(
    'Esperando actividad de la máquina'
  );

  const [conectando, setConectando] = useState(true);

  const socketRef = useRef(null);

  // CONEXIÓN CON SERVER.JS
  useEffect(() => {

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // CONEXIÓN DEL SERVIDOR
    socket.on('connect', () => {
      setMensaje('Conectado al servidor');
      setConectando(false);
    });

    // DESCONEXIÓN
    socket.on('disconnect', () => {
      setConectado(false);
      setMensaje('Conexión perdida con el servidor');
      setConectando(false);
    });

    // ERROR DE CONEXIÓN
    socket.on('connect_error', () => {
      setConectado(false);
      setMensaje('No se pudo conectar con el servidor');
      setConectando(false);
    });

    // ESTADO DEL ARDUINO
    socket.on('connectionStatus', (estado) => {

      const disponible =
        typeof estado === 'object'
          ? Boolean(estado.connected)
          : Boolean(estado);

      setConectado(disponible);

      setMensaje(
        disponible
          ? 'Arduino conectado y listo'
          : 'Arduino desconectado'
      );
    });

    // ACTUALIZACIÓN DEL INVENTARIO
    socket.on('stock', (datos) => {

      if (!datos || typeof datos !== 'object') {
        return;
      }

      setInventario((anterior) => {

        const nuevoInventario = { ...anterior };

        productos.forEach((producto) => {

          const valor = datos[producto.id];

          if (
            valor !== undefined &&
            Number.isFinite(Number(valor))
          ) {
            nuevoInventario[producto.id] = Math.max(
              0,
              Math.min(CAPACIDAD_MAXIMA, Number(valor))
            );
          }

        });

        return nuevoInventario;
      });

    });

    // RESPUESTA INICIAL DEL PEDIDO
    socket.on('pedido:respuesta', (respuesta) => {

      if (respuesta?.ok === false) {
        setPedidoPendiente(null);

        setUltimoEvento(
          respuesta.mensaje || 'No se pudo procesar el pedido'
        );
      }

      if (respuesta?.ok === true) {
        setUltimoEvento(
          'Pedido recibido por la máquina'
        );
      }

    });

    // RESULTADO FINAL DEL PEDIDO
    socket.on('pedido:resultado', (resultado) => {

      setPedidoPendiente(null);

      if (resultado?.mensaje) {
        setUltimoEvento(resultado.mensaje);
      } else if (resultado?.resultado) {
        setUltimoEvento(resultado.resultado);
      } else {
        setUltimoEvento('Proceso de entrega finalizado');
      }

    });

    // EVENTOS DE ENTRADA Y SALIDA
    socket.on('inventoryEvent', (evento) => {

      if (!evento) return;

      const accion = evento.accion || evento.tipo || '';
      const producto = evento.producto || '';

      setUltimoEvento(
        `${accion} ${producto}`.trim() ||
        'Actividad registrada en la máquina'
      );

    });

    // LIMPIAR CONEXIÓN
    return () => {

      socket.removeAllListeners();
      socket.disconnect();

      socketRef.current = null;

    };

  }, []);

  // SOLICITAR ENTREGA DE BEBIDA
  const solicitarBebida = (producto) => {

    if (!conectado) {
      setUltimoEvento('La máquina no está conectada');
      return;
    }

    if (inventario[producto] <= 0) {
      setUltimoEvento('No hay existencias de esta bebida');
      return;
    }

    if (pedidoPendiente !== null) {
      setUltimoEvento('Ya hay un pedido en proceso');
      return;
    }

    const socket = socketRef.current;

    if (!socket || !socket.connected) {
      setUltimoEvento('No hay conexión con el servidor');
      return;
    }

    setPedidoPendiente(producto);

    setUltimoEvento('Enviando solicitud de entrega...');

    socket.emit('pedido', {
      producto: producto,
    });

  };

  // CÁLCULOS DEL RESUMEN
  const totalBebidas = Object.values(inventario).reduce(
    (total, cantidad) => total + cantidad,
    0
  );

  const bandasActivas = productos.filter(
    (producto) => inventario[producto.id] > 0
  ).length;

  return (

    <SafeAreaView style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* ENCABEZADO */}

        <View style={styles.header}>

          <View>
            <Text style={styles.brand}>
              SMART VENDING SYSTEM
            </Text>

            <Text style={styles.title}>
              Control de existencias
            </Text>

            <Text style={styles.subtitle}>
              Administración de bebidas
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>SV</Text>
          </View>

        </View>

        {/* CONEXIÓN */}

        <View style={styles.connectionCard}>

          <View style={styles.connectionLeft}>

            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: conectado
                    ? '#16A36A'
                    : '#DC3545',
                },
              ]}
            />

            <View>
              <Text style={styles.connectionTitle}>
                Estado de la máquina
              </Text>

              <Text style={styles.connectionMessage}>
                {mensaje}
              </Text>
            </View>

          </View>

          {conectando && (
            <ActivityIndicator color="#1769C2" />
          )}

          {!conectando && (
            <Text
              style={[
                styles.connectionStatus,
                {
                  color: conectado
                    ? '#16A36A'
                    : '#DC3545',
                },
              ]}
            >
              {conectado ? 'ONLINE' : 'OFFLINE'}
            </Text>
          )}

        </View>

        {/* RESUMEN */}

        <Text style={styles.sectionTitle}>
          Resumen general
        </Text>

        <View style={styles.summaryContainer}>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Bebidas disponibles
            </Text>

            <Text style={styles.summaryNumber}>
              {totalBebidas}
            </Text>

            <Text style={styles.summaryDescription}>
              Unidades en inventario
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Bandas activas
            </Text>

            <Text style={styles.summaryNumber}>
              {bandasActivas}
              <Text style={styles.summaryTotal}> / 3</Text>
            </Text>

            <Text style={styles.summaryDescription}>
              Bandas con existencias
            </Text>
          </View>

        </View>

        {/* INVENTARIO */}

        <View style={styles.sectionHeader}>

          <Text style={styles.sectionTitle}>
            Inventario de bebidas
          </Text>

          <Text style={styles.capacityText}>
            Capacidad: 4 por banda
          </Text>

        </View>

        {productos.map((producto) => (

          <BandaCard
            key={producto.id}
            producto={producto}
            cantidad={inventario[producto.id]}
            conectado={conectado}
            pendiente={pedidoPendiente === producto.id}
            solicitar={solicitarBebida}
          />

        ))}

        {/* ACTIVIDAD */}

        <Text style={styles.sectionTitle}>
          Actividad reciente
        </Text>

        <View style={styles.activityCard}>

          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>↻</Text>
          </View>

          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>
              Último movimiento
            </Text>

            <Text style={styles.activityMessage}>
              {ultimoEvento}
            </Text>
          </View>

        </View>

        {/* INFORMACIÓN */}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Información del sistema
          </Text>

          <Text style={styles.infoText}>
            Las existencias se actualizan automáticamente
            cuando el Arduino registra cambios en las bandas.
          </Text>
        </View>

        <Text style={styles.footer}>
          SMART VENDING SYSTEM · CONTROL DE INVENTARIO
        </Text>

      </ScrollView>

    </SafeAreaView>

  );

}

// ESTILOS
const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F3F5F9',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 35,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },

  brand: {
    color: '#D71930',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 7,
  },

  title: {
    color: '#172033',
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    color: '#7B8494',
    fontSize: 13,
    marginTop: 5,
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#172033',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  connectionDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 12,
  },

  connectionTitle: {
    color: '#172033',
    fontWeight: '700',
    fontSize: 14,
  },

  connectionMessage: {
    color: '#8992A1',
    fontSize: 12,
    marginTop: 4,
  },

  connectionStatus: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  sectionTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
  },

  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 27,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  summaryLabel: {
    color: '#7B8494',
    fontSize: 11,
    fontWeight: '600',
  },

  summaryNumber: {
    color: '#172033',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },

  summaryTotal: {
    color: '#A0A8B5',
    fontSize: 17,
  },

  summaryDescription: {
    color: '#A0A8B5',
    fontSize: 10,
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  capacityText: {
    color: '#8992A1',
    fontSize: 10,
  },

  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },

  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },

  productIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  productIconText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },

  productInfo: {
    flex: 1,
    marginLeft: 12,
  },

  productName: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '800',
  },

  productPresentation: {
    color: '#8992A1',
    fontSize: 12,
    marginTop: 4,
  },

  bandBadge: {
    backgroundColor: '#F0F2F6',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 7,
  },

  bandText: {
    color: '#687386',
    fontSize: 9,
    fontWeight: '800',
  },

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  stockLabel: {
    color: '#7B8494',
    fontSize: 12,
  },

  stockNumber: {
    color: '#172033',
    fontSize: 19,
    fontWeight: '900',
  },

  stockTotal: {
    color: '#A0A8B5',
    fontSize: 13,
  },

  progressBackground: {
    height: 8,
    backgroundColor: '#EDF0F4',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 15,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    marginRight: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  dispenseButton: {
    backgroundColor: '#172033',
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },

  disabledButton: {
    backgroundColor: '#AAB1BC',
  },

  dispenseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF3FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityIconText: {
    color: '#1769C2',
    fontSize: 23,
    fontWeight: '700',
  },

  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },

  activityTitle: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '800',
  },

  activityMessage: {
    color: '#8992A1',
    fontSize: 11,
    marginTop: 4,
  },

  infoCard: {
    backgroundColor: '#E9EEF6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 25,
  },

  infoTitle: {
    color: '#26364F',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
  },

  infoText: {
    color: '#66758B',
    fontSize: 11,
    lineHeight: 18,
  },

  footer: {
    color: '#A0A8B5',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
  },

});
