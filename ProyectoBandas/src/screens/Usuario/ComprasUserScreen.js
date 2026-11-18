
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  ImageBackground,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../../context/CartContext';

import Fondo_1 from '../../../assets/cocalata.png';
import Fondo_2 from '../../../assets/cocabotella.png';
import Fondo_3 from '../../../assets/pepsilata.png';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

// DIRECCION DEL SERVIDOR
const API_URL = 'http://192.168.1.120:3000';

const PRODUCTOS = [
  {
    id: 'COCA_LATA',
    nombre: 'Coca-Cola',
    presentacion: 'Lata',
    descripcion: 'Bebida Coca-Cola refrescante en presentación de lata.',
    precio: 8,
    imagen: Fondo_1,
  },
  {
    id: 'COCA_BOTELLA',
    nombre: 'Coca-Cola',
    presentacion: 'Botella',
    descripcion: 'Coca-Cola clásica en presentación de botella.',
    precio: 12,
    imagen: Fondo_2,
  },
  {
    id: 'PEPSI_LATA',
    nombre: 'Pepsi',
    presentacion: 'Lata',
    descripcion: 'Pepsi refrescante en presentación de lata.',
    precio: 7,
    imagen: Fondo_3,
  },
];

export default function ComprasUserScreen({ navigation }) {

  const { addToCart, cart } = useCart();

  const [stock, setStock] = useState({
    COCA_LATA: 0,
    COCA_BOTELLA: 0,
    PEPSI_LATA: 0,
  });

  const [cantidades, setCantidades] = useState({});
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  // ============================================
  // CONSULTAR EXISTENCIAS EN EL SERVIDOR
  // ============================================

  const obtenerStock = async (mostrarCarga = false) => {

    try {

      if (mostrarCarga) {
        setActualizando(true);
      }

      const respuesta = await fetch(`${API_URL}/inventario`);

      if (!respuesta.ok) {
        throw new Error('No se pudo consultar el inventario');
      }

      const datos = await respuesta.json();

      console.log('INVENTARIO RECIBIDO:', datos);

      const productos = datos.productos || {};

      const nuevoStock = {
        COCA_LATA: Math.max(0, Number(productos.COCA_LATA ?? 0)),
        COCA_BOTELLA: Math.max(0, Number(productos.COCA_BOTELLA ?? 0)),
        PEPSI_LATA: Math.max(0, Number(productos.PEPSI_LATA ?? 0)),
      };

      if (
        !Object.values(nuevoStock).every(Number.isFinite)
      ) {
        throw new Error('El inventario recibido no es válido');
      }

      setStock(nuevoStock);
      setErrorConexion(false);

    } catch (error) {

      console.log('ERROR AL CONSULTAR INVENTARIO:', error);

      setErrorConexion(true);

    } finally {

      setCargando(false);
      setActualizando(false);

    }
  };

  // ============================================
  // ACTUALIZAR INVENTARIO AUTOMATICAMENTE
  // ============================================

  useEffect(() => {

    obtenerStock();

    const intervalo = setInterval(() => {
      obtenerStock();
    }, 5000);

    return () => clearInterval(intervalo);

  }, []);

  // ============================================
  // OBTENER CANTIDAD DISPONIBLE
  // ============================================

  const obtenerCantidadDisponible = (id) => {

    const cantidad = Number(stock[id]);

    if (!Number.isFinite(cantidad)) {
      return 0;
    }

    return Math.max(0, cantidad);

  };

  // ============================================
  // CAMBIAR CANTIDAD
  // ============================================

  const cambiarCantidad = (id, cambio) => {

    const disponible = obtenerCantidadDisponible(id);

    if (disponible <= 0) return;

    setCantidades((anteriores) => {

      const actual = anteriores[id] || 1;

      const nueva = Math.max(
        1,
        Math.min(4, disponible, actual + cambio)
      );

      return {
        ...anteriores,
        [id]: nueva,
      };

    });

  };

  // ============================================
  // AGREGAR PRODUCTO AL CARRITO
  // ============================================

  const agregarProducto = async (producto) => {

    try {

      if (errorConexion) {
        Alert.alert(
          'Sin conexión',
          'No hay conexión con la máquina. Intenta nuevamente.'
        );
        return;
      }

      const cantidad = cantidades[producto.id] || 1;

      // Consultar inventario actualizado
      const respuesta = await fetch(`${API_URL}/inventario`);

      if (!respuesta.ok) {
        throw new Error('No se pudo verificar el inventario');
      }

      const datos = await respuesta.json();

      const inventarioActual = datos.productos || {};

      const disponible = Number(
        inventarioActual[producto.id] ?? 0
      );

      if (!Number.isFinite(disponible) || disponible < 0) {
        throw new Error('Cantidad de inventario inválida');
      }

      // Actualizar existencias en pantalla
      setStock({
        COCA_LATA: Number(inventarioActual.COCA_LATA ?? 0),
        COCA_BOTELLA: Number(inventarioActual.COCA_BOTELLA ?? 0),
        PEPSI_LATA: Number(inventarioActual.PEPSI_LATA ?? 0),
      });

      setErrorConexion(false);

      // Verificar si hay existencias
      if (disponible <= 0) {

        Alert.alert(
          'Producto agotado',
          'Este producto ya no tiene existencias disponibles.'
        );

        return;
      }

      // Verificar cantidad solicitada
      if (cantidad > disponible) {

        Alert.alert(
          'Existencias insuficientes',
          `Solamente hay ${disponible} unidades disponibles.`
        );

        setCantidades((anteriores) => ({
          ...anteriores,
          [producto.id]: disponible,
        }));

        return;
      }

      // Agregar al carrito
      const resultado = addToCart(
        producto,
        cantidad,
        disponible
      );

      if (resultado && resultado.ok === false) {

        Alert.alert(
          'No se pudo agregar',
          resultado.mensaje || 'No fue posible agregar el producto.'
        );

        return;
      }

      // Reiniciar selector de cantidad
      setCantidades((anteriores) => ({
        ...anteriores,
        [producto.id]: 1,
      }));

      Alert.alert(
        'Producto agregado',
        `${producto.nombre} ${producto.presentacion} se agregó al carrito.`
      );

    } catch (error) {

      console.log('ERROR AL AGREGAR PRODUCTO:', error);

      Alert.alert(
        'Error de conexión',
        'No fue posible verificar las existencias. Intenta nuevamente.'
      );

    }

  };

  // ============================================
  // TOTALES DEL CARRITO
  // ============================================

  const totalProductos = cart.reduce(
    (total, item) => total + Number(item.cantidad || 0),
    0
  );

  const totalCompra = cart.reduce(
    (total, item) =>
      total +
      Number(item.precio || 0) *
      Number(item.cantidad || 0),
    0
  );

  // ============================================
  // TARJETAS DE PRODUCTOS
  // ============================================

  const renderProducto = (producto) => {

    const disponible = obtenerCantidadDisponible(producto.id);

    const cantidad = cantidades[producto.id] || 1;

    const agotado = disponible <= 0;

    return (

      <View style={styles.productCard} key={producto.id}>

        <View style={styles.imageContainer}>

          <Image
            source={producto.imagen}
            style={styles.productImage}
            resizeMode="contain"
          />

        </View>

        <View style={styles.productInfo}>

          <Text style={styles.productName}>
            {producto.nombre}
          </Text>

          <Text style={styles.productPresentation}>
            {producto.presentacion}
          </Text>

          <Text style={styles.productDescription}>
            {producto.descripcion}
          </Text>

          <Text style={styles.productPrice}>
            Q{producto.precio.toFixed(2)}
          </Text>

          {/* EXISTENCIAS */}

          <View style={styles.stockContainer}>

            <View
              style={[
                styles.stockIndicator,
                {
                  backgroundColor: agotado
                    ? '#D71920'
                    : '#20A464',
                },
              ]}
            />

            <Text
              style={[
                styles.stockText,
                {
                  color: agotado
                    ? '#D71920'
                    : '#20A464',
                },
              ]}
            >
              {agotado
                ? 'Agotado'
                : `${disponible} disponibles`}
            </Text>

          </View>

          {/* CANTIDAD */}

          <View style={styles.quantityContainer}>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => cambiarCantidad(producto.id, -1)}
              disabled={agotado || cantidad <= 1}
            >

              <MaterialIcons
                name="remove"
                size={21}
                color={
                  agotado || cantidad <= 1
                    ? '#B8B8B8'
                    : '#252525'
                }
              />

            </TouchableOpacity>

            <Text style={styles.quantityText}>
              {cantidad}
            </Text>

            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => cambiarCantidad(producto.id, 1)}
              disabled={
                agotado ||
                cantidad >= 4 ||
                cantidad >= disponible
              }
            >

              <MaterialIcons
                name="add"
                size={21}
                color={
                  agotado ||
                  cantidad >= 4 ||
                  cantidad >= disponible
                    ? '#B8B8B8'
                    : '#252525'
                }
              />

            </TouchableOpacity>

          </View>

          {/* AGREGAR AL CARRITO */}

          <TouchableOpacity
            style={[
              styles.addButton,
              agotado && styles.disabledButton,
            ]}
            onPress={() => agregarProducto(producto)}
            disabled={agotado}
            activeOpacity={0.85}
          >

            <MaterialIcons
              name="add-shopping-cart"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.addButtonText}>
              {agotado
                ? 'No disponible'
                : 'Agregar al carrito'}
            </Text>

          </TouchableOpacity>

        </View>

      </View>

    );

  };

  // ============================================
  // PANTALLA PRINCIPAL
  // ============================================

  return (

    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >

      <View style={styles.backgroundOverlay} />

      <SafeAreaView style={styles.safeArea}>

        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ENCABEZADO */}

          <View style={styles.header}>

            <View style={styles.headerTop}>

              <View style={styles.logoImageContainer}>

                <Image
                  source={MiLogo}
                  style={styles.logoImage}
                  resizeMode="contain"
                />

              </View>

              <Text style={styles.logoText}>
                SMARTGO
              </Text>

              <View style={styles.headerTag}>

                <Text style={styles.headerTagText}>
                  VENDING
                </Text>

              </View>

            </View>

            <Text style={styles.headerTitle}>
              ¡Elige tu bebida!
            </Text>

            <Text style={styles.headerSubtitle}>
              Tu bebida favorita, a un solo toque.
            </Text>

            <View style={styles.headerDecoration}>
              <View style={styles.decorationCircle} />
              <View style={styles.decorationCircleSmall} />
            </View>

          </View>

          {/* PRODUCTOS */}

          <View style={styles.productsSection}>

            <View style={styles.sectionHeading}>

              <Text style={styles.sectionTitle}>
                Nuestros productos
              </Text>

              <Text style={styles.sectionSubtitle}>
                Selecciona tu favorito
              </Text>

              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => obtenerStock(true)}
                disabled={actualizando}
              >

                <MaterialIcons
                  name="refresh"
                  size={17}
                  color="#FFFFFF"
                />

                <Text style={styles.refreshText}>
                  {actualizando
                    ? 'Actualizando...'
                    : 'Actualizar existencias'}
                </Text>

              </TouchableOpacity>

            </View>

            {/* ERROR DE CONEXION */}

            {errorConexion && (

              <View style={styles.errorContainer}>

                <MaterialIcons
                  name="wifi-off"
                  size={20}
                  color="#D71920"
                />

                <Text style={styles.errorText}>
                  No hay conexión con la máquina
                </Text>

                <TouchableOpacity
                  onPress={() => obtenerStock(true)}
                >

                  <Text style={styles.retryText}>
                    Reintentar
                  </Text>

                </TouchableOpacity>

              </View>

            )}

            {/* CARGANDO */}

            {cargando ? (

              <View style={styles.loadingContainer}>

                <ActivityIndicator
                  size="large"
                  color="#FFFFFF"
                />

                <Text style={styles.loadingText}>
                  Cargando productos...
                </Text>

              </View>

            ) : (

              <View style={styles.productsContainer}>

                {PRODUCTOS.map((producto) =>
                  renderProducto(producto)
                )}

              </View>

            )}

          </View>

        </ScrollView>

        {/* RESUMEN DEL CARRITO */}

        <View style={styles.bottomContainer}>

          <View style={styles.summaryInfo}>

            <View>

              <Text style={styles.summaryLabel}>
                {totalProductos} productos en tu carrito
              </Text>

              <Text style={styles.summaryTotal}>
                Q{totalCompra.toFixed(2)}
              </Text>

            </View>

            <TouchableOpacity
              style={[
                styles.cartButton,
                totalProductos === 0 &&
                  styles.emptyCartButton,
              ]}
              onPress={() => navigation.navigate('Carrito')}
              activeOpacity={0.85}
            >

              <MaterialIcons
                name="shopping-cart"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.cartButtonText}>
                Ver carrito
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </SafeAreaView>

    </ImageBackground>

  );

}

// ============================================
// ESTILOS
// ============================================

const styles = StyleSheet.create({

  background: {
    flex: 1,
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 24, 52, 0.20)',
  },

  safeArea: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // ENCABEZADO

  header: {
    paddingHorizontal: 25,
    paddingTop: 35,
    paddingBottom: 35,
    overflow: 'hidden',
    position: 'relative',
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  logoImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },

  logoImage: {
    width: '90%',
    height: '90%',
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 2,
  },

  headerTag: {
    marginLeft: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  headerTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: '#E5F0FF',
    fontSize: 14,
    marginTop: 8,
  },

  headerDecoration: {
    position: 'absolute',
    right: -15,
    bottom: -55,
    width: 170,
    height: 170,
    borderRadius: 100,
    borderWidth: 25,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  decorationCircle: {
    position: 'absolute',
    width: 55,
    height: 55,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -95,
    right: 25,
  },

  decorationCircleSmall: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    top: -65,
    right: 85,
  },

  // PRODUCTOS

  productsSection: {
    backgroundColor: 'transparent',
    paddingTop: 5,
  },

  sectionHeading: {
    paddingHorizontal: 25,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  sectionSubtitle: {
    color: '#E5F0FF',
    fontSize: 13,
    marginTop: 4,
  },

  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    gap: 6,
  },

  refreshText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  productsContainer: {
    width: '100%',
    alignItems: 'center',
  },

  // TARJETAS

  productCard: {
    width: '60%',
    minHeight: 405,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    marginBottom: 35,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAF0F6',
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  imageContainer: {
    width: '100%',
    height: 235,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },

  productImage: {
    width: '100%',
    height: '100%',
  },

  productInfo: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 5,
  },

  productName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
  },

  productDescription: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 5,
    textAlign: 'center',
  },

  productPresentation: {
    fontSize: 14,
    color: '#777777',
    marginTop: 3,
  },

  productPrice: {
    fontSize: 21,
    fontWeight: '800',
    color: '#14569A',
    marginTop: 8,
  },

  // EXISTENCIAS

  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 10,
    marginRight: 6,
  },

  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // CANTIDAD

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 115,
    height: 37,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginTop: 12,
    paddingHorizontal: 7,
  },

  quantityButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantityText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },

  // BOTÓN DE COMPRA

  addButton: {
    width: '100%',
    height: 45,
    borderRadius: 12,
    marginTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#14569A',
  },

  disabledButton: {
    backgroundColor: '#AAAAAA',
    opacity: 0.7,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // CARGA Y CONEXIÓN

  loadingContainer: {
    paddingVertical: 70,
    alignItems: 'center',
  },

  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },

  errorContainer: {
    width: '82%',
    alignSelf: 'center',
    backgroundColor: '#FFF1F1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  errorText: {
    flex: 1,
    color: '#B42318',
    fontSize: 12,
  },

  retryText: {
    color: '#D71920',
    fontWeight: '700',
    fontSize: 12,
  },

  // CARRITO INFERIOR

  bottomContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 7,
  },

  summaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    color: '#777777',
    fontSize: 12,
  },

  summaryTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14569A',
    marginTop: 2,
  },

  cartButton: {
    backgroundColor: '#14569A',
    height: 47,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  emptyCartButton: {
    backgroundColor: '#AFAFAF',
  },

  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

});
