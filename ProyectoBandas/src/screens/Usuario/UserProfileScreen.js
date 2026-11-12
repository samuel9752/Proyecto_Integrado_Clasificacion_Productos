
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  ImageBackground,
  SafeAreaView,
} from 'react-native';

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  initializeApp,
  getApps,
} from 'firebase/app';

import { firebaseConfig } from '../../firebase/FirebaseConfig';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

export default function UserProfileScreen({ navigation }) {

  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

  const auth = getAuth(app);
  const db = getFirestore(app);

  // CERRAR SESIÓN
  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar tu sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
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
          },
        },
      ]
    );
  };

  // DETECTAR USUARIO AUTENTICADO
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
              tipoUsuario: datos.tipoUsuario || 'No definido',
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

  // CARGANDO PERFIL
  if (cargando) {
    return (
      <ImageBackground
        source={FondoAzul}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />

            <Text style={styles.loadingText}>
              Cargando información...
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // USUARIO NO AUTENTICADO
  if (!usuario) {
    return (
      <ImageBackground
        source={FondoAzul}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <View style={styles.errorIcon}>
              <MaterialIcons
                name="person-off"
                size={45}
                color="#C51F2B"
              />
            </View>

            <Text style={styles.loadingText}>
              No hay ningún usuario iniciado sesión.
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const esAdmin =
    usuario.tipoUsuario.toLowerCase() === 'administrador';

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
          <View style={styles.brandHeader}>
            <View style={styles.brandRow}>
              <Image
                source={MiLogo}
                style={styles.logo}
              />

              <View>
                <Text style={styles.brandName}>
                  SMARTGO
                </Text>

                <Text style={styles.brandCaption}>
                  VENDING SYSTEM
                </Text>
              </View>
            </View>

            <View style={styles.headerIcon}>
              <MaterialIcons
                name="person"
                size={28}
                color="#14569A"
              />
            </View>
          </View>

          {/* PRESENTACIÓN DEL PERFIL */}
          <View style={styles.profileWelcome}>
            <View style={styles.avatar}>
              <MaterialIcons
                name="person"
                size={43}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.profileTitle}>
              Mi perfil
            </Text>

            <Text style={styles.profileSubtitle}>
              Consulta la información de tu cuenta
            </Text>

            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                Cuenta activa
              </Text>
            </View>
          </View>

          {/* INFORMACIÓN DE LA CUENTA */}
          <View style={styles.card}>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <MaterialIcons
                  name="account-circle"
                  size={23}
                  color="#14569A"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Datos de la cuenta
                </Text>

                <Text style={styles.cardSubtitle}>
                  Tu información personal
                </Text>
              </View>
            </View>

            {/* CORREO */}
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialIcons
                  name="email"
                  size={22}
                  color="#C51F2B"
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
                  color="#14569A"
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.label}>
                  ROL ASIGNADO
                </Text>

                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor: esAdmin
                        ? '#FDEEEF'
                        : '#EAF2FC',
                    },
                  ]}
                >
                  <MaterialIcons
                    name={esAdmin ? 'admin-panel-settings' : 'person'}
                    size={16}
                    color={esAdmin ? '#C51F2B' : '#14569A'}
                  />

                  <Text
                    style={[
                      styles.roleText,
                      {
                        color: esAdmin ? '#C51F2B' : '#14569A',
                      },
                    ]}
                  >
                    {esAdmin
                      ? 'Administrador'
                      : usuario.tipoUsuario === 'usuario'
                        ? 'Usuario'
                        : usuario.tipoUsuario}
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
                  size={22}
                  color="#14569A"
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

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconRed}>
                <MaterialIcons
                  name="local-drink"
                  size={23}
                  color="#C51F2B"
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  Sistema de bebidas
                </Text>

                <Text style={styles.cardSubtitle}>
                  Marcas disponibles en SMARTGO
                </Text>
              </View>
            </View>

            <View style={styles.brandsContainer}>

              <View style={styles.cocaCard}>
                <MaterialIcons
                  name="local-drink"
                  size={27}
                  color="#C51F2B"
                />

                <Text style={styles.cocaText}>
                  Coca-Cola
                </Text>
              </View>

              <View style={styles.pepsiCard}>
                <MaterialIcons
                  name="local-drink"
                  size={27}
                  color="#14569A"
                />

                <Text style={styles.pepsiText}>
                  PEPSI
                </Text>
              </View>

            </View>

            <View style={styles.brandFooter}>
              <MaterialIcons
                name="check-circle"
                size={17}
                color="#26834B"
              />

              <Text style={styles.brandFooterText}>
                Clasificación inteligente de bebidas
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
              size={22}
              color="#FFFFFF"
            />

            <Text style={styles.logoutButtonText}>
              Cerrar sesión
            </Text>

            <MaterialIcons
              name="arrow-forward"
              size={19}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* PIE DE PÁGINA */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              SMARTGO
            </Text>

            <Text style={styles.footerSubtext}>
              Máquina expendedora inteligente
            </Text>

            <View style={styles.footerLines}>
              <View style={styles.redLine} />
              <View style={styles.blueLine} />
            </View>
          </View>

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
    paddingBottom: 55,
  },

  // CARGA
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    gap: 12,
  },

  loadingText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '600',
  },

  errorIcon: {
    width: 75,
    height: 75,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // MARCA
  brandHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  logo: {
    width: 49,
    height: 49,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  brandName: {
    fontSize: 19,
    color: '#172B4D',
    fontWeight: '900',
    letterSpacing: 2,
  },

  brandCaption: {
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 2,
    marginTop: 3,
  },

  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#EAF2FC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // PERFIL
  profileWelcome: {
    backgroundColor: '#FFFFFF',
    borderRadius: 19,
    padding: 22,
    alignItems: 'center',
    marginBottom: 17,
    elevation: 4,
  },

  avatar: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: '#14569A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  profileTitle: {
    fontSize: 24,
    color: '#172033',
    fontWeight: '900',
  },

  profileSubtitle: {
    fontSize: 11,
    color: '#7B8491',
    marginTop: 6,
    textAlign: 'center',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5EC',
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
    marginTop: 14,
    gap: 7,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#299D58',
  },

  statusText: {
    fontSize: 10,
    color: '#26834B',
    fontWeight: 'bold',
  },

  // TARJETAS
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
    marginBottom: 13,
  },

  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EAF2FC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionIconRed: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#FDEEEF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    fontSize: 15,
    color: '#172033',
    fontWeight: '900',
  },

  cardSubtitle: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },

  // INFORMACIÓN
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },

  infoIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#F5F8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 13,
  },

  label: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '800',
    letterSpacing: 0.7,
    marginBottom: 7,
  },

  value: {
    fontSize: 13,
    color: '#172033',
    fontWeight: '700',
  },

  uid: {
    fontSize: 10,
    color: '#596579',
    lineHeight: 16,
  },

  divider: {
    height: 1,
    backgroundColor: '#E8EBEF',
  },

  roleBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  roleText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // MARCAS
  brandsContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  cocaCard: {
    flex: 1,
    backgroundColor: '#FDEEEF',
    borderRadius: 14,
    paddingVertical: 19,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  cocaText: {
    fontSize: 14,
    color: '#C51F2B',
    fontWeight: '900',
  },

  pepsiCard: {
    flex: 1,
    backgroundColor: '#EAF2FC',
    borderRadius: 14,
    paddingVertical: 19,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },

  pepsiText: {
    fontSize: 15,
    color: '#14569A',
    fontWeight: '900',
  },

  brandFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 17,
  },

  brandFooterText: {
    color: '#64748B',
    fontSize: 10,
  },

  // CERRAR SESIÓN
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#C51F2B',
    padding: 16,
    borderRadius: 13,
    marginBottom: 20,
    gap: 10,
    elevation: 3,
  },

  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },

  // PIE
  footer: {
    alignItems: 'center',
    marginTop: 5,
  },

  footerText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  footerSubtext: {
    fontSize: 10,
    color: '#DCEAF8',
    marginTop: 5,
  },

  footerLines: {
    flexDirection: 'row',
    width: 65,
    height: 4,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 12,
  },

  redLine: {
    flex: 1,
    backgroundColor: '#E5252A',
  },

  blueLine: {
    flex: 1,
    backgroundColor: '#14569A',
  },

});
