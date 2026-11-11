
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useCart } from '../../context/CartContext';

const API_URL = 'http://192.168.1.120:3000';

const PRODUCTOS = [
  {
    producto: 'COCA_LATA',
    nombre: 'Coca-Cola',
    presentacion: 'Lata',
    precio: 8,
    color: '#C51F2B',
    icono: 'local-drink',
  },
  {
    producto: 'COCA_BOTELLA',
    nombre: 'Coca-Cola',
    presentacion: 'Botella',
    precio: 12,
    color: '#C51F2B',
    icono: 'local-bar',
  },
  {
    producto: 'PEPSI_LATA',
    nombre: 'Pepsi',
    presentacion: 'Lata',
    precio: 7,
    color: '#0756A5',
    icono: 'local-drink',
  },
];

export default function ComprasUserScreen({ navigation }) {
  const { addToCart, cart } = useCart();

  const [stock, setStock] = useState({});
  const [cantidades, setCantidades] = useState({
    COCA_LATA: 1,
    COCA_BOTELLA: 1,
    PEPSI_LATA: 1,
  });
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState(false);

  const consultarInventario = async () => {
    try {
      const respuesta = await fetch(`${API_URL}/inventario`);
      if (!respuesta.ok) throw new Error('No se pudo consultar el inventario.');

      const datos = await respuesta.json();
      setStock(datos.productos || {});
      setErrorConexion(false);
    } catch (error) {
      setErrorConexion(true);
      console.log('Error consultando inventario:', error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    consultarInventario();

    const intervalo = setInterval(consultarInventario, 5000);

    return () => clearInterval(intervalo);
  }, []);

  const cambiarCantidad = (producto, cambio) => {
    setCantidades((actual) => ({
      ...actual,
      [producto]: Math.max(
        1,
        Math.min(4, (actual[producto] || 1) + cambio)
      ),
    }));
  };

  const agregar = (producto) => {
    const cantidad = cantidades[producto.producto] || 1;
    const disponible = Number(stock[producto.producto] || 0);

    if (disponible <= 0) {
      Alert.alert('Sin existencias', 'Este producto no está disponible.');
      return;
    }

    const resultado = addToCart(producto, cantidad, disponible);

    if (!resultado.ok) {
      Alert.alert('No se pudo agregar', resultado.mensaje);
      return;
    }

    Alert.alert(
      'Producto agregado',
      `${cantidad} unidad(es) de ${producto.nombre} ${producto.presentacion} agregadas al carrito.`
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerSmall}>SMARTGO</Text>
          <Text style={styles.title}>Nuestras bebidas</Text>
          <Text style={styles.subtitle}>
            Selecciona tus bebidas favoritas.
          </Text>
        </View>

        <View style={styles.statusCard}>
          <MaterialIcons
            name={errorConexion ? 'wifi-off' : 'inventory-2'}
            size={22}
            color={errorConexion ? '#DC2626' : '#15803D'}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>
              {errorConexion ? 'Sin conexión con el servidor' : 'Inventario en tiempo real'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {errorConexion
                ? 'Comprueba que el servidor esté encendido y conectado a la misma Wi-Fi.'
                : 'Existencias reportadas por Arduino.'}
            </Text>
          </View>
          <TouchableOpacity onPress={consultarInventario}>
            <MaterialIcons name="refresh" size={23} color="#334155" />
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#C51F2B"
            style={{ marginTop: 40 }}
          />
        ) : (
          PRODUCTOS.map((producto) => {
            const disponible = Number(stock[producto.producto] || 0);
            const cantidadEnCarrito =
              cart.find((item) => item.producto === producto.producto)?.cantidad || 0;

            return (
              <View style={styles.productCard} key={producto.producto}>
                <View
                  style={[
                    styles.productIcon,
                    { backgroundColor: `${producto.color}15` },
                  ]}
                >
                  <MaterialIcons
                    name={producto.icono}
                    size={42}
                    color={producto.color}
                  />
                </View>

                <View style={styles.productInfo}>
                  <Text style={styles.brand}>{producto.nombre}</Text>
                  <Text style={styles.presentation}>
                    {producto.presentacion}
                  </Text>
                  <Text style={styles.price}>Q{producto.precio.toFixed(2)}</Text>

                  <Text
                    style={[
                      styles.stockText,
                      disponible > 0 ? styles.stockAvailable : styles.stockEmpty,
                    ]}
                  >
                    {disponible > 0
                      ? `${disponible} disponibles`
                      : 'Agotado'}
                  </Text>

                  {cantidadEnCarrito > 0 && (
                    <Text style={styles.cartInfo}>
                      En carrito: {cantidadEnCarrito}
                    </Text>
                  )}
                </View>

                <View style={styles.actions}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => cambiarCantidad(producto.producto, -1)}
                    >
                      <MaterialIcons name="remove" size={18} color="#334155" />
                    </TouchableOpacity>

                    <Text style={styles.quantity}>
                      {cantidades[producto.producto]}
                    </Text>

                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => cambiarCantidad(producto.producto, 1)}
                    >
                      <MaterialIcons name="add" size={18} color="#334155" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      { backgroundColor: producto.color },
                      disponible <= 0 && styles.disabledButton,
                    ]}
                    disabled={disponible <= 0}
                    onPress={() => agregar(producto)}
                  >
                    <MaterialIcons name="add-shopping-cart" size={17} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Agregar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Carrito')}
        >
          <MaterialIcons name="shopping-cart" size={21} color="#FFFFFF" />
          <Text style={styles.cartButtonText}>
            Ver carrito ({cart.reduce((suma, item) => suma + item.cantidad, 0)})
          </Text>
        </TouchableOpacity>

        <View style={{ height: 25 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF0F3',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  headerSmall: {
    color: '#C51F2B',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
  },
  title: {
    color: '#172033',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 7,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusTitle: {
    color: '#172033',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statusSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 13,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
  },
  productIcon: {
    width: 65,
    height: 75,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  brand: {
    color: '#172033',
    fontSize: 16,
    fontWeight: 'bold',
  },
  presentation: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    color: '#172033',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },
  stockText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
  },
  stockAvailable: {
    color: '#15803D',
  },
  stockEmpty: {
    color: '#DC2626',
  },
  cartInfo: {
    color: '#0756A5',
    fontSize: 11,
    marginTop: 4,
  },
  actions: {
    alignItems: 'center',
    gap: 9,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    padding: 3,
  },
  quantityButton: {
    padding: 5,
  },
  quantity: {
    minWidth: 20,
    textAlign: 'center',
    color: '#172033',
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 9,
    gap: 4,
  },
  disabledButton: {
    backgroundColor: '#94A3B8',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cartButton: {
    backgroundColor: '#172033',
    marginHorizontal: 16,
    marginTop: 7,
    padding: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
