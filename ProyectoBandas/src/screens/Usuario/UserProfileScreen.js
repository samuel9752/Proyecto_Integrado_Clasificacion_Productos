
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator
} from 'react-native';

import {
  getAuth,
  onAuthStateChanged
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

export default function UserProfileScreen() {

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

  // Cargando perfil
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

  // Usuario no autenticado
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

  const esAdmin =
    usuario.tipoUsuario.toLowerCase() === 'administrador';

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
              Perfil de usuario
            </Text>

          </View>

          <View style={styles.headerIcon}>

            <MaterialIcons
              name="dashboard"
              size={27}
              color="#FFFFFF"
            />

          </View>

        </View>

        <View style={styles.headerDivider} />

        <View style={styles.profileHeader}>

          <View style={styles.avatar}>

            <MaterialIcons
              name="person"
              size={43}
              color="#FFFFFF"
            />

          </View>

          <View style={styles.profileHeaderInfo}>

            <Text style={styles.profileTitle}>
              Mi cuenta
            </Text>

            <Text style={styles.profileSubtitle}>
              Gestiona tu información personal
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

            <View style={[
              styles.roleBadge,
              {
                backgroundColor: esAdmin
                  ? '#FCEBEC'
                  : '#E9F0FA'
              }
            ]}>

              <Text style={[
                styles.roleText,
                {
                  color: esAdmin
                    ? '#C51F2B'
                    : '#0756A5'
                }
              ]}>

                {esAdmin
                  ? 'Administrador'
                  : usuario.tipoUsuario === 'usuario'
                    ? 'Usuario'
                    : usuario.tipoUsuario
                }

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

      {/* SISTEMA DE BEBIDAS */}

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          Sistema de bebidas
        </Text>

        <Text style={styles.brandDescription}>
          Marcas disponibles en nuestra máquina
        </Text>

        <View style={styles.brandsContainer}>

          <View style={styles.cocaCard}>

            <Text style={styles.cocaText}>
              Coca-Cola
            </Text>

          </View>

          <View style={styles.pepsiCard}>

            <Text style={styles.pepsiText}>
              PEPSI
            </Text>

          </View>

        </View>

      </View>

      {/* PIE DE PÁGINA */}

      <View style={styles.footer}>

        <Text style={styles.footerText}>
          SMART VENDING SYSTEM
        </Text>

        <Text style={styles.footerSubtext}>
          Clasificación inteligente de bebidas
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
    fontSize: 23,
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
    backgroundColor: '#E5252A',
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
    borderRadius: 6
  },

  roleText: {
    fontSize: 12,
    fontWeight: 'bold'
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
