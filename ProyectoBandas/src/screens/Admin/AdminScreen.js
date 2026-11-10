
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

export default function AdminScreen() {

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

        {/* BIENVENIDA ADMINISTRADOR */}

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
            Bienvenido, administrador
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Panel de control de la máquina expendedora
          </Text>

        </Animated.View>


        {/* PANEL ADMINISTRATIVO */}

        <View style={styles.card}>

          <View style={styles.sectionHeader}>

            <MaterialIcons
              name="admin-panel-settings"
              size={23}
              color="#C51F2B"
            />

            <Text style={styles.cardTitle}>
              Panel administrativo
            </Text>

          </View>

          <Text style={styles.description}>
            Herramientas disponibles para la administración
            y supervisión de la máquina expendedora.
          </Text>


          {/* GESTIÓN DE USUARIOS */}

          <View style={styles.adminOption}>

            <View style={styles.adminIcon}>

              <MaterialIcons
                name="people"
                size={25}
                color="#0756A5"
              />

            </View>

            <View style={styles.adminInfo}>

              <Text style={styles.adminTitle}>
                Gestión de usuarios
              </Text>

              <Text style={styles.adminDescription}>
                Administración de cuentas registradas.
              </Text>

            </View>

          </View>

          <View style={styles.divider} />


          {/* CONTROL DE EXISTENCIAS */}

          <View style={styles.adminOption}>

            <View style={styles.adminIcon}>

              <MaterialIcons
                name="inventory"
                size={25}
                color="#C51F2B"
              />

            </View>

            <View style={styles.adminInfo}>

              <Text style={styles.adminTitle}>
                Control de existencias
              </Text>

              <Text style={styles.adminDescription}>
                Supervisión del inventario de bebidas.
              </Text>

            </View>

          </View>

          <View style={styles.divider} />


          {/* MÁQUINA EXPENDEDORA */}

          <View style={styles.adminOption}>

            <View style={styles.adminIcon}>

              <MaterialIcons
                name="precision-manufacturing"
                size={25}
                color="#0756A5"
              />

            </View>

            <View style={styles.adminInfo}>

              <Text style={styles.adminTitle}>
                Máquina expendedora
              </Text>

              <Text style={styles.adminDescription}>
                Supervisión del funcionamiento del sistema.
              </Text>

            </View>

          </View>

        </View>


        {/* SISTEMA DE BEBIDAS */}

        <View style={styles.card}>

          <Text style={styles.cardTitle}>
            Sistema de bebidas
          </Text>

          <Text style={styles.brandDescription}>
            Marcas disponibles en nuestra máquina
          </Text>

          <View style={styles.brandsContainer}>

            {/* COCA-COLA */}

            <View style={styles.cocaCard}>

              <Text style={styles.cocaText}>
                Coca-Cola
              </Text>

            </View>


            {/* PEPSI */}

            <View style={styles.pepsiCard}>

              <Text style={styles.pepsiText}>
                PEPSI
              </Text>

            </View>

          </View>

        </View>

      </ScrollView>

    </View>

  );

}




const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#EEF0F3'
  },

  container: {
    padding: 18,
    paddingBottom: 35
  },


  // BIENVENIDA ADMINISTRADOR

  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    marginBottom: 25,
    paddingHorizontal: 5
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


  // PANEL ADMINISTRATIVO

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
    marginBottom: 12
  },

  adminOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15
  },

  adminIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center'
  },

  adminInfo: {
    flex: 1,
    marginLeft: 13
  },

  adminTitle: {
    fontSize: 14,
    color: '#252B35',
    fontWeight: 'bold'
  },

  adminDescription: {
    fontSize: 11,
    color: '#7B8491',
    marginTop: 5
  },

  divider: {
    height: 1,
    backgroundColor: '#E8EBEF'
  },


  // SISTEMA DE BEBIDAS

  brandDescription: {
    fontSize: 12,
    color: '#7B8491',
    marginTop: 6,
    marginBottom: 17
  },

  brandsContainer: {
    flexDirection: 'row',
    gap: 12
  },

  cocaCard: {
    flex: 1,
    backgroundColor: '#FCEBEC',
    borderRadius: 9,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },

  cocaText: {
    fontSize: 15,
    color: '#C51F2B',
    fontWeight: 'bold'
  },

  pepsiCard: {
    flex: 1,
    backgroundColor: '#E9F0FA',
    borderRadius: 9,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },

  pepsiText: {
    fontSize: 16,
    color: '#0756A5',
    fontWeight: 'bold'
  }

});
