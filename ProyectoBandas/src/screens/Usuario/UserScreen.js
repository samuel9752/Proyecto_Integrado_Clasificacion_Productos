
import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Image,
  ImageBackground,
  SafeAreaView,
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

export default function UserScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* ENCABEZADO */}

          <Animated.View
            style={[
              styles.welcomeContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.brandRow}>
              <Image source={MiLogo} style={styles.logo} />

              <View>
                <Text style={styles.brandName}>SMARTGO</Text>
                <Text style={styles.brandCaption}>
                  VENDING SYSTEM
                </Text>
              </View>
            </View>

            <View style={styles.welcomeIcon}>
              <MaterialIcons
                name="waving-hand"
                size={32}
                color="#C51F2B"
              />
            </View>

            <Text style={styles.welcomeTitle}>
              ¡Bienvenido!
            </Text>

            <Text style={styles.welcomeSubtitle}>
              Disfruta de tus bebidas favoritas
            </Text>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                Panel de usuario
              </Text>
            </View>
          </Animated.View>

          {/* TARJETAS DE RESUMEN */}

          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIconBlue}>
                <MaterialIcons
                  name="shopping-cart"
                  size={25}
                  color="#14569A"
                />
              </View>

              <Text style={styles.summaryNumber}>0</Text>

              <Text style={styles.summaryLabel}>
                Productos en carrito
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryIconRed}>
                <MaterialIcons
                  name="receipt-long"
                  size={25}
                  color="#C51F2B"
                />
              </View>

              <Text style={styles.summaryNumber}>0</Text>

              <Text style={styles.summaryLabel}>
                Compras realizadas
              </Text>
            </View>
          </View>

          {/* MI CARRITO */}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconRed}>
                <MaterialIcons
                  name="shopping-cart"
                  size={23}
                  color="#C51F2B"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Mi carrito de compras
                </Text>

                <Text style={styles.cardSubtitle}>
                  Tus productos seleccionados
                </Text>
              </View>
            </View>

            <View style={styles.cartPreview}>
              <View style={styles.cartIconContainer}>
                <MaterialIcons
                  name="shopping-basket"
                  size={34}
                  color="#14569A"
                />
              </View>

              <View style={styles.cartInfo}>
                <Text style={styles.cartTitle}>
                  Vista previa del carrito
                </Text>

                <Text style={styles.cartDescription}>
                  Todavía no tienes productos agregados.
                </Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={25}
                color="#94A3B8"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.totalContainer}>
              <View>
                <Text style={styles.totalLabel}>
                  Total de tu carrito
                </Text>

                <Text style={styles.totalCaption}>
                  Importe de tus productos
                </Text>
              </View>

              <Text style={styles.totalPrice}>
                Q 0.00
              </Text>
            </View>

            <View style={styles.emptyMessage}>
              <MaterialIcons
                name="info-outline"
                size={17}
                color="#14569A"
              />

              <Text style={styles.emptyText}>
                Agrega bebidas desde el catálogo para comenzar.
              </Text>
            </View>
          </View>

          {/* MIS COMPRAS */}

          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBlue}>
                <MaterialIcons
                  name="receipt-long"
                  size={23}
                  color="#14569A"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Mis compras
                </Text>

                <Text style={styles.cardSubtitle}>
                  Historial de pedidos
                </Text>
              </View>
            </View>

            <View style={styles.purchaseEmpty}>
              <View style={styles.purchaseIconContainer}>
                <MaterialIcons
                  name="history"
                  size={38}
                  color="#14569A"
                />
              </View>

              <Text style={styles.purchaseTitle}>
                Sin compras todavía
              </Text>

              <Text style={styles.purchaseDescription}>
                Cuando realices una compra, aparecerá
                aquí el detalle de tu pedido.
              </Text>
            </View>
          </View>

          {/* INFORMACIÓN */}

          <View style={styles.infoCard}>
            <MaterialIcons
              name="local-drink"
              size={30}
              color="#FFFFFF"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>
                ¡Elige tu bebida favorita!
              </Text>

              <Text style={styles.infoDescription}>
                Explora nuestro catálogo y disfruta de SMARTGO.
              </Text>
            </View>

            <MaterialIcons
              name="arrow-forward"
              size={22}
              color="#FFFFFF"
            />
          </View>

          {/* PIE DE PÁGINA */}

          <Text style={styles.footer}>
            SMARTGO · Máquina expendedora inteligente
          </Text>

        </ScrollView>
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

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 31, 58, 0.38)',
  },

  safeArea: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 17,
    paddingTop: 35,
    paddingBottom: 65,
  },

  // MARCA Y BIENVENIDA

  welcomeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    marginBottom: 17,
    elevation: 5,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    marginBottom: 23,
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  brandName: {
    color: '#172B4D',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },

  brandCaption: {
    color: '#64748B',
    fontSize: 9,
    letterSpacing: 2,
    marginTop: 2,
  },

  welcomeIcon: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#FDEEEF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  welcomeTitle: {
    fontSize: 29,
    fontWeight: '900',
    color: '#172033',
    textAlign: 'center',
    marginTop: 13,
  },

  welcomeSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 7,
    textAlign: 'center',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FC',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 7,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#15803D',
  },

  statusText: {
    color: '#14569A',
    fontSize: 11,
    fontWeight: '700',
  },

  // RESUMEN

  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 17,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    alignItems: 'center',
    elevation: 3,
  },

  summaryIconBlue: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EAF2FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  summaryIconRed: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FDEEEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  summaryNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#172033',
  },

  summaryLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 5,
    textAlign: 'center',
  },

  // TARJETAS GENERALES

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 17,
    elevation: 4,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 16,
  },

  sectionIconRed: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FDEEEF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionIconBlue: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EAF2FC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 15,
    color: '#172033',
    fontWeight: '900',
  },

  cardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#E8EBEF',
    marginVertical: 15,
  },

  // CARRITO

  cartPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F8FC',
    borderRadius: 13,
    padding: 13,
  },

  cartIconContainer: {
    width: 53,
    height: 53,
    borderRadius: 13,
    backgroundColor: '#EAF2FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cartInfo: {
    flex: 1,
    marginLeft: 12,
  },

  cartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#172033',
  },

  cartDescription: {
    fontSize: 10,
    color: '#7B8491',
    marginTop: 5,
    lineHeight: 16,
  },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 13,
    color: '#172033',
    fontWeight: '800',
  },

  totalCaption: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 4,
  },

  totalPrice: {
    fontSize: 21,
    color: '#C51F2B',
    fontWeight: '900',
  },

  emptyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 7,
    backgroundColor: '#F5F8FC',
    padding: 11,
    borderRadius: 10,
  },

  emptyText: {
    flex: 1,
    fontSize: 10,
    color: '#64748B',
    lineHeight: 16,
  },

  // HISTORIAL

  purchaseEmpty: {
    backgroundColor: '#F5F8FC',
    borderRadius: 14,
    padding: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  purchaseIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#EAF2FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  purchaseTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#172033',
    textAlign: 'center',
  },

  purchaseDescription: {
    fontSize: 11,
    color: '#7B8491',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7,
  },

  // INFORMACIÓN

  infoCard: {
    backgroundColor: '#14569A',
    borderRadius: 17,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    marginBottom: 18,
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },

  infoDescription: {
    color: '#DCEAF8',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 4,
  },

  // PIE

  footer: {
    fontSize: 10,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },

});
