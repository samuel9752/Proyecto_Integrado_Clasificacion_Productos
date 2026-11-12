
import React, { useEffect, useState, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { io } from 'socket.io-client';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

// DIRECCIÓN DEL SERVIDOR
const SERVER_URL = 'http://192.168.1.120:3000';

const CAPACIDAD_MAXIMA = 4;

// PRODUCTOS DE LA MÁQUINA
const productos = [
  {
    id: 'COCA_LATA',
    nombre: 'Coca-Cola',
    presentacion: 'Lata · 355 ml',
    banda: 'BANDA 01',
    color: '#E5252A',
    simbolo: 'C',
    icono: 'local-drink',
  },
  {
    id: 'COCA_BOTELLA',
    nombre: 'Coca-Cola',
    presentacion: 'Botella · 500 ml',
    banda: 'BANDA 02',
    color: '#E5252A',
    simbolo: 'C',
    icono: 'water-drop',
  },
  {
    id: 'PEPSI_LATA',
    nombre: 'Pepsi',
    presentacion: 'Lata · 355 ml',
    banda: 'BANDA 03',
    color: '#1769C2',
    simbolo: 'P',
    icono: 'local-drink',
  },
];

const inventarioInicial = {
  COCA_LATA: 0,
  COCA_BOTELLA: 0,
  PEPSI_LATA: 0,
};

// ==========================================
// TARJETA DE CADA PRODUCTO
// ==========================================

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

      {/* ENCABEZADO DEL PRODUCTO */}

      <View style={styles.productHeader}>

        <View
          style={[
            styles.productIcon,
            { backgroundColor: producto.color }
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

      {/* EXISTENCIAS */}

      <View style={styles.stockRow}>

        <Text style={styles.stockLabel}>
          Existencias actuales
        </Text>

        <Text style={styles.stockNumber}>
          {cantidad}
          <Text style={styles.stockTotal}> / 4</Text>
        </Text>

      </View>

      {/* BARRA DE PROGRESO */}

      <View style={styles.progressBackground}>

        <View
          style={[
            styles.progressFill,
            {
              width: `${porcentaje}%`,
              backgroundColor: producto.color,
            }
          ]}
        />

      </View>

      {/* ESTADO */}

      <View style={styles.statusRow}>

        <View
          style={[
            styles.statusDot,
            { backgroundColor: colorEstado }
          ]}
        />

        <Text
          style={[
            styles.statusText,
            { color: colorEstado }
          ]}
        >
          {estado}
        </Text>

      </View>

      {/* BOTÓN */}

      <TouchableOpacity
        style={[
          styles.dispenseButton,
          botonDeshabilitado && styles.disabledButton,
        ]}
        disabled={botonDeshabilitado}
        onPress={() => solicitar(producto.id)}
        activeOpacity={0.85}
      >

        {pendiente ? (

          <ActivityIndicator color="#FFFFFF" />

        ) : (

          <>

            <MaterialIcons
              name="local-shipping"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.dispenseButtonText}>
              {cantidad === 0
                ? 'Sin existencias'
                : !conectado
                ? 'Máquina desconectada'
                : 'Entregar bebida'}
            </Text>

          </>

        )}

      </TouchableOpacity>

    </View>

  );

}

// ==========================================
// PANTALLA PRINCIPAL
// ==========================================

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

  // ========================================
  // CONEXIÓN CON SERVER.JS
  // ========================================

  useEffect(() => {

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // CONECTADO AL SERVIDOR

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

    // RESPUESTA DEL PEDIDO

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

    // RESULTADO FINAL

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

  // ========================================
  // SOLICITAR ENTREGA
  // ========================================

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

  // ========================================
  // RESUMEN DEL INVENTARIO
  // ========================================

  const totalBebidas = Object.values(inventario).reduce(
    (total, cantidad) => total + cantidad,
    0
  );

  const bandasActivas = productos.filter(
    (producto) => inventario[producto.id] > 0
  ).length;

  return (

    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >

      <StatusBar barStyle="light-content" />

      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ENCABEZADO */}

          <View style={styles.header}>

            <View style={styles.brandContainer}>

              <Image
                source={MiLogo}
                style={styles.logo}
                resizeMode="contain"
              />

              <View>

                <Text style={styles.brand}>
                  SMARTGO
                </Text>

              </View>

            </View>

            <View style={styles.headerIcon}>

              <MaterialIcons
                name="inventory-2"
                size={27}
                color="#FFFFFF"
              />

            </View>

          </View>

          {/* TÍTULO */}

          <View style={styles.titleContainer}>

            <Text style={styles.welcome}>
              ADMINISTRACIÓN
            </Text>

            <Text style={styles.title}>
              Control de existencias
            </Text>

            <Text style={styles.subtitle}>
              Supervisa el inventario y controla las bebidas de tu máquina.
            </Text>

          </View>

          {/* CONEXIÓN */}

          <View style={styles.connectionCard}>

            <View style={styles.connectionLeft}>

              <View
                style={[
                  styles.connectionDot,
                  {
                    backgroundColor: conectado
                      ? '#20C77A'
                      : '#E5252A',
                  },
                ]}
              />

              <View style={{ flex: 1 }}>

                <Text style={styles.connectionTitle}>
                  Estado de la máquina
                </Text>

                <Text style={styles.connectionMessage}>
                  {mensaje}
                </Text>

              </View>

            </View>

            {conectando ? (

              <ActivityIndicator color="#1769C2" />

            ) : (

              <View
                style={[
                  styles.connectionBadge,
                  {
                    backgroundColor: conectado
                      ? '#E5F8ED'
                      : '#FCE8E9',
                  }
                ]}
              >

                <Text
                  style={[
                    styles.connectionStatus,
                    {
                      color: conectado
                        ? '#16834D'
                        : '#DC3545',
                    },
                  ]}
                >
                  {conectado ? 'ONLINE' : 'OFFLINE'}
                </Text>

              </View>

            )}

          </View>

          {/* RESUMEN */}

          <Text style={styles.sectionTitle}>
            Resumen general
          </Text>

          <View style={styles.summaryContainer}>

            <View style={styles.summaryCard}>

              <View style={styles.summaryIcon}>
                <MaterialIcons
                  name="inventory"
                  size={23}
                  color="#1769C2"
                />
              </View>

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

              <View style={styles.summaryIcon}>
                <MaterialIcons
                  name="view-week"
                  size={23}
                  color="#1769C2"
                />
              </View>

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

            <View>

              <Text style={styles.sectionTitle}>
                Inventario de bebidas
              </Text>

              <Text style={styles.sectionSubtitle}>
                Existencias por cada banda
              </Text>

            </View>

            <View style={styles.capacityBadge}>

              <Text style={styles.capacityText}>
                MÁX. 4
              </Text>

            </View>

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

          {/* ACTIVIDAD RECIENTE */}

          <Text style={styles.sectionTitle}>
            Actividad reciente
          </Text>

          <View style={styles.activityCard}>

            <View style={styles.activityIcon}>

              <MaterialIcons
                name="history"
                size={25}
                color="#1769C2"
              />

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

            <MaterialIcons
              name="info-outline"
              size={24}
              color="#1769C2"
            />

            <View style={styles.infoContent}>

              <Text style={styles.infoTitle}>
                Información del sistema
              </Text>

              <Text style={styles.infoText}>
                Las existencias se actualizan automáticamente
                cuando el Arduino registra cambios en las bandas.
              </Text>

            </View>

          </View>

          {/* PIE DE PÁGINA */}

          <View style={styles.footer}>

            <Image
              source={MiLogo}
              style={styles.footerLogo}
              resizeMode="contain"
            />

            <Text style={styles.footerTitle}>
              SMARTGO
            </Text>

            <Text style={styles.footerSubtitle}>
              CONTROL DE INVENTARIO
            </Text>

            <View style={styles.footerLines}>
              <View style={styles.redLine} />
              <View style={styles.blueLine} />
            </View>

          </View>

        </ScrollView>

      </SafeAreaView>

    </ImageBackground>

  );

}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({

  background: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 17, 39, 0.78)',
  },

  scrollContent: {
    padding: 19,
    paddingTop: 20,
    paddingBottom: 35,
  },

  // ENCABEZADO

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 27,
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 55,
    height: 55,
    borderRadius: 12,
    marginRight: 12,
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  brandSubtitle: {
    color: '#55B8FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginTop: 3,
  },

  headerIcon: {
    width: 49,
    height: 49,
    borderRadius: 15,
    backgroundColor: '#1264A8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#51B5F5',
  },

  // TÍTULO

  titleContainer: {
    marginBottom: 22,
  },

  welcome: {
    color: '#55B8FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 7,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  subtitle: {
    color: '#C1D4E9',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 19,
  },

  // CONEXIÓN

  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 26,
    elevation: 5,
  },

  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },

  connectionDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 12,
  },

  connectionTitle: {
    color: '#173653',
    fontWeight: '900',
    fontSize: 13,
  },

  connectionMessage: {
    color: '#718096',
    fontSize: 10,
    marginTop: 5,
  },

  connectionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },

  connectionStatus: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // SECCIONES

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 14,
  },

  sectionSubtitle: {
    color: '#A9C5E8',
    fontSize: 11,
    marginTop: -8,
    marginBottom: 14,
  },

  // RESUMEN

  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 28,
    gap: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    elevation: 5,
  },

  summaryIcon: {
    width: 39,
    height: 39,
    borderRadius: 11,
    backgroundColor: '#EAF4FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  summaryLabel: {
    color: '#718096',
    fontSize: 10,
    fontWeight: '700',
  },

  summaryNumber: {
    color: '#173653',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 7,
  },

  summaryTotal: {
    color: '#8A9AAF',
    fontSize: 16,
  },

  summaryDescription: {
    color: '#8A9AAF',
    fontSize: 9,
    marginTop: 5,
  },

  // INVENTARIO

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  capacityBadge: {
    backgroundColor: '#DCEEFF',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 14,
  },

  capacityText: {
    color: '#1766A8',
    fontSize: 9,
    fontWeight: '900',
  },

  // TARJETAS DE PRODUCTOS

  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 17,
    marginBottom: 15,
    elevation: 5,
  },

  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 19,
  },

  productIcon: {
    width: 47,
    height: 47,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  productIconText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  productInfo: {
    flex: 1,
    marginLeft: 12,
  },

  productName: {
    color: '#173653',
    fontSize: 15,
    fontWeight: '900',
  },

  productPresentation: {
    color: '#8290A2',
    fontSize: 11,
    marginTop: 5,
  },

  bandBadge: {
    backgroundColor: '#EAF4FC',
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 7,
  },

  bandText: {
    color: '#1766A8',
    fontSize: 8,
    fontWeight: '900',
  },

  // EXISTENCIAS

  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  stockLabel: {
    color: '#718096',
    fontSize: 11,
    fontWeight: '600',
  },

  stockNumber: {
    color: '#173653',
    fontSize: 21,
    fontWeight: '900',
  },

  stockTotal: {
    color: '#9AA8B8',
    fontSize: 13,
  },

  // PROGRESO

  progressBackground: {
    height: 9,
    backgroundColor: '#E8EDF3',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  // ESTADO

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    marginBottom: 16,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginRight: 8,
  },

  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },

  // BOTÓN DE ENTREGA

  dispenseButton: {
    backgroundColor: '#145B9A',
    paddingVertical: 14,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 47,
    flexDirection: 'row',
    gap: 9,
  },

  disabledButton: {
    backgroundColor: '#8999AA',
  },

  dispenseButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // ACTIVIDAD

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
    elevation: 4,
  },

  activityIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityInfo: {
    flex: 1,
    marginLeft: 13,
  },

  activityTitle: {
    color: '#173653',
    fontSize: 13,
    fontWeight: '900',
  },

  activityMessage: {
    color: '#718096',
    fontSize: 11,
    marginTop: 5,
  },

  // INFORMACIÓN

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    elevation: 4,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: '#173653',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },

  infoText: {
    color: '#718096',
    fontSize: 10,
    lineHeight: 17,
  },

  // PIE DE PÁGINA

  footer: {
    alignItems: 'center',
    padding: 17,
    backgroundColor: 'rgba(9, 34, 65, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#28517A',
  },

  footerLogo: {
    width: 43,
    height: 43,
    borderRadius: 10,
    marginBottom: 8,
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },

  footerSubtitle: {
    color: '#7DBCEB',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 5,
  },

  footerLines: {
    flexDirection: 'row',
    width: 75,
    height: 4,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 13,
  },

  redLine: {
    flex: 1,
    backgroundColor: '#E5252A',
  },

  blueLine: {
    flex: 1,
    backgroundColor: '#087BCE',
  },

});
