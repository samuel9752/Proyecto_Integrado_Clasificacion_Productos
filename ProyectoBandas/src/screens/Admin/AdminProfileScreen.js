
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
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

            const referencia = doc(
              db,
              'usuarios',
              user.uid
            );

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

  // CARGANDO PERFIL

  if (cargando) {

    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="large"
          color="#E5252A"
        />

        <Text style={styles.loadingText}>
          Cargando información...
        </Text>

      </View>
    );

  }

  // USUARIO NO AUTENTICADO

  if (!usuario) {

    return (
      <View style={styles.loadingContainer}>

        <MaterialIcons
          name="person-off"
          size={55}
          color="#E5252A"
        />

        <Text style={styles.loadingText}>
          No hay ningún usuario iniciado sesión.
        </Text>

      </View>
    );

  }

  // VALIDAR ROL

  const esAdmin =
    usuario.tipoUsuario.toLowerCase() === 'administrador';

  if (!esAdmin) {

    return (
      <View style={styles.loadingContainer}>

        <MaterialIcons
          name="lock"
          size={55}
          color="#E5252A"
        />

        <Text style={styles.loadingText}>
          No tienes permisos de administrador.
        </Text>

      </View>
    );

  }

  return (

    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >

      {/* ENCABEZADO */}

      <View style={styles.header}>

        <View style={styles.headerTop}>

          <View>

            <Text style={styles.brand}>
              SMART VENDING SYSTEM
            </Text>

            <Text style={styles.headerTitle}>
              Perfil de administrador
            </Text>

          </View>

          <View style={styles.headerIcon}>

            <MaterialIcons
              name="admin-panel-settings"
              size={29}
              color="#FFFFFF"
            />

          </View>

        </View>

        <View style={styles.headerDivider} />

        <View style={styles.profileHeader}>

          <View style={styles.avatar}>

            <MaterialIcons
              name="admin-panel-settings"
              size={43}
              color="#FFFFFF"
            />

          </View>

          <View style={styles.profileHeaderInfo}>

            <Text style={styles.profileTitle}>
              Administrador
            </Text>

            <Text style={styles.profileSubtitle}>
              Gestiona y supervisa el sistema
            </Text>

          </View>

        </View>

      </View>

      {/* INFORMACIÓN DE LA CUENTA */}

      <View style={styles.card}>

        <View style={styles.cardHeader}>

          <Text style={styles.cardTitle}>
            Datos de la cuenta
          </Text>

          <View style={styles.statusBadge}>

            <View style={styles.statusDot} />

            <Text style={styles.statusText}>
              Cuenta activa
            </Text>

          </View>

        </View>

        {/* CORREO */}

        <View style={styles.infoRow}>

          <View style={styles.infoIcon}>

            <MaterialIcons
              name="email"
              size={23}
              color="#596579"
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
              size={23}
              color="#596579"
            />

          </View>

          <View style={styles.infoContent}>

            <Text style={styles.label}>
              ROL ASIGNADO
            </Text>

            <View style={styles.roleBadge}>

              <Text style={styles.roleText}>
                Administrador
              </Text>

            </View>

          </View>

        </View>

        <View style={styles.divider} />

        {/* IDENTIFICADOR */}

        <View style={styles.infoRow}>

          <View style={styles.infoIcon}>

            <MaterialIcons
              name="fingerprint"
              size={23}
              color="#596579"
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

      

      {/* CERRAR SESIÓN */}

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={cerrarSesion}
        activeOpacity={0.8}
      >

        <MaterialIcons
          name="logout"
          size={22}
          color="#FFFFFF"
        />

        <Text style={styles.logoutText}>
          Cerrar sesión
        </Text>

      </TouchableOpacity>

      {/* PIE DE PÁGINA */}

      <View style={styles.footer}>

        <Text style={styles.footerText}>
          SMART VENDING SYSTEM
        </Text>

        <Text style={styles.footerSubtext}>
          Panel de administración
        </Text>

        <View style={styles.footerLines}>

          <View style={styles.redLine} />

          <View style={styles.blueLine} />

        </View>

      </View>

    </ScrollView>

  );

}

// ESTILOS

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: '#EEF0F3'
  },

  container: {
    padding: 18,
    paddingBottom: 35
  },

  // CARGA

  loadingContainer: {
    flex: 1,
    backgroundColor: '#EEF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },

  loadingText: {
    fontSize: 14,
    color: '#596579'
  },

  // ENCABEZADO

  header: {
    backgroundColor: '#171B24',
    borderRadius: 16,
    padding: 22,
    marginBottom: 20,
    elevation: 4
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  brand: {
    fontSize: 11,
    color: '#AEB7C4',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 7
  },

  headerTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#292D33',
    justifyContent: 'center',
    alignItems: 'center'
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#424956',
    marginVertical: 20
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  avatar: {
    width: 65,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#0756A5',
    justifyContent: 'center',
    alignItems: 'center'
  },

  profileHeaderInfo: {
    marginLeft: 15,
    flex: 1
  },

  profileTitle: {
    fontSize: 19,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  profileSubtitle: {
    fontSize: 12,
    color: '#C1C8D2',
    marginTop: 5
  },

  // TARJETAS

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    padding: 20,
    marginBottom: 17,
    elevation: 2
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8
  },

  cardTitle: {
    fontSize: 16,
    color: '#252B35',
    fontWeight: 'bold'
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#299D58',
    marginRight: 6
  },

  statusText: {
    fontSize: 10,
    color: '#26834B',
    fontWeight: 'bold'
  },

  // INFORMACIÓN

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16
  },

  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 10,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center'
  },

  infoContent: {
    flex: 1,
    marginLeft: 13
  },

  label: {
    fontSize: 10,
    color: '#7B8491',
    fontWeight: 'bold',
    letterSpacing: 0.6,
    marginBottom: 7
  },

  value: {
    fontSize: 14,
    color: '#252B35',
    fontWeight: '600'
  },

  uid: {
    fontSize: 10,
    color: '#596579'
  },

  divider: {
    height: 1,
    backgroundColor: '#E8EBEF'
  },

  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E9F0FA'
  },

  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0756A5'
  },

  // PANEL ADMINISTRATIVO

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8
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

  // MARCAS

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
  },

  // CERRAR SESIÓN

  logoutButton: {
    backgroundColor: '#C51F2B',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
    elevation: 2
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold'
  },

  // PIE DE PÁGINA

  footer: {
    alignItems: 'center',
    marginTop: 8
  },

  footerText: {
    fontSize: 11,
    color: '#596579',
    fontWeight: 'bold',
    letterSpacing: 1
  },

  footerSubtext: {
    fontSize: 10,
    color: '#9299A3',
    marginTop: 5
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
    backgroundColor: '#0756A5'
  }

});

