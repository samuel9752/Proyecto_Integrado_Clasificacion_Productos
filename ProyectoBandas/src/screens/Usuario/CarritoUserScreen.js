
import React, { useState, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  ImageBackground,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { firebaseConfig } from '../../firebase/FirebaseConfig';
import { useCart } from '../../context/CartContext';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

const API_URL = 'http://192.168.1.120:3000';

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

  // Evitar enviar dos veces el mismo pedido.
  const consultaActiva = useRef(false);

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

  // ============================================
  // CANTIDADES
  // ============================================

  const cambiarCantidad = (producto, cantidad) => {
    if (cantidad < 1 || cantidad > 4) return;
    updateQuantity(producto, cantidad);
  };

  // ============================================
  // VALIDAR CAMPOS
  // ============================================

  const validarTarjeta = () => {
    const numeroLimpio = numero.replace(/\s/g, '');
    const partesFecha = vencimiento.split('/');

    if (titular.trim().length < 3) return false;

    if (numeroLimpio.length !== 16) return false;

    if (
      partesFecha.length !== 2 ||
      partesFecha[0].length !== 2 ||
      partesFecha[1].length !== 2
    ) {
      return false;
    }

    const mes = Number(partesFecha[0]);

    if (mes < 1 || mes > 12) return false;

    if (cvv.length !== 3) return false;

    return true;
  };

  // ============================================
  // NORMALIZAR INVENTARIO
  // ============================================

  const obtenerProductosInventario = (datos) => {
    return datos.productos || datos.inventario || datos;
  };

  const obtenerCantidadStock = (inventario, id) => {
    const valor = inventario?.[id];

    if (typeof valor === 'object' && valor !== null) {
      return Number(valor.cantidad ?? valor.stock ?? 0);
    }

    return Number(valor ?? 0);
  };

  // ============================================
  // CONSULTAR ESTADO DEL PEDIDO
  // ============================================

  const consultarEstado = async (id) => {
    if (consultaActiva.current === false) return;

    try {
      const respuesta = await fetch(`${API_URL}/pedido/${id}`);

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'Error consultando pedido.'
        );
      }

      setEstadoPedido(datos);

      // ========================================
      // PEDIDO FINALIZADO
      // ========================================

      if (
        datos.estado === 'completado' ||
        datos.estado === 'error'
      ) {
        // Detener consultas posteriores.
        consultaActiva.current = false;

        const productosPedido = datos.productos || [];

        const entregadas = productosPedido.reduce(
          (suma, item) =>
            suma + Number(item.entregadas || 0),
          0
        );

        const fallidas = productosPedido.reduce(
          (suma, item) =>
            suma + Number(item.fallidas || 0),
          0
        );

        // ======================================
        // CALCULAR UNIDADES PENDIENTES
        // ======================================

        const pendientes = productosPedido.reduce(
          (suma, item) => {
            const solicitadas = Number(item.solicitada || 0);
            const entregadasItem = Number(item.entregadas || 0);

            return suma + Math.max(
              0,
              solicitadas - entregadasItem
            );
          },
          0
        );

        // ======================================
        // ACTUALIZAR CARRITO
        // ======================================

        if (pendientes === 0) {
          // Todas las bebidas fueron entregadas.
          clearCart();

        } else {
          // Conservar solamente las bebidas pendientes.
          productosPedido.forEach((item) => {
            const idProducto = item.producto;

            const solicitadas = Number(item.solicitada || 0);
            const entregadasItem = Number(item.entregadas || 0);

            const restantes = Math.max(
              0,
              solicitadas - entregadasItem
            );

            if (restantes === 0) {
              removeFromCart(idProducto);

            } else {
              updateQuantity(idProducto, restantes);
            }
          });
        }

        // ======================================
        // RESULTADO FINAL
        // ======================================

        setResultadoFinal({
          entregadas,
          fallidas,
          pendientes,
          mensaje: datos.mensaje || 'El pedido ha finalizado.',
        });

        setProcesando(false);
        setPantalla('resultado');

        return;
      }

      // ========================================
      // CONTINUAR CONSULTANDO
      // ========================================

      setTimeout(() => {
        consultarEstado(id);
      }, 1500);

    } catch (error) {
      console.log(
        'Error consultando pedido:',
        error.message
      );

      setTimeout(() => {
        consultarEstado(id);
      }, 3000);
    }
  };

  // ============================================
  // ENVIAR PEDIDO
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

    if (cart.length === 0) {
      setProcesando(false);

      Alert.alert(
        'Carrito vacío',
        'Agrega productos antes de comprar.'
      );

      setPantalla('carrito');

      return;
    }

    try {
      // Consultar inventario actualizado.

      const respuestaStock = await fetch(
        `${API_URL}/inventario`
      );

      if (!respuestaStock.ok) {
        throw new Error(
          'No se pudo consultar el inventario.'
        );
      }

      const datosStock = await respuestaStock.json();

      const inventarioActual =
        obtenerProductosInventario(datosStock);

      // Validar existencias.

      for (const item of cart) {
        const idProducto = item.producto || item.id;

        const disponible = obtenerCantidadStock(
          inventarioActual,
          idProducto
        );

        if (disponible <= 0) {
          throw new Error(
            `${item.nombre} ${item.presentacion} está agotado.`
          );
        }

        if (Number(item.cantidad) > disponible) {
          throw new Error(
            `Solo quedan ${disponible} unidades de ${item.nombre} ${item.presentacion}.`
          );
        }
      }

      const correo = usuarioActual.email || '';

      // Enviar pedido al servidor.

      const respuesta = await fetch(`${API_URL}/pedido`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          items: cart.map((item) => ({
            producto: item.producto || item.id,
            cantidad: Number(item.cantidad),
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
      setEstadoPedido(null);
      setResultadoFinal(null);

      consultaActiva.current = true;

      setPantalla('seguimiento');

      consultarEstado(datos.pedidoId);

    } catch (error) {
      console.log('Error enviando pedido:', error);

      setProcesando(false);
      consultaActiva.current = false;

      Alert.alert(
        'No se pudo procesar',
        error.message
      );
    }
  };

  // ============================================
  // PROCESAR COMPRA
  // ============================================

  const procesarPago = () => {
    if (procesando) return;

    if (!titular.trim() || !numero || !vencimiento || !cvv) {
      Alert.alert(
        'Datos incompletos',
        'Completa todos los campos.'
      );

      return;
    }

    if (titular.trim().length < 3) {
      Alert.alert(
        'Titular incorrecto',
        'Ingresa el nombre del titular.'
      );

      return;
    }

    if (numero.replace(/\s/g, '').length !== 16) {
      Alert.alert(
        'Número incorrecto',
        'El número debe tener 16 dígitos.'
      );

      return;
    }

    const partesFecha = vencimiento.split('/');
    const mes = Number(partesFecha[0]);

    if (
      vencimiento.length !== 5 ||
      partesFecha.length !== 2 ||
      mes < 1 ||
      mes > 12
    ) {
      Alert.alert(
        'Fecha incorrecta',
        'Ingresa una fecha válida en formato MM/AA.'
      );

      return;
    }

    if (cvv.length !== 3) {
      Alert.alert(
        'Código incorrecto',
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

    if (!validarTarjeta()) {
      Alert.alert(
        'Datos incorrectos',
        'Verifica los datos ingresados.'
      );

      return;
    }

    Alert.alert(
      'Confirmar compra',
      '¿Deseas continuar con tu pedido de demostración?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Continuar',

          onPress: () => {
            setProcesando(true);
            enviarPedido();
          },
        },
      ]
    );
  };

  // ============================================
  // ENCABEZADO
  // ============================================

  const renderHeader = (titulo, subtitulo, volver = false) => (
    <View style={styles.header}>

      {volver && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (!procesando) {
              setPantalla('carrito');
            }
          }}
          disabled={procesando}
        >
          <MaterialIcons
            name="arrow-back"
            size={21}
            color="#172B4D"
          />

          <Text style={styles.backText}>
            Volver
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.brandRow}>
        <Image
          source={MiLogo}
          style={styles.logo}
        />

        <Text style={styles.brandName}>
          SMARTGO
        </Text>
      </View>

      <Text style={styles.title}>
        {titulo}
      </Text>

      <Text style={styles.subtitle}>
        {subtitulo}
      </Text>

    </View>
  );

  // ============================================
  // CARRITO
  // ============================================

  const renderCarrito = () => (
    <>
      {renderHeader(
        'Mi carrito',
        'Revisa tus bebidas antes de continuar.'
      )}

      <View style={styles.content}>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Tus productos
            </Text>

            <Text style={styles.sectionSubtitle}>
              {cart.reduce(
                (suma, item) =>
                  suma + Number(item.cantidad || 0),
                0
              )} bebidas seleccionadas
            </Text>
          </View>

          <View style={styles.cartBadge}>
            <MaterialIcons
              name="shopping-cart"
              size={19}
              color="#FFFFFF"
            />
          </View>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCard}>

            <View style={styles.emptyIcon}>
              <MaterialIcons
                name="shopping-cart"
                size={48}
                color="#14569A"
              />
            </View>

            <Text style={styles.emptyTitle}>
              Tu carrito está vacío
            </Text>

            <Text style={styles.emptyText}>
              Todavía no has agregado bebidas.
              Visita la sección Compras para elegir tus favoritas.
            </Text>

          </View>
        ) : (
          <>
            {cart.map((item, index) => {
              const idProducto = item.producto || item.id;

              return (
                <View
                  style={styles.productCard}
                  key={`${idProducto || item.nombre}-${index}`}
                >

                  <View
                    style={[
                      styles.productIcon,
                      {
                        backgroundColor:
                          item.nombre === 'Pepsi'
                            ? '#EAF2FC'
                            : '#FDEEEF',
                      },
                    ]}
                  >
                    <MaterialIcons
                      name="local-drink"
                      size={34}
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

                    <Text style={styles.unitPrice}>
                      Q{Number(item.precio || 0).toFixed(2)} por unidad
                    </Text>

                    <Text style={styles.price}>
                      Q{(
                        Number(item.precio || 0) *
                        Number(item.cantidad || 0)
                      ).toFixed(2)}
                    </Text>

                  </View>

                  <View style={styles.controls}>

                    <View style={styles.quantityControl}>

                      <TouchableOpacity
                        onPress={() =>
                          cambiarCantidad(
                            idProducto,
                            Number(item.cantidad) - 1
                          )
                        }
                        disabled={item.cantidad <= 1}
                      >
                        <MaterialIcons
                          name="remove-circle-outline"
                          size={23}
                          color={
                            item.cantidad <= 1
                              ? '#CBD5E1'
                              : '#14569A'
                          }
                        />
                      </TouchableOpacity>

                      <Text style={styles.quantity}>
                        {item.cantidad}
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          cambiarCantidad(
                            idProducto,
                            Number(item.cantidad) + 1
                          )
                        }
                        disabled={item.cantidad >= 4}
                      >
                        <MaterialIcons
                          name="add-circle"
                          size={23}
                          color={
                            item.cantidad >= 4
                              ? '#CBD5E1'
                              : '#14569A'
                          }
                        />
                      </TouchableOpacity>

                    </View>

                    <TouchableOpacity
                      onPress={() => removeFromCart(idProducto)}
                      style={styles.removeButton}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color="#DC2626"
                      />

                      <Text style={styles.removeText}>
                        Quitar
                      </Text>
                    </TouchableOpacity>

                  </View>
                </View>
              );
            })}

            <View style={styles.summaryCard}>

              <View style={styles.summaryHeader}>
                <MaterialIcons
                  name="receipt-long"
                  size={21}
                  color="#14569A"
                />

                <Text style={styles.sectionTitle}>
                  Resumen de compra
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Cantidad de bebidas
                </Text>

                <Text style={styles.summaryValue}>
                  {cart.reduce(
                    (suma, item) =>
                      suma + Number(item.cantidad || 0),
                    0
                  )}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Subtotal
                </Text>

                <Text style={styles.summaryValue}>
                  Q{Number(total || 0).toFixed(2)}
                </Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>
                    Total
                  </Text>

                  <Text style={styles.totalCaption}>
                    Total de tu compra
                  </Text>
                </View>

                <Text style={styles.totalPrice}>
                  Q{Number(total || 0).toFixed(2)}
                </Text>
              </View>

            </View>

            <TouchableOpacity
              style={styles.payButton}
              onPress={() => setPantalla('pago')}
            >
              <MaterialIcons
                name="lock"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.payButtonText}>
                Continuar al pago
              </Text>

              <MaterialIcons
                name="arrow-forward"
                size={21}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.secureFooter}>
              <MaterialIcons
                name="verified-user"
                size={17}
                color="#FFFFFF"
              />

              <Text style={styles.secureFooterText}>
                Compra SMARTGO
              </Text>
            </View>

          </>
        )}

      </View>
    </>
  );

  // ============================================
  // PAGO
  // ============================================

  const renderPago = () => (
    <>
      {renderHeader(
        'Método de pago',
        'Ingresa los datos solicitados para continuar.',
        true
      )}

      <View style={styles.content}>

        <View style={styles.paymentCard}>

          <View style={styles.paymentCardHeader}>
            <Text style={styles.paymentCardBrand}>
              SMARTGO PAY
            </Text>

            <MaterialIcons
              name="contactless"
              size={27}
              color="#FFFFFF"
            />
          </View>

          <MaterialIcons
            name="credit-card"
            size={35}
            color="#D7E6F8"
          />

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
            Información de la tarjeta
          </Text>

          <Text style={styles.inputLabel}>
            Nombre del titular
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Nombre del titular"
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
                Código de seguridad
              </Text>

              <TextInput
                style={styles.input}
                placeholder="CVV"
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
              name="info-outline"
              size={20}
              color="#15803D"
            />

            <Text style={styles.securityText}>
              Esta pantalla es una demostración. No ingreses datos de una tarjeta real: no se realiza ningún cobro bancario.
            </Text>
          </View>

        </View>

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
                (suma, item) =>
                  suma + Number(item.cantidad || 0),
                0
              )}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total
            </Text>

            <Text style={styles.totalPrice}>
              Q{Number(total || 0).toFixed(2)}
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
                name="check-circle"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.payButtonText}>
                Confirmar pedido · Q{Number(total || 0).toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>

      </View>
    </>
  );

  // ============================================
  // SEGUIMIENTO
  // ============================================

  const renderSeguimiento = () => (
    <View style={styles.resultCard}>

      <View style={styles.loadingCircle}>
        <ActivityIndicator
          size="large"
          color="#C51F2B"
        />
      </View>

      <Text style={styles.resultTitle}>
        Preparando tu pedido
      </Text>

      <Text style={styles.resultMessage}>
        {estadoPedido?.mensaje ||
          'SMARTGO está procesando tu solicitud.'}
      </Text>

      <View style={styles.trackingLine} />

      {estadoPedido?.productos?.map((item, index) => (
        <View
          style={styles.progressItem}
          key={`${item.producto || 'pedido'}-${index}`}
        >
          <View style={styles.progressIcon}>
            <MaterialIcons
              name="local-drink"
              size={21}
              color="#14569A"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.progressName}>
              {String(item.producto || '').replace(/_/g, ' ')}
            </Text>

            <Text style={styles.progressCount}>
              {item.entregadas || 0} de {item.solicitada || 0} entregadas
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.waitNotice}>
        <MaterialIcons
          name="info-outline"
          size={18}
          color="#14569A"
        />

        <Text style={styles.waitNoticeText}>
          No desconectes Arduino mientras se procesa tu pedido.
        </Text>
      </View>

      <Text style={styles.orderId}>
        Pedido: {pedidoId}
      </Text>

    </View>
  );

  // ============================================
  // RESULTADO
  // ============================================

  const renderResultado = () => (
    <View style={styles.resultCard}>

      <View
        style={[
          styles.resultIconCircle,
          {
            backgroundColor:
              resultadoFinal?.entregadas > 0
                ? '#DCFCE7'
                : '#FEE2E2',
          },
        ]}
      >
        <MaterialIcons
          name={
            resultadoFinal?.entregadas > 0
              ? 'check-circle'
              : 'info'
          }
          size={58}
          color={
            resultadoFinal?.entregadas > 0
              ? '#15803D'
              : '#DC2626'
          }
        />
      </View>

      <Text style={styles.resultTitle}>
        {resultadoFinal?.entregadas > 0
          ? '¡Gracias por tu compra!'
          : 'Pedido no completado'}
      </Text>

      <Text style={styles.resultMessage}>
        {resultadoFinal?.mensaje}
      </Text>

      <View style={styles.finalSummary}>

        <View style={styles.finalItem}>
          <Text style={styles.finalNumber}>
            {resultadoFinal?.entregadas || 0}
          </Text>

          <Text style={styles.finalLabel}>
            Bebidas entregadas
          </Text>
        </View>

        <View style={styles.finalDivider} />

        <View style={styles.finalItem}>
          <Text
            style={[
              styles.finalNumber,
              { color: '#DC2626' },
            ]}
          >
            {resultadoFinal?.fallidas || 0}
          </Text>

          <Text style={styles.finalLabel}>
            Bebidas no entregadas
          </Text>
        </View>

      </View>

      {resultadoFinal?.pendientes > 0 && (
        <View style={styles.waitNotice}>
          <MaterialIcons
            name="info-outline"
            size={18}
            color="#14569A"
          />

          <Text style={styles.waitNoticeText}>
            Se conservaron {resultadoFinal.pendientes} unidades pendientes en tu carrito.
          </Text>
        </View>
      )}

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
    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.backgroundOverlay} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {pantalla === 'carrito' && renderCarrito()}

        {pantalla === 'pago' && renderPago()}

        {pantalla === 'seguimiento' && renderSeguimiento()}

        {pantalla === 'resultado' && renderResultado()}

        <View style={{ height: 35 }} />
      </ScrollView>
    </ImageBackground>
  );
}

// ============================================
// ESTILOS SMARTGO
// ============================================

const styles = StyleSheet.create({

  background: {
    flex: 1,
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 31, 58, 0.38)',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 12,
  },

  header: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 21,
    paddingTop: 19,
    paddingBottom: 21,
    borderRadius: 20,
    elevation: 5,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },

  logo: {
    width: 45,
    height: 45,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  brandName: {
    color: '#172B4D',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },

  title: {
    color: '#172033',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 2,
  },

  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 16,
  },

  backText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 13,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 19,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
    paddingHorizontal: 3,
  },

  sectionTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },

  cartBadge: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#14569A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 28,
    borderRadius: 19,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },

  emptyIcon: {
    width: 85,
    height: 85,
    borderRadius: 25,
    backgroundColor: '#EAF2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: '#172033',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 17,
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    fontSize: 13,
  },

  productCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    padding: 14,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    elevation: 3,
  },

  productIcon: {
    width: 57,
    height: 65,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '800',
  },

  presentation: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  unitPrice: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 5,
  },

  price: {
    color: '#C51F2B',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },

  controls: {
    alignItems: 'center',
    gap: 10,
  },

  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 91,
    backgroundColor: '#F1F5F9',
    borderRadius: 11,
    paddingHorizontal: 7,
    paddingVertical: 7,
  },

  quantity: {
    color: '#172033',
    fontWeight: '900',
    fontSize: 14,
  },

  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
  },

  removeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 7,
    padding: 19,
    borderRadius: 18,
    elevation: 3,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },

  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
  },

  summaryValue: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '700',
  },

  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 13,
  },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '900',
  },

  totalCaption: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  totalPrice: {
    color: '#C51F2B',
    fontSize: 24,
    fontWeight: '900',
  },

  payButton: {
    backgroundColor: '#C51F2B',
    marginTop: 15,
    paddingVertical: 16,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
  },

  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  secureFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
    marginTop: 15,
  },

  secureFooterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },

  paymentCard: {
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#172B4D',
    minHeight: 195,
    justifyContent: 'space-between',
    elevation: 6,
    marginBottom: 17,
  },

  paymentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  paymentCardBrand: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 13,
  },

  cardNumberPreview: {
    color: '#FFFFFF',
    fontSize: 19,
    letterSpacing: 2,
    marginVertical: 14,
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
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 5,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    padding: 19,
    borderRadius: 18,
    elevation: 3,
  },

  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 13,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#DCE2EA',
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#172033',
    fontSize: 13,
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
    borderRadius: 11,
    marginTop: 18,
  },

  securityText: {
    color: '#166534',
    fontSize: 11,
    flex: 1,
    lineHeight: 17,
  },

  resultCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
  },

  loadingCircle: {
    width: 85,
    height: 85,
    borderRadius: 28,
    backgroundColor: '#FDEEEF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultTitle: {
    color: '#172033',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 18,
  },

  resultMessage: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 9,
  },

  trackingLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginVertical: 18,
  },

  progressItem: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 13,
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  progressIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EAF2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressName: {
    color: '#172033',
    fontWeight: '800',
    fontSize: 12,
  },

  progressCount: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },

  waitNotice: {
    backgroundColor: '#EAF2FC',
    width: '100%',
    borderRadius: 11,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 19,
  },

  waitNoticeText: {
    color: '#334155',
    fontSize: 11,
    flex: 1,
    lineHeight: 17,
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
    borderRadius: 14,
    padding: 18,
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  finalItem: {
    flex: 1,
    alignItems: 'center',
  },

  finalDivider: {
    width: 1,
    height: 55,
    backgroundColor: '#E2E8F0',
  },

  finalNumber: {
    color: '#15803D',
    fontSize: 29,
    fontWeight: '900',
  },

  finalLabel: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },

});
