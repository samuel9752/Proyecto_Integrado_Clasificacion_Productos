
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from '../../firebase/FirebaseConfig';
import { useCart } from '../../context/CartContext';

const API_URL = 'http://192.168.1.120:3000';

// ============================================
// TARJETAS FICTICIAS DE DEMOSTRACIÓN
// ============================================

const TARJETAS_DEMO = [
  {
    titular: 'SMARTGO DEMO 01',
    numero: '4242 4242 4242 4242',
    vencimiento: '12/30',
    cvv: '123',
    color: '#172B4D',
  },
  {
    titular: 'SMARTGO DEMO 02',
    numero: '5555 5555 5555 4444',
    vencimiento: '11/29',
    cvv: '456',
    color: '#0756A5',
  },
  {
    titular: 'SMARTGO DEMO 03',
    numero: '4000 0566 5566 5556',
    vencimiento: '10/28',
    cvv: '789',
    color: '#C51F2B',
  },
];

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

const auth = getAuth(app);

export default function CarritoUserScreen() {
  const {
    cart,
    total,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [pantalla, setPantalla] = useState('carrito');

  const [titular, setTitular] = useState('');
  const [numero, setNumero] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');

  const [procesando, setProcesando] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);
  const [estadoPedido, setEstadoPedido] = useState(null);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  // ============================================
  // FORMATEAR DATOS
  // ============================================

  const formatearNumero = (valor) => {
    const limpio = valor.replace(/\D/g, '').slice(0, 16);
    return limpio.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatearVencimiento = (valor) => {
    const limpio = valor.replace(/\D/g, '').slice(0, 4);

    if (limpio.length > 2) {
      return limpio.slice(0, 2) + '/' + limpio.slice(2);
    }

    return limpio;
  };

  const seleccionarTarjeta = (tarjeta) => {
    setTitular(tarjeta.titular);
    setNumero(tarjeta.numero);
    setVencimiento(tarjeta.vencimiento);
    setCvv(tarjeta.cvv);
  };

  // ============================================
  // CAMBIAR CANTIDADES
  // ============================================

  const cambiarCantidad = (producto, cantidad) => {
    if (cantidad < 1 || cantidad > 4) return;
    updateQuantity(producto, cantidad);
  };

  // ============================================
  // VALIDAR TARJETA DE DEMOSTRACIÓN
  // ============================================

  const validarTarjeta = () => {
    const numeroLimpio = numero.replace(/\s/g, '');

    return TARJETAS_DEMO.find((tarjeta) => {
      return (
        tarjeta.numero.replace(/\s/g, '') === numeroLimpio &&
        tarjeta.titular === titular.trim().toUpperCase() &&
        tarjeta.vencimiento === vencimiento &&
        tarjeta.cvv === cvv
      );
    });
  };

  // ============================================
  // CONSULTAR AVANCE DEL PEDIDO
  // ============================================

  const consultarEstado = async (id) => {
    try {
      const respuesta = await fetch(`${API_URL}/pedido/${id}`);
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'Error consultando pedido.');
      }

      setEstadoPedido(datos);

      if (
        datos.estado === 'completado' ||
        datos.estado === 'error'
      ) {
        const productos = datos.productos || [];

        const entregadas = productos.reduce(
          (suma, item) => suma + Number(item.entregadas || 0),
          0
        );

        const fallidas = productos.reduce(
          (suma, item) => suma + Number(item.fallidas || 0),
          0
        );

        setResultadoFinal({
          entregadas,
          fallidas,
          mensaje: datos.mensaje || 'El pedido ha finalizado.',
        });

        clearCart();
        setProcesando(false);
        setPantalla('resultado');
        return;
      }

      setTimeout(() => consultarEstado(id), 1500);

    } catch (error) {
      console.log('Error consultando pedido:', error.message);
      setTimeout(() => consultarEstado(id), 3000);
    }
  };

  // ============================================
  // ENVIAR PEDIDO A SMARTGO
  // ============================================

  const enviarPedido = async () => {
    const usuarioActual = auth.currentUser;

    if (!usuarioActual) {
      setProcesando(false);
      Alert.alert(
        'Sesión no encontrada',
        'Inicia sesión nuevamente.'
      );
      return;
    }

    try {
      // Consultar inventario actualizado.
      const respuestaStock = await fetch(`${API_URL}/inventario`);

      if (!respuestaStock.ok) {
        throw new Error('No se pudo consultar el inventario.');
      }

      const datosStock = await respuestaStock.json();

      // Acepta las dos estructuras de respuesta del servidor.
      const inventarioActual = datosStock.productos || datosStock;

      for (const item of cart) {
        const disponible = Number(
          inventarioActual[item.producto] || 0
        );

        if (item.cantidad > disponible) {
          throw new Error(
            `Solo quedan ${disponible} unidades de ${item.nombre} ${item.presentacion}.`
          );
        }
      }

      const correo = usuarioActual.email || '';

      const respuesta = await fetch(`${API_URL}/pedido`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            producto: item.producto,
            cantidad: item.cantidad,
          })),
          usuario: {
            uid: usuarioActual.uid,
            correo,
            nombre: correo.split('@')[0] || 'Usuario',
          },
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo enviar el pedido.'
        );
      }

      setPedidoId(datos.pedidoId);
      setPantalla('seguimiento');

      consultarEstado(datos.pedidoId);

    } catch (error) {
      setProcesando(false);
      Alert.alert('No se pudo procesar', error.message);
    }
  };

  // ============================================
  // PROCESAR PAGO SIMULADO
  // ============================================

  const procesarPago = () => {
    if (!titular.trim() || !numero || !vencimiento || !cvv) {
      Alert.alert(
        'Datos incompletos',
        'Completa todos los campos de la tarjeta.'
      );
      return;
    }

    if (numero.replace(/\s/g, '').length !== 16) {
      Alert.alert(
        'Número incorrecto',
        'El número de tarjeta debe tener 16 dígitos.'
      );
      return;
    }

    if (vencimiento.length !== 5) {
      Alert.alert(
        'Fecha incorrecta',
        'Ingresa el vencimiento en formato MM/AA.'
      );
      return;
    }

    if (cvv.length !== 3) {
      Alert.alert(
        'CVV incorrecto',
        'El código de seguridad debe tener 3 dígitos.'
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert(
        'Carrito vacío',
        'No tienes productos para comprar.'
      );
      setPantalla('carrito');
      return;
    }

    const tarjeta = validarTarjeta();

    if (!tarjeta) {
      Alert.alert(
        'Pago rechazado',
        'Los datos no coinciden con ninguna de las tres tarjetas de demostración. Verifica el titular, número, vencimiento y CVV.'
      );
      return;
    }

    setProcesando(true);

    Alert.alert(
      'Pago aprobado',
      'La tarjeta de demostración fue validada correctamente. Se enviará tu pedido a SMARTGO.',
      [
        {
          text: 'Continuar',
          onPress: enviarPedido,
        },
      ]
    );
  };

  // ============================================
  // PANTALLA DEL CARRITO
  // ============================================

  const renderCarrito = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerSmall}>SMARTGO</Text>
        <Text style={styles.title}>Mi carrito</Text>
        <Text style={styles.subtitle}>
          Tus bebidas seleccionadas.
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcons
            name="shopping-cart"
            size={60}
            color="#94A3B8"
          />

          <Text style={styles.emptyTitle}>
            Tu carrito está vacío
          </Text>

          <Text style={styles.emptyText}>
            Agrega tus bebidas favoritas desde la sección Compras.
          </Text>
        </View>
      ) : (
        <>
          {cart.map((item) => (
            <View style={styles.productCard} key={item.producto}>
              <View style={styles.productIcon}>
                <MaterialIcons
                  name="local-drink"
                  size={32}
                  color={
                    item.nombre === 'Pepsi'
                      ? '#0756A5'
                      : '#C51F2B'
                  }
                />
              </View>

              <View style={styles.productInfo}>
                <Text style={styles.productName}>
                  {item.nombre}
                </Text>

                <Text style={styles.presentation}>
                  {item.presentacion}
                </Text>

                <Text style={styles.price}>
                  Q{(item.precio * item.cantidad).toFixed(2)}
                </Text>

                <Text style={styles.unitPrice}>
                  Q{item.precio.toFixed(2)} por unidad
                </Text>
              </View>

              <View style={styles.controls}>
                <View style={styles.quantityControl}>
                  <TouchableOpacity
                    onPress={() =>
                      cambiarCantidad(
                        item.producto,
                        item.cantidad - 1
                      )
                    }
                    disabled={item.cantidad <= 1}
                  >
                    <MaterialIcons
                      name="remove"
                      size={20}
                      color={
                        item.cantidad <= 1
                          ? '#CBD5E1'
                          : '#334155'
                      }
                    />
                  </TouchableOpacity>

                  <Text style={styles.quantity}>
                    {item.cantidad}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      cambiarCantidad(
                        item.producto,
                        item.cantidad + 1
                      )
                    }
                    disabled={item.cantidad >= 4}
                  >
                    <MaterialIcons
                      name="add"
                      size={20}
                      color={
                        item.cantidad >= 4
                          ? '#CBD5E1'
                          : '#334155'
                      }
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => removeFromCart(item.producto)}
                  style={styles.removeButton}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={22}
                    color="#DC2626"
                  />

                  <Text style={styles.removeText}>
                    Eliminar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>
              Resumen de compra
            </Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Productos
              </Text>

              <Text style={styles.summaryValue}>
                {cart.reduce(
                  (suma, item) => suma + item.cantidad,
                  0
                )}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal
              </Text>

              <Text style={styles.summaryValue}>
                Q{total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.separator} />

            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>

              <Text style={styles.totalPrice}>
                Q{total.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.payButton}
            onPress={() => setPantalla('pago')}
          >
            <MaterialIcons
              name="lock"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.payButtonText}>
              Proceder al pago
            </Text>

            <MaterialIcons
              name="arrow-forward"
              size={21}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </>
      )}
    </>
  );

  // ============================================
  // PANTALLA DE PAGO
  // ============================================

  const renderPago = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setPantalla('carrito')}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color="#172033"
          />

          <Text style={styles.backText}>
            Volver al carrito
          </Text>
        </TouchableOpacity>

        <Text style={styles.headerSmall}>
          SMARTGO CHECKOUT
        </Text>

        <Text style={styles.title}>
          Método de pago
        </Text>

        <Text style={styles.subtitle}>
          Completa los datos de tu tarjeta de demostración.
        </Text>
      </View>

      <View style={styles.paymentCard}>
        <View style={styles.paymentCardHeader}>
          <MaterialIcons
            name="credit-card"
            size={25}
            color="#FFFFFF"
          />

          <Text style={styles.paymentCardBrand}>
            SMARTGO PAY
          </Text>
        </View>

        <Text style={styles.cardNumberPreview}>
          {numero || '•••• •••• •••• ••••'}
        </Text>

        <View style={styles.cardPreviewBottom}>
          <View>
            <Text style={styles.cardPreviewLabel}>
              TITULAR
            </Text>

            <Text style={styles.cardPreviewValue}>
              {titular || 'NOMBRE DEL TITULAR'}
            </Text>
          </View>

          <View>
            <Text style={styles.cardPreviewLabel}>
              VENCE
            </Text>

            <Text style={styles.cardPreviewValue}>
              {vencimiento || 'MM/AA'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>
          Información de tarjeta
        </Text>

        <Text style={styles.inputLabel}>
          Nombre del titular
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Nombre como aparece en la tarjeta"
          placeholderTextColor="#94A3B8"
          value={titular}
          onChangeText={(valor) =>
            setTitular(valor.toUpperCase())
          }
          autoCapitalize="characters"
        />

        <Text style={styles.inputLabel}>
          Número de tarjeta
        </Text>

        <TextInput
          style={styles.input}
          placeholder="0000 0000 0000 0000"
          placeholderTextColor="#94A3B8"
          keyboardType="number-pad"
          value={numero}
          onChangeText={(valor) =>
            setNumero(formatearNumero(valor))
          }
          maxLength={19}
        />

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>
              Vencimiento
            </Text>

            <TextInput
              style={styles.input}
              placeholder="MM/AA"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={vencimiento}
              onChangeText={(valor) =>
                setVencimiento(
                  formatearVencimiento(valor)
                )
              }
              maxLength={5}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>
              CVV
            </Text>

            <TextInput
              style={styles.input}
              placeholder="123"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              value={cvv}
              onChangeText={(valor) =>
                setCvv(
                  valor.replace(/\D/g, '').slice(0, 3)
                )
              }
              maxLength={3}
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.securityNotice}>
          <MaterialIcons
            name="verified-user"
            size={20}
            color="#15803D"
          />

          <Text style={styles.securityText}>
            Pago de demostración. No se realiza ningún cobro bancario.
          </Text>
        </View>
      </View>

      <View style={styles.demoContainer}>
        <Text style={styles.sectionTitle}>
          Tarjetas de prueba disponibles
        </Text>

        <Text style={styles.demoSubtitle}>
          Selecciona una tarjeta para rellenar los datos automáticamente.
        </Text>

        {TARJETAS_DEMO.map((tarjeta, index) => (
          <TouchableOpacity
            key={tarjeta.numero}
            style={styles.demoCard}
            onPress={() => seleccionarTarjeta(tarjeta)}
          >
            <View
              style={[
                styles.demoCardIcon,
                { backgroundColor: tarjeta.color },
              ]}
            >
              <MaterialIcons
                name="credit-card"
                size={22}
                color="#FFFFFF"
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.demoCardName}>
                Tarjeta de prueba {index + 1}
              </Text>

              <Text style={styles.demoCardNumber}>
                {tarjeta.numero}
              </Text>

              <Text style={styles.demoCardDetails}>
                {tarjeta.titular} · {tarjeta.vencimiento}
              </Text>

              <Text style={styles.demoCardDetails}>
                CVV: {tarjeta.cvv}
              </Text>
            </View>

            <MaterialIcons
              name="add-circle-outline"
              size={23}
              color="#0756A5"
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>
          Total de tu compra
        </Text>

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>
            Total a pagar
          </Text>

          <Text style={styles.totalPrice}>
            Q{total.toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.payButton,
          procesando && { opacity: 0.7 },
        ]}
        onPress={procesarPago}
        disabled={procesando}
      >
        {procesando ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons
              name="lock"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.payButtonText}>
              Pagar Q{total.toFixed(2)}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  // ============================================
  // PANTALLA DE SEGUIMIENTO
  // ============================================

  const renderSeguimiento = () => (
    <View style={styles.resultCard}>
      <ActivityIndicator
        size="large"
        color="#C51F2B"
      />

      <Text style={styles.resultTitle}>
        Preparando tu pedido
      </Text>

      <Text style={styles.resultMessage}>
        {estadoPedido?.mensaje ||
          'Esperando respuesta de SMARTGO...'}
      </Text>

      {estadoPedido?.productos?.map((item) => (
        <View
          style={styles.progressItem}
          key={item.producto}
        >
          <Text style={styles.progressName}>
            {item.producto.replace(/_/g, ' ')}
          </Text>

          <Text style={styles.progressCount}>
            {item.entregadas} de {item.solicitada} entregadas
          </Text>
        </View>
      ))}

      <Text style={styles.waitNotice}>
        No desconectes Arduino mientras se procesa tu pedido.
      </Text>

      <Text style={styles.orderId}>
        Pedido: {pedidoId}
      </Text>
    </View>
  );

  // ============================================
  // PANTALLA DE RESULTADO
  // ============================================

  const renderResultado = () => (
    <View style={styles.resultCard}>
      <MaterialIcons
        name={
          resultadoFinal?.entregadas > 0
            ? 'check-circle'
            : 'info'
        }
        size={75}
        color={
          resultadoFinal?.entregadas > 0
            ? '#15803D'
            : '#DC2626'
        }
      />

      <Text style={styles.resultTitle}>
        {resultadoFinal?.entregadas > 0
          ? '¡Gracias por tu compra!'
          : 'Pedido no completado'}
      </Text>

      <Text style={styles.resultMessage}>
        {resultadoFinal?.mensaje}
      </Text>

      <View style={styles.finalSummary}>
        <Text style={styles.finalNumber}>
          {resultadoFinal?.entregadas || 0}
        </Text>

        <Text style={styles.finalLabel}>
          Bebidas entregadas
        </Text>

        <View style={styles.separator} />

        <Text style={styles.finalNumber}>
          {resultadoFinal?.fallidas || 0}
        </Text>

        <Text style={styles.finalLabel}>
          Bebidas no entregadas
        </Text>
      </View>

      <Text style={styles.orderId}>
        Pedido: {pedidoId}
      </Text>

      <TouchableOpacity
        style={styles.payButton}
        onPress={() => {
          setPantalla('carrito');
          setPedidoId(null);
          setEstadoPedido(null);
          setResultadoFinal(null);
          setTitular('');
          setNumero('');
          setVencimiento('');
          setCvv('');
        }}
      >
        <MaterialIcons
          name="home"
          size={21}
          color="#FFFFFF"
        />

        <Text style={styles.payButtonText}>
          Volver al carrito
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // VISTA PRINCIPAL
  // ============================================

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {pantalla === 'carrito' && renderCarrito()}
        {pantalla === 'pago' && renderPago()}
        {pantalla === 'seguimiento' && renderSeguimiento()}
        {pantalla === 'resultado' && renderResultado()}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ============================================
// DISEÑO
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF0F3',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },

  headerSmall: {
    color: '#C51F2B',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12,
    marginTop: 8,
  },

  title: {
    color: '#172033',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 7,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 5,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 15,
  },

  backText: {
    color: '#334155',
    fontWeight: '600',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    margin: 18,
    padding: 30,
    borderRadius: 18,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#172033',
    fontSize: 19,
    fontWeight: 'bold',
    marginTop: 15,
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  productCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  productIcon: {
    width: 55,
    height: 60,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    color: '#172033',
    fontSize: 15,
    fontWeight: 'bold',
  },

  presentation: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  price: {
    color: '#C51F2B',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 6,
  },

  unitPrice: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },

  controls: {
    alignItems: 'center',
    gap: 10,
  },

  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: 95,
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    padding: 7,
  },

  quantity: {
    color: '#172033',
    fontWeight: 'bold',
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },

  removeText: {
    color: '#DC2626',
    fontSize: 11,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 18,
    padding: 19,
    borderRadius: 17,
  },

  sectionTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 7,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 14,
  },

  summaryValue: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '600',
  },

  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },

  totalLabel: {
    color: '#172033',
    fontWeight: 'bold',
    fontSize: 16,
  },

  totalPrice: {
    color: '#C51F2B',
    fontSize: 23,
    fontWeight: 'bold',
  },

  payButton: {
    backgroundColor: '#C51F2B',
    marginHorizontal: 16,
    marginTop: 5,
    padding: 17,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 3,
  },

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },

  paymentCard: {
    margin: 17,
    padding: 22,
    borderRadius: 19,
    backgroundColor: '#172B4D',
    minHeight: 175,
    justifyContent: 'space-between',
    elevation: 5,
  },

  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  paymentCardBrand: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 13,
  },

  cardNumberPreview: {
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 2,
    marginVertical: 23,
  },

  cardPreviewBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cardPreviewLabel: {
    color: '#B8C7DB',
    fontSize: 9,
    letterSpacing: 1,
  },

  cardPreviewValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 19,
    borderRadius: 17,
  },

  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 7,
    marginTop: 13,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#DCE2EA',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 13,
    color: '#172033',
    fontSize: 14,
  },

  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },

  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 10,
    marginTop: 18,
  },

  securityText: {
    color: '#166534',
    fontSize: 11,
    flex: 1,
    lineHeight: 17,
  },

  demoContainer: {
    marginHorizontal: 16,
    marginTop: 19,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
  },

  demoSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -7,
    marginBottom: 12,
  },

  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  demoCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  demoCardName: {
    color: '#172033',
    fontSize: 13,
    fontWeight: 'bold',
  },

  demoCardNumber: {
    color: '#334155',
    fontSize: 11,
    marginTop: 3,
  },

  demoCardDetails: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 3,
  },

  resultCard: {
    backgroundColor: '#FFFFFF',
    margin: 17,
    padding: 24,
    borderRadius: 19,
    alignItems: 'center',
  },

  resultTitle: {
    color: '#172033',
    fontSize: 21,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 17,
  },

  resultMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 9,
  },

  progressItem: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 13,
    marginTop: 10,
  },

  progressName: {
    color: '#172033',
    fontWeight: 'bold',
    fontSize: 13,
  },

  progressCount: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },

  waitNotice: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },

  orderId: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 18,
    textAlign: 'center',
  },

  finalSummary: {
    backgroundColor: '#F8FAFC',
    width: '100%',
    borderRadius: 13,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },

  finalNumber: {
    color: '#C51F2B',
    fontSize: 30,
    fontWeight: 'bold',
  },

  finalLabel: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },
});
