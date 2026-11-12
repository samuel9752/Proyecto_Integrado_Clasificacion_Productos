
import React, { useState, useEffect, useCallback } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Image,
  ImageBackground,
  StatusBar,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

const API_URL = 'http://192.168.1.120:3000/ventas';

export default function HistorialVentasScreen() {

  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  // ========================================
  // CARGAR VENTAS
  // ========================================

  const cargarVentas = useCallback(async () => {

    try {

      setError('');

      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error('Error al consultar las ventas');
      }

      const datos = await respuesta.json();

      setVentas(Array.isArray(datos) ? datos : []);

    } catch (e) {

      setError(
        'No se pudo conectar con el servidor. Comprueba que esté encendido y que uses la IP correcta.'
      );

    } finally {

      setCargando(false);
      setActualizando(false);

    }

  }, []);

  useEffect(() => {

    cargarVentas();

  }, [cargarVentas]);

  // ========================================
  // ACTUALIZAR
  // ========================================

  const actualizarHistorial = () => {

    setActualizando(true);
    cargarVentas();

  };

  // ========================================
  // CÁLCULOS
  // ========================================

  const totalIngresos = ventas.reduce((suma, venta) => {

    return suma +
      (Number(venta.precio) || 0) *
      (Number(venta.cantidad) || 1);

  }, 0);

  const totalBebidas = ventas.reduce((suma, venta) => {

    return suma + (Number(venta.cantidad) || 1);

  }, 0);

  const comprasPorUsuario = {};

  ventas.forEach((venta) => {

    const uid = venta.usuario?.uid;

    if (!uid) return;

    comprasPorUsuario[uid] =
      (comprasPorUsuario[uid] || 0) +
      (Number(venta.cantidad) || 1);

  });

  // ========================================
  // FORMATO DE FECHA
  // ========================================

  const fechaTexto = (fecha) => {

    if (!fecha) return 'Fecha no disponible';

    const valor = fecha.toDate
      ? fecha.toDate()
      : new Date(fecha);

    if (isNaN(valor.getTime())) {
      return 'Fecha no disponible';
    }

    return valor.toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  };

  // ========================================
  // COLOR DEL PRODUCTO
  // ========================================

  const colorProducto = (producto) => {

    return producto?.includes('PEPSI')
      ? '#1769C2'
      : '#E5252A';

  };

  // ========================================
  // TARJETA DE VENTA
  // ========================================

  const VentaCard = ({ venta, index }) => {

    const usuario = venta.usuario || {};

    const uid = usuario.uid;

    const cantidad = Number(venta.cantidad) || 1;

    const precioUnitario = Number(venta.precio) || 0;

    const total = precioUnitario * cantidad;

    const esPepsi = venta.producto?.includes('PEPSI');

    const bebidasUsuario = uid
      ? comprasPorUsuario[uid] || 0
      : null;

    return (

      <View style={styles.ventaCard}>

        {/* ENCABEZADO DE VENTA */}

        <View style={styles.ventaHeader}>

          <View
            style={[
              styles.productIcon,
              { backgroundColor: colorProducto(venta.producto) }
            ]}
          >

            <Text style={styles.productIconText}>
              {esPepsi ? 'P' : 'C'}
            </Text>

          </View>

          <View style={styles.productInfo}>

            <Text style={styles.productName}>
              {venta.nombre || venta.producto || 'Bebida'}
            </Text>

            <Text style={styles.productPresentation}>
              {venta.presentacion || 'Presentación no especificada'}
            </Text>

          </View>

          <View style={styles.priceContainer}>

            <Text style={styles.price}>
              Q{total.toFixed(2)}
            </Text>

            <Text style={styles.unitPrice}>
              Q{precioUnitario.toFixed(2)} c/u
            </Text>

          </View>

        </View>

        {/* CANTIDAD Y FECHA */}

        <View style={styles.saleDetails}>

          <View style={styles.detailRow}>

            <MaterialIcons
              name="shopping-bag"
              size={17}
              color="#1769C2"
            />

            <Text style={styles.detailText}>
              Cantidad comprada: {cantidad}
            </Text>

          </View>

          <View style={styles.detailRow}>

            <MaterialIcons
              name="calendar-month"
              size={17}
              color="#1769C2"
            />

            <Text style={styles.detailText}>
              {fechaTexto(venta.fecha)}
            </Text>

          </View>

        </View>

        {/* COMPRADOR */}

        <View style={styles.customerCard}>

          <View style={styles.customerHeader}>

            <View style={styles.customerIcon}>

              <MaterialIcons
                name="person"
                size={21}
                color="#1769C2"
              />

            </View>

            <Text style={styles.customerTitle}>
              Información del comprador
            </Text>

          </View>

          <View style={styles.customerDivider} />

          <View style={styles.customerRow}>

            <Text style={styles.customerLabel}>
              Nombre
            </Text>

            <Text style={styles.customerValue}>
              {usuario.nombre || 'No registrado'}
            </Text>

          </View>

          <View style={styles.customerRow}>

            <Text style={styles.customerLabel}>
              Correo
            </Text>

            <Text style={styles.customerValue}>
              {usuario.correo || 'No registrado'}
            </Text>

          </View>

          <View style={styles.customerRow}>

            <Text style={styles.customerLabel}>
              Identificador
            </Text>

            <Text
              style={styles.uid}
              numberOfLines={2}
            >
              {usuario.uid || 'No asociado'}
            </Text>

          </View>

          <View style={styles.customerTotal}>

            <MaterialIcons
              name="shopping-cart"
              size={17}
              color="#1769C2"
            />

            <Text style={styles.customerTotalText}>
              Bebidas compradas por este usuario: {
                bebidasUsuario === null
                  ? 'No disponible'
                  : bebidasUsuario
              }
            </Text>

          </View>

        </View>

        {/* IDENTIFICADOR DE VENTA */}

        <Text style={styles.saleNumber}>
          TRANSACCIÓN #{index + 1}
        </Text>

      </View>

    );

  };

  return (

    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >

      <StatusBar barStyle="light-content" />

      <View style={styles.overlay} />

      <View style={styles.safeArea}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}

          refreshControl={
            <RefreshControl
              refreshing={actualizando}
              onRefresh={actualizarHistorial}
              colors={['#1769C2']}
              tintColor="#FFFFFF"
            />
          }
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
                name="receipt-long"
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
              Historial de ventas
            </Text>

            <Text style={styles.subtitle}>
              Consulta las compras, los ingresos y la información de tus clientes.
            </Text>

          </View>

          {/* RESUMEN */}

          <Text style={styles.sectionTitle}>
            Resumen de ventas
          </Text>

          <View style={styles.summaryCard}>

            <View style={styles.summaryIconRed}>

              <MaterialIcons
                name="receipt"
                size={25}
                color="#FFFFFF"
              />

            </View>

            <View style={styles.summaryInfo}>

              <Text style={styles.summaryLabel}>
                VENTAS REGISTRADAS
              </Text>

              <Text style={styles.summaryNumber}>
                {ventas.length}
              </Text>

              <Text style={styles.summaryDescription}>
                Transacciones realizadas
              </Text>

            </View>

          </View>

          <View style={styles.summaryRow}>

            <View style={styles.smallSummaryCard}>

              <View style={styles.smallIcon}>

                <MaterialIcons
                  name="payments"
                  size={23}
                  color="#1769C2"
                />

              </View>

              <Text style={styles.smallLabel}>
                INGRESOS
              </Text>

              <Text style={styles.incomeNumber}>
                Q{totalIngresos.toFixed(2)}
              </Text>

              <Text style={styles.smallDescription}>
                Total recaudado
              </Text>

            </View>

            <View style={styles.smallSummaryCard}>

              <View style={styles.smallIcon}>

                <MaterialIcons
                  name="local-drink"
                  size={23}
                  color="#1769C2"
                />

              </View>

              <Text style={styles.smallLabel}>
                BEBIDAS VENDIDAS
              </Text>

              <Text style={styles.smallNumber}>
                {totalBebidas}
              </Text>

              <Text style={styles.smallDescription}>
                Unidades vendidas
              </Text>

            </View>

          </View>

          {/* LISTA DE VENTAS */}

          <View style={styles.listHeader}>

            <View style={{ flex: 1 }}>

              <Text style={styles.sectionTitle}>
                Ventas realizadas
              </Text>

              <Text style={styles.listSubtitle}>
                Detalle de cada compra
              </Text>

            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={actualizarHistorial}
              activeOpacity={0.8}
            >

              <MaterialIcons
                name="refresh"
                size={19}
                color="#FFFFFF"
              />

              <Text style={styles.refreshText}>
                Actualizar
              </Text>

            </TouchableOpacity>

          </View>

          {/* CARGANDO */}

          {cargando ? (

            <View style={styles.stateCard}>

              <ActivityIndicator
                size="large"
                color="#1769C2"
              />

              <Text style={styles.stateText}>
                Cargando historial de ventas...
              </Text>

            </View>

          ) : error ? (

            /* ERROR */

            <View style={styles.stateCard}>

              <MaterialIcons
                name="cloud-off"
                size={48}
                color="#E5252A"
              />

              <Text style={styles.emptyTitle}>
                Error de conexión
              </Text>

              <Text style={styles.stateText}>
                {error}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={actualizarHistorial}
              >

                <MaterialIcons
                  name="refresh"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.retryText}>
                  Reintentar
                </Text>

              </TouchableOpacity>

            </View>

          ) : ventas.length === 0 ? (

            /* SIN VENTAS */

            <View style={styles.stateCard}>

              <View style={styles.emptyIcon}>

                <MaterialIcons
                  name="receipt-long"
                  size={42}
                  color="#1769C2"
                />

              </View>

              <Text style={styles.emptyTitle}>
                Todavía no hay ventas
              </Text>

              <Text style={styles.stateText}>
                Las compras aparecerán aquí cuando el servidor
                registre las entregas confirmadas por Arduino.
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={actualizarHistorial}
              >

                <MaterialIcons
                  name="refresh"
                  size={18}
                  color="#FFFFFF"
                />

                <Text style={styles.retryText}>
                  Actualizar historial
                </Text>

              </TouchableOpacity>

            </View>

          ) : (

            /* VENTAS REGISTRADAS */

            ventas.map((venta, index) => (

              <VentaCard
                key={venta.id || index}
                venta={venta}
                index={index}
              />

            ))

          )}

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
              HISTORIAL DE VENTAS
            </Text>

            <View style={styles.footerLines}>

              <View style={styles.redLine} />

              <View style={styles.blueLine} />

            </View>

          </View>

        </ScrollView>

      </View>

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
    paddingTop: 25,
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
    marginBottom: 24,
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
    fontSize: 25,
    fontWeight: '900',
  },

  subtitle: {
    color: '#C1D4E9',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 19,
  },

  // SECCIONES

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 13,
  },

  // TARJETA PRINCIPAL DE RESUMEN

  summaryCard: {
    backgroundColor: '#C92532',
    borderRadius: 19,
    padding: 19,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 5,
  },

  summaryIconRed: {
    width: 53,
    height: 53,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  summaryInfo: {
    marginLeft: 15,
  },

  summaryLabel: {
    color: '#FFE6E8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 4,
  },

  summaryDescription: {
    color: '#FFE6E8',
    fontSize: 10,
    marginTop: 2,
  },

  // TARJETAS PEQUEÑAS

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  smallSummaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    elevation: 4,
  },

  smallIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF4FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 11,
  },

  smallLabel: {
    color: '#8290A2',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  incomeNumber: {
    color: '#1769C2',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },

  smallNumber: {
    color: '#173653',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 7,
  },

  smallDescription: {
    color: '#8A9AAF',
    fontSize: 9,
    marginTop: 5,
  },

  // ENCABEZADO DE LA LISTA

  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  listSubtitle: {
    color: '#A9C5E8',
    fontSize: 11,
    marginTop: -7,
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#145B9A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginLeft: 8,
  },

  refreshText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  // TARJETAS DE VENTA

  ventaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 16,
    marginBottom: 16,
    elevation: 5,
  },

  ventaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 11,
  },

  productName: {
    color: '#173653',
    fontSize: 14,
    fontWeight: '900',
  },

  productPresentation: {
    color: '#8290A2',
    fontSize: 10,
    marginTop: 5,
  },

  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: 5,
  },

  price: {
    color: '#1769C2',
    fontSize: 17,
    fontWeight: '900',
  },

  unitPrice: {
    color: '#8A9AAF',
    fontSize: 9,
    marginTop: 4,
  },

  // DETALLES DE VENTA

  saleDetails: {
    backgroundColor: '#F1F6FA',
    borderRadius: 11,
    padding: 12,
    marginTop: 15,
    gap: 10,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  detailText: {
    color: '#53677E',
    fontSize: 11,
    flex: 1,
  },

  // COMPRADOR

  customerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 13,
    marginTop: 13,
    borderWidth: 1,
    borderColor: '#E3EAF1',
  },

  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  customerIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: '#EAF4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  customerTitle: {
    color: '#173653',
    fontSize: 12,
    fontWeight: '900',
  },

  customerDivider: {
    height: 1,
    backgroundColor: '#E2E9F0',
    marginVertical: 12,
  },

  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },

  customerLabel: {
    color: '#8290A2',
    fontSize: 10,
    fontWeight: '700',
    width: 85,
  },

  customerValue: {
    color: '#304B65',
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },

  uid: {
    color: '#53677E',
    fontSize: 9,
    flex: 1,
    textAlign: 'right',
  },

  customerTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EAF4FC',
    padding: 10,
    borderRadius: 9,
    marginTop: 3,
  },

  customerTotalText: {
    color: '#1766A8',
    fontSize: 10,
    fontWeight: '900',
    flex: 1,
  },

  saleNumber: {
    color: '#9AA8B8',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'right',
    marginTop: 12,
  },

  // ESTADOS

  stateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
  },

  stateText: {
    color: '#718096',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 10,
  },

  emptyIcon: {
    width: 75,
    height: 75,
    borderRadius: 22,
    backgroundColor: '#EAF4FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },

  emptyTitle: {
    color: '#173653',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 12,
  },

  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#145B9A',
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 17,
    gap: 8,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  // PIE DE PÁGINA

  footer: {
    alignItems: 'center',
    padding: 17,
    backgroundColor: 'rgba(9, 34, 65, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#28517A',
    marginTop: 10,
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
