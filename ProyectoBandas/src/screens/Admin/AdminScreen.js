
import React, { useEffect, useRef } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  Image,
  ImageBackground,
  StatusBar
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// IMÁGENES
import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

export default function AdminScreen({ navigation }) {

  // ANIMACIÓN
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
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
    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar
        backgroundColor="#06152D"
        barStyle="light-content"
      />

      <View style={styles.overlay} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >

        {/* ENCABEZADO */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >

          <View style={styles.brandContainer}>

            <Image
              source={MiLogo}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.brandInfo}>
              <Text style={styles.brandTitle}>
                SMART<Text style={styles.brandBlue}>GO</Text>
              </Text>

            </View>

            <View style={styles.adminBadge}>
              <MaterialIcons
                name="admin-panel-settings"
                size={23}
                color="#FFFFFF"
              />
            </View>

          </View>

          <View style={styles.headerLine} />

          <Text style={styles.welcomeSmall}>
            PANEL DE ADMINISTRACIÓN
          </Text>

          <Text style={styles.welcomeTitle}>
            ¡Bienvenido!
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Administra y supervisa tu máquina expendedora
            desde un solo lugar.
          </Text>

          <View style={styles.welcomeTag}>
            <View style={styles.onlineDot} />
            <Text style={styles.welcomeTagText}>
              SISTEMA DE ADMINISTRACIÓN
            </Text>
          </View>

        </Animated.View>

        {/* PANEL ADMINISTRATIVO */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Centro de control
            </Text>

            <Text style={styles.sectionSubtitle}>
              Herramientas de administración
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <MaterialIcons
              name="dashboard"
              size={25}
              color="#39A9FF"
            />
          </View>
        </View>

        <View style={styles.card}>

          {/* GESTIÓN DE PERFIL */}
          <TouchableOpacity
            style={styles.adminOption}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.optionIcon, styles.blueIcon]}>
              <MaterialIcons
                name="people-alt"
                size={27}
                color="#39A9FF"
              />
            </View>

            <View style={styles.adminInfo}>
              <Text style={styles.adminTitle}>
                Gestión de perfil
              </Text>

              <Text style={styles.adminDescription}>
                Administración de cuentas registradas.
              </Text>
            </View>

            <MaterialIcons
              name="manage-accounts"
              size={23}
              color="#7195BB"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* EXISTENCIAS */}
          <TouchableOpacity
            style={styles.adminOption}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Existencias')}
          >
            <View style={[styles.optionIcon, styles.redIcon]}>
              <MaterialIcons
                name="inventory-2"
                size={27}
                color="#FF5964"
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

            <MaterialIcons
              name="analytics"
              size={23}
              color="#7195BB"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* SUPERVISIÓN DE LA MÁQUINA */}
          <TouchableOpacity
            style={styles.adminOption}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Sobrecalentamiento')}
          >
            <View style={[styles.optionIcon, styles.cyanIcon]}>
              <MaterialIcons
                name="precision-manufacturing"
                size={27}
                color="#42C9D9"
              />
            </View>

            <View style={styles.adminInfo}>
              <Text style={styles.adminTitle}>
                Supervisión de la máquina
              </Text>

              <Text style={styles.adminDescription}>
                Supervisión del funcionamiento del sistema.
              </Text>
            </View>

            <MaterialIcons
              name="settings"
              size={23}
              color="#7195BB"
            />
          </TouchableOpacity>

        </View>

        {/* MARCAS */}
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>
              Nuestras bebidas
            </Text>

            <Text style={styles.sectionSubtitle}>
              Productos disponibles en SMARTGO
            </Text>
          </View>

          <View style={styles.sectionIcon}>
            <MaterialIcons
              name="local-drink"
              size={25}
              color="#39A9FF"
            />
          </View>
        </View>

        <View style={styles.brandsContainer}>

          <View style={styles.cocaCard}>
            <View style={styles.brandCircle}>
              <MaterialIcons
                name="local-drink"
                size={29}
                color="#FF5964"
              />
            </View>

            <Text style={styles.cocaTitle}>
              Coca-Cola
            </Text>

            <Text style={styles.brandCaption}>
              REFRESCA TU MOMENTO
            </Text>

            <View style={styles.cocaLine} />
          </View>

          <View style={styles.pepsiCard}>
            <View style={styles.brandCircle}>
              <MaterialIcons
                name="local-drink"
                size={29}
                color="#39A9FF"
              />
            </View>

            <Text style={styles.pepsiTitle}>
              PEPSI
            </Text>

            <Text style={styles.brandCaption}>
              DISFRUTA CADA MOMENTO
            </Text>

            <View style={styles.pepsiLine} />
          </View>

        </View>

        {/* MENSAJE FINAL */}
        <View style={styles.infoCard}>
          <MaterialIcons
            name="verified-user"
            size={25}
            color="#39A9FF"
          />

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Administración SMARTGO
            </Text>

            <Text style={styles.infoDescription}>
              Gestiona los recursos y supervisa el
              funcionamiento de tu máquina.
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            SMARTGO
          </Text>

          <Text style={styles.footerSubtitle}>
            SISTEMA INTELIGENTE DE VENDING
          </Text>

          <View style={styles.footerLines}>
            <View style={styles.redLine} />
            <View style={styles.blueLine} />
          </View>
        </View>

      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({

  background: {
    flex: 1
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 17, 39, 0.78)'
  },

  screen: {
    flex: 1
  },

  container: {
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 35
  },

  // ENCABEZADO
  header: {
    backgroundColor: 'rgba(8, 31, 63, 0.94)',
    borderRadius: 23,
    padding: 22,
    borderWidth: 1,
    borderColor: '#24517D',
    elevation: 7,
    marginBottom: 28
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  logo: {
    width: 65,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#FFFFFF'
  },

  brandInfo: {
    marginLeft: 13,
    flex: 1
  },

  brandTitle: {
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1
  },

  brandBlue: {
    color: '#39A9FF'
  },

  brandSubtitle: {
    color: '#A9C5E8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2
  },

  adminBadge: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#14569A',
    alignItems: 'center',
    justifyContent: 'center'
  },

  headerLine: {
    height: 1,
    backgroundColor: '#28517A',
    marginVertical: 20
  },

  welcomeSmall: {
    color: '#49B4FF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 9
  },

  welcomeSubtitle: {
    color: '#B7CBE3',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 9
  },

  welcomeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#103D62',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
    marginTop: 20
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#36D399',
    marginRight: 8
  },

  welcomeTagText: {
    color: '#B9E5FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },

  // TÍTULOS
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900'
  },

  sectionSubtitle: {
    color: '#A9C5E8',
    fontSize: 11,
    marginTop: 5
  },

  sectionIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: '#102F57',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24517D'
  },

  // TARJETA ADMINISTRATIVA
  card: {
    backgroundColor: 'rgba(9, 33, 66, 0.96)',
    borderRadius: 20,
    paddingHorizontal: 17,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#214875',
    elevation: 5,
    marginBottom: 28
  },

  adminOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 19
  },

  optionIcon: {
    width: 51,
    height: 51,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },

  blueIcon: {
    backgroundColor: '#103B65'
  },

  redIcon: {
    backgroundColor: '#482536'
  },

  cyanIcon: {
    backgroundColor: '#123F50'
  },

  adminInfo: {
    flex: 1,
    marginLeft: 13,
    marginRight: 5
  },

  adminTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },

  adminDescription: {
    color: '#A9C5E8',
    fontSize: 10,
    marginTop: 6,
    lineHeight: 16
  },

  divider: {
    height: 1,
    backgroundColor: '#1B3D62'
  },

  // MARCAS
  brandsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 23
  },

  cocaCard: {
    flex: 1,
    backgroundColor: 'rgba(65, 25, 43, 0.96)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A52B43'
  },

  pepsiCard: {
    flex: 1,
    backgroundColor: 'rgba(12, 43, 83, 0.97)',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#167CC2'
  },

  brandCircle: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },

  cocaTitle: {
    color: '#FF5964',
    fontSize: 16,
    fontWeight: '900'
  },

  pepsiTitle: {
    color: '#49B4FF',
    fontSize: 18,
    fontWeight: '900'
  },

  brandCaption: {
    color: '#C4D4E8',
    fontSize: 7,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 7,
    letterSpacing: 0.5
  },

  cocaLine: {
    height: 3,
    width: 35,
    backgroundColor: '#E5252A',
    borderRadius: 5,
    marginTop: 13
  },

  pepsiLine: {
    height: 3,
    width: 35,
    backgroundColor: '#168BFF',
    borderRadius: 5,
    marginTop: 13
  },

  // INFORMACIÓN
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 45, 82, 0.96)',
    borderRadius: 16,
    padding: 17,
    borderWidth: 1,
    borderColor: '#24517D'
  },

  infoContent: {
    flex: 1,
    marginLeft: 13
  },

  infoTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900'
  },

  infoDescription: {
    color: '#A9C5E8',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 5
  },

  // FOOTER
  footer: {
    alignItems: 'center',
    marginTop: 28
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 3
  },

  footerSubtitle: {
    color: '#91AAC9',
    fontSize: 8,
    marginTop: 6,
    letterSpacing: 1.5
  },

  footerLines: {
    flexDirection: 'row',
    width: 65,
    height: 4,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 13
  },

  redLine: {
    flex: 1,
    backgroundColor: '#E5252A'
  },

  blueLine: {
    flex: 1,
    backgroundColor: '#168BFF'
  }

});
