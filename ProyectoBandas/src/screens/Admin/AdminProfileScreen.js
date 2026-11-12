
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  ImageBackground,
  StatusBar
} from 'react-native';

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc
} from 'firebase/firestore';

import {
  initializeApp,
  getApps
} from 'firebase/app';

import { firebaseConfig } from '../../firebase/FirebaseConfig';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

export default function AdminProfileScreen({ navigation }) {

  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {

        if (user) {

          try {

            const referencia = doc(db, 'usuarios', user.uid);
            const documento = await getDoc(referencia);

            const datos = documento.exists()
              ? documento.data()
              : {};

            setUsuario({
              email: user.email || 'No disponible',
              uid: user.uid,
              tipoUsuario: datos.tipoUsuario || 'No definido'
            });

          } catch (error) {

            console.log('Error al cargar perfil:', error);
            setUsuario(null);

          }

        } else {

          setUsuario(null);

        }

        setCargando(false);

      }
    );

    return unsubscribe;

  }, []);

  // CERRAR SESIÓN

  const cerrarSesion = () => {

    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar tu sesión de administrador?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {

            try {

              await signOut(auth);
              navigation.getParent()?.navigate('Login');

            } catch (error) {

              console.log('Error al cerrar sesión:', error);

              Alert.alert(
                'Error',
                'No se pudo cerrar la sesión.'
              );

            }

          }
        }
      ]
    );

  };

  // CARGANDO

  if (cargando) {

    return (
      <ImageBackground
        source={FondoAzul}
        style={styles.loadingContainer}
        resizeMode="cover"
      >

        <StatusBar barStyle="light-content" />

        <View style={styles.loadingOverlay} />

        <ActivityIndicator size="large" color="#FFFFFF" />

        <Text style={styles.loadingText}>
          Cargando perfil...
        </Text>

      </ImageBackground>
    );

  }

  // SIN USUARIO

  if (!usuario) {

    return (
      <ImageBackground
        source={FondoAzul}
        style={styles.loadingContainer}
        resizeMode="cover"
      >

        <View style={styles.loadingOverlay} />

        <MaterialIcons
          name="person-off"
          size={60}
          color="#FFFFFF"
        />

        <Text style={styles.loadingText}>
          No hay ningún usuario iniciado sesión.
        </Text>

      </ImageBackground>
    );

  }

  // VALIDAR ADMINISTRADOR

  const esAdmin =
    usuario.tipoUsuario.toLowerCase() === 'administrador';

  if (!esAdmin) {

    return (
      <ImageBackground
        source={FondoAzul}
        style={styles.loadingContainer}
        resizeMode="cover"
      >

        <View style={styles.loadingOverlay} />

        <MaterialIcons
          name="lock"
          size={60}
          color="#FFFFFF"
        />

        <Text style={styles.loadingText}>
          No tienes permisos de administrador.
        </Text>

      </ImageBackground>
    );

  }

  return (

    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >

      <StatusBar barStyle="light-content" />

      <View style={styles.overlay} />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
              name="admin-panel-settings"
              size={28}
              color="#FFFFFF"
            />
          </View>

        </View>

        {/* TÍTULO */}

        <View style={styles.titleContainer}>

          <Text style={styles.welcome}>
            MI CUENTA
          </Text>

          <Text style={styles.title}>
            Perfil de administrador
          </Text>

          <Text style={styles.subtitle}>
            Consulta y administra la información de tu cuenta.
          </Text>

        </View>

        {/* TARJETA DE PERFIL */}

        <View style={styles.profileCard}>

          <View style={styles.profileTop}>

            <View style={styles.avatarContainer}>

              <MaterialIcons
                name="admin-panel-settings"
                size={48}
                color="#FFFFFF"
              />

            </View>

            <View style={styles.profileInfo}>

              <Text style={styles.profileName}>
                Administrador
              </Text>

              <Text style={styles.profileDescription}>
                Cuenta de administración SMARTGO
              </Text>

              <View style={styles.activeBadge}>

                <View style={styles.activeDot} />

                <Text style={styles.activeText}>
                  Cuenta activa
                </Text>

              </View>

            </View>

          </View>

          <View style={styles.profileDivider} />

          <Text style={styles.sectionTitle}>
            INFORMACIÓN DE LA CUENTA
          </Text>

          {/* CORREO */}

          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>
              <MaterialIcons
                name="email"
                size={22}
                color="#1766A8"
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.label}>
                CORREO ELECTRÓNICO
              </Text>

              <Text style={styles.value}>
                {usuario.email}
              </Text>

            </View>

          </View>

          <View style={styles.divider} />

          {/* ROL */}

          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>
              <MaterialIcons
                name="verified-user"
                size={22}
                color="#1766A8"
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.label}>
                ROL ASIGNADO
              </Text>

              <View style={styles.roleBadge}>

                <MaterialIcons
                  name="admin-panel-settings"
                  size={15}
                  color="#1766A8"
                />

                <Text style={styles.roleText}>
                  Administrador
                </Text>

              </View>

            </View>

          </View>

          <View style={styles.divider} />

          {/* UID */}

          <View style={styles.infoRow}>

            <View style={styles.infoIcon}>
              <MaterialIcons
                name="fingerprint"
                size={22}
                color="#1766A8"
              />
            </View>

            <View style={styles.infoContent}>

              <Text style={styles.label}>
                IDENTIFICADOR DE CUENTA
              </Text>

              <Text style={styles.uid}>
                {usuario.uid}
              </Text>

            </View>

          </View>

        </View>

        {/* INFORMACIÓN DEL SISTEMA */}

        <View style={styles.systemCard}>

          <View style={styles.systemIcon}>
            <MaterialIcons
              name="security"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View style={styles.systemInfo}>

            <Text style={styles.systemTitle}>
              Acceso administrativo
            </Text>

            <Text style={styles.systemDescription}>
              Tu cuenta tiene asignado el rol de administrador
              dentro del sistema SMARTGO.
            </Text>

          </View>

        </View>

        {/* CERRAR SESIÓN */}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={cerrarSesion}
          activeOpacity={0.85}
        >

          <MaterialIcons
            name="logout"
            size={23}
            color="#FFFFFF"
          />

          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>

          <MaterialIcons
            name="arrow-forward"
            size={21}
            color="#FFFFFF"
          />

        </TouchableOpacity>

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
            PANEL DE ADMINISTRACIÓN
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

  screen: {
    flex: 1
  },

  container: {
    padding: 20,
    paddingTop: 45,
    paddingBottom: 35
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 17, 39, 0.78)'
  },

  // CARGANDO

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(3, 17, 39, 0.82)'
  },

  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 25
  },

  // ENCABEZADO

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30
  },

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  logo: {
    width: 55,
    height: 55,
    borderRadius: 12,
    marginRight: 12
  },

  brand: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 1.5
  },

  brandSubtitle: {
    color: '#55B8FF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.5,
    marginTop: 3
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#1264A8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#51B5F5'
  },

  // TÍTULO

  titleContainer: {
    marginBottom: 22
  },

  welcome: {
    color: '#55B8FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 7
  },

  title: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900'
  },

  subtitle: {
    color: '#C1D4E9',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 19
  },

  // PERFIL

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    marginBottom: 17,
    elevation: 7
  },

  profileTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  avatarContainer: {
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: '#145B9A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D7ECFF'
  },

  profileInfo: {
    flex: 1,
    marginLeft: 15
  },

  profileName: {
    fontSize: 20,
    color: '#102D4D',
    fontWeight: '900'
  },

  profileDescription: {
    fontSize: 11,
    color: '#718096',
    marginTop: 5
  },

  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E5F8ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10
  },

  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#21B66F',
    marginRight: 6
  },

  activeText: {
    fontSize: 10,
    color: '#16834D',
    fontWeight: '800'
  },

  profileDivider: {
    height: 1,
    backgroundColor: '#E7EDF4',
    marginVertical: 22
  },

  sectionTitle: {
    fontSize: 11,
    color: '#1766A8',
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8
  },

  // DATOS

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17
  },

  infoIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#EAF4FC',
    justifyContent: 'center',
    alignItems: 'center'
  },

  infoContent: {
    flex: 1,
    marginLeft: 13
  },

  label: {
    color: '#8A9AAF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 7
  },

  value: {
    color: '#193653',
    fontSize: 13,
    fontWeight: '700'
  },

  uid: {
    color: '#53677E',
    fontSize: 10
  },

  divider: {
    height: 1,
    backgroundColor: '#E9EEF4'
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EAF4FC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 6
  },

  roleText: {
    color: '#1766A8',
    fontSize: 11,
    fontWeight: '900'
  },

  // SISTEMA

  systemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D3159',
    borderRadius: 17,
    padding: 17,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#28649A'
  },

  systemIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: '#1766A8',
    justifyContent: 'center',
    alignItems: 'center'
  },

  systemInfo: {
    flex: 1,
    marginLeft: 13
  },

  systemTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },

  systemDescription: {
    color: '#B8D1E9',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5
  },

  // CERRAR SESIÓN

  logoutButton: {
    backgroundColor: '#C92532',
    borderRadius: 15,
    paddingVertical: 17,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F15B65'
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    flex: 1,
    marginLeft: 12
  },

  // PIE DE PÁGINA

  footer: {
    alignItems: 'center',
    padding: 17,
    backgroundColor: 'rgba(9, 34, 65, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#28517A'
  },

  footerLogo: {
    width: 43,
    height: 43,
    borderRadius: 10,
    marginBottom: 8
  },

  footerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2
  },

  footerSubtitle: {
    color: '#7DBCEB',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 5
  },

  footerLines: {
    flexDirection: 'row',
    width: 75,
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
    backgroundColor: '#087BCE'
  }

});
