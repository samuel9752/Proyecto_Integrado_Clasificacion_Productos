
import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function UserScreen() {

  // ANIMACIÓN DE BIENVENIDA

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-25)).current;

  useEffect(() => {

    Animated.parallel([

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true
      })

    ]).start();

  }, []);

  return (

    <View style={styles.screen}>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* BIENVENIDA */}

        <Animated.View
          style={[
            styles.welcomeContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >

          
          <Text style={styles.welcomeTitle}>
            ¡Bienvenido, usuario!
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Disfruta de tus bebidas favoritas
          </Text>

        </Animated.View>





        {/* MI CARRITO */}

        <View style={styles.card}>

          <View style={styles.sectionHeader}>

            <MaterialIcons
              name="shopping-cart"
              size={23}
              color="#C51F2B"
            />

            <Text style={styles.cardTitle}>
              Mi carrito de compras
            </Text>

          </View>

          <Text style={styles.description}>
            Aquí puedes consultar los productos que
            deseas comprar.
          </Text>


          {/* VISTA PREVIA DEL CARRITO */}

          <View style={styles.cartPreview}>

            <View style={styles.cartIconContainer}>

              <MaterialIcons
                name="shopping-basket"
                size={35}
                color="#0756A5"
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

          </View>


          <View style={styles.divider} />


          {/* TOTAL DEL CARRITO */}

          <View style={styles.totalContainer}>

            <Text style={styles.totalLabel}>
              Total de tu carrito
            </Text>

            <Text style={styles.totalPrice}>
              Q 0.00
            </Text>

          </View>

          <View style={styles.emptyMessage}>

            <MaterialIcons
              name="info-outline"
              size={17}
              color="#7B8491"
            />

            <Text style={styles.emptyText}>
              Agrega bebidas desde el catálogo para comenzar.
            </Text>

          </View>

        </View>


        {/* MIS COMPRAS */}

        <View style={styles.card}>

          <View style={styles.sectionHeader}>

            <MaterialIcons
              name="receipt-long"
              size={23}
              color="#0756A5"
            />

            <Text style={styles.cardTitle}>
              Mis compras
            </Text>

          </View>

          <Text style={styles.description}>
            Consulta el historial de tus compras realizadas.
          </Text>


          {/* HISTORIAL DE COMPRAS */}

          <View style={styles.purchaseEmpty}>

            <View style={styles.purchaseIconContainer}>

              <MaterialIcons
                name="history"
                size={38}
                color="#7B8491"
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


    


        {/* PIE DE PÁGINA */}

        <Text style={styles.footer}>
          Máquina expendedora · Panel de usuario
        </Text>

      </ScrollView>

    </View>

  );

}


// ========================================
// ESTILOS
// ========================================

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#EEF0F3'
  },

  container: {
    padding: 18,
    paddingBottom: 35
  },


  // BIENVENIDA

  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 25
  },

  welcomeIcon: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#E1EBF8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },

  welcomeTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#252B35',
    textAlign: 'center',
    padding: '80'
  },

  welcomeSubtitle: {
    fontSize: 12,
    color: '#7B8491',
    marginTop: 8,
    textAlign: 'center'
  },


  // RESUMEN

  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 17
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 16,
    alignItems: 'center',
    elevation: 2
  },

  summaryIconBlue: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: '#E9F0FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9
  },

  summaryIconRed: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: '#FCEBEC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9
  },

  summaryNumber: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#252B35'
  },

  summaryLabel: {
    fontSize: 11,
    color: '#7B8491',
    marginTop: 4,
    textAlign: 'center'
  },


  // TARJETAS GENERALES

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 20,
    marginBottom: 17,
    elevation: 2
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
  },

  cardTitle: {
    fontSize: 16,
    color: '#252B35',
    fontWeight: 'bold'
  },

  description: {
    fontSize: 12,
    color: '#7B8491',
    lineHeight: 19,
    marginBottom: 15
  },

  divider: {
    height: 1,
    backgroundColor: '#E8EBEF',
    marginVertical: 12
  },


  // CARRITO

  cartPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 13
  },

  cartIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E9F0FA',
    alignItems: 'center',
    justifyContent: 'center'
  },

  cartInfo: {
    flex: 1,
    marginLeft: 12
  },

  cartTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#252B35'
  },

  cartDescription: {
    fontSize: 11,
    color: '#7B8491',
    marginTop: 5,
    lineHeight: 16
  },

  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  totalLabel: {
    fontSize: 13,
    color: '#252B35',
    fontWeight: 'bold'
  },

  totalPrice: {
    fontSize: 18,
    color: '#C51F2B',
    fontWeight: 'bold'
  },

  emptyMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 7
  },

  emptyText: {
    flex: 1,
    fontSize: 10,
    color: '#7B8491'
  },


  // HISTORIAL DE COMPRAS

  purchaseEmpty: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },

  purchaseIconContainer: {
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: '#E8EBEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },

  purchaseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#252B35',
    textAlign: 'center'
  },

  purchaseDescription: {
    fontSize: 11,
    color: '#7B8491',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 7
  },


  // CUENTA

  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12
  },

  accountText: {
    flex: 1,
    fontSize: 13,
    color: '#252B35',
    fontWeight: '500'
  },


  // PIE DE PÁGINA

  footer: {
    fontSize: 11,
    color: '#9AA2AD',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10
  }

});
