
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


const styles = StyleSheet.create({

  // PANTALLA PRINCIPAL

  screen: {
    flex: 1,
    backgroundColor: '#06152D'
  },

  container: {
    padding: 18,
    paddingBottom: 35
  },

  // CARGA

  loadingContainer: {
    flex: 1,
    backgroundColor: '#06152D',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },

  loadingText: {
    fontSize: 14,
    color: '#A9C5E8'
  },

  // ENCABEZADO

  header: {
    backgroundColor: '#0B2142',
    borderRadius: 17,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#174477',
    borderTopWidth: 3,
    borderTopColor: '#087BCE',
    elevation: 5
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  brand: {
    fontSize: 10,
    color: '#36A9FF',
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8
  },

  headerTitle: {
    fontSize: 21,
    color: '#FFFFFF',
    fontWeight: '900'
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0756A5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#168BDB'
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#24466D',
    marginVertical: 20
  },

  // INFORMACIÓN DEL ADMINISTRADOR

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  avatar: {
    width: 68,
    height: 68,
    borderRadius: 15,
    backgroundColor: '#0756A5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#168BDB'
  },

  profileHeaderInfo: {
    marginLeft: 15,
    flex: 1
  },

  profileTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '900'
  },

  profileSubtitle: {
    fontSize: 11,
    color: '#A9C5E8',
    marginTop: 6
  },

  // TARJETAS

  card: {
    backgroundColor: '#0B2142',
    borderRadius: 15,
    padding: 20,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#174477',
    elevation: 4
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8
  },

  cardTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '900'
  },

  // ESTADO DE CUENTA

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123E3A',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#219653'
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#36D47A',
    marginRight: 7
  },

  statusText: {
    fontSize: 10,
    color: '#66E09A',
    fontWeight: '900'
  },

  // INFORMACIÓN DE LA CUENTA

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 17
  },

  infoIcon: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#102D55',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B4D80'
  },

  infoContent: {
    flex: 1,
    marginLeft: 13
  },

  label: {
    fontSize: 10,
    color: '#7FAAD0',
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8
  },

  value: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600'
  },

  uid: {
    fontSize: 10,
    color: '#A9C5E8'
  },

  divider: {
    height: 1,
    backgroundColor: '#1B385D'
  },

  // ROL ADMINISTRADOR

  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 7,
    backgroundColor: '#102F57',
    borderWidth: 1,
    borderColor: '#087BCE'
  },

  roleText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#36A9FF'
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
    color: '#A9BBD2',
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
    backgroundColor: '#102D55',
    justifyContent: 'center',
    alignItems: 'center'
  },

  adminInfo: {
    flex: 1,
    marginLeft: 13
  },

  adminTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },

  adminDescription: {
    fontSize: 11,
    color: '#A9BBD2',
    marginTop: 5
  },

  // MARCAS

  brandDescription: {
    fontSize: 12,
    color: '#A9BBD2',
    marginTop: 6,
    marginBottom: 17
  },

  brandsContainer: {
    flexDirection: 'row',
    gap: 12
  },

  cocaCard: {
    flex: 1,
    backgroundColor: '#351C30',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A92838'
  },

  cocaText: {
    fontSize: 15,
    color: '#FF3545',
    fontWeight: '900'
  },

  pepsiCard: {
    flex: 1,
    backgroundColor: '#102D55',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#087BCE'
  },

  pepsiText: {
    fontSize: 16,
    color: '#36A9FF',
    fontWeight: '900'
  },

  // CERRAR SESIÓN

  logoutButton: {
    backgroundColor: '#C51F2B',
    borderRadius: 13,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#F04450',
    elevation: 4
  },

  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900'
  },

  // PIE DE PÁGINA

  footer: {
    alignItems: 'center',
    marginTop: 8,
    padding: 15,
    backgroundColor: '#0B2142',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#174477'
  },

  footerText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.5
  },

  footerSubtext: {
    fontSize: 10,
    color: '#8FAAC9',
    marginTop: 6
  },

  footerLines: {
    flexDirection: 'row',
    width: 70,
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
