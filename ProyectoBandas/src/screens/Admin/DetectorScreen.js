
import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  ImageBackground
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../firebase/FirebaseConfig';

import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc
} from 'firebase/firestore';

// IMÁGENES
import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

// FIREBASE
const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const db = getFirestore(app);

export default function DetectorScreen() {

  const [llamaDetectada, setLlamaDetectada] = useState(false);
  const [maquinaEncendida, setMaquinaEncendida] = useState(true);
  const [ignorada, setIgnorada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [apagando, setApagando] = useState(false);

  // ESCUCHAR CAMBIOS DE FIREBASE
  useEffect(() => {

    const referencia = doc(db, 'maquina', 'seguridad');

    const unsubscribe = onSnapshot(
      referencia,
      (documento) => {

        if (documento.exists()) {

          const datos = documento.data();

          setLlamaDetectada(datos.llamaDetectada === true);
          setMaquinaEncendida(datos.maquinaEncendida !== false);

          if (datos.llamaDetectada === false) {
            setIgnorada(false);
          }

        } else {
          setLlamaDetectada(false);
          setMaquinaEncendida(true);
        }

        setCargando(false);
      },
      (error) => {
        console.log('Error al recibir datos:', error);
        setCargando(false);

        Alert.alert(
          'Error de conexión',
          'No se pudieron recibir los datos de seguridad.'
        );
      }
    );

    return () => unsubscribe();

  }, []);

  // RECONOCER ALERTA
  const ignorarAlerta = () => {
    setIgnorada(true);
  };

  // APAGAR MÁQUINA
  const apagarMaquina = () => {

    Alert.alert(
      'Apagar máquina',
      '¿Deseas enviar la orden para apagar la máquina?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Apagar',
          style: 'destructive',

          onPress: async () => {

            try {

              setApagando(true);

              const referencia = doc(db, 'maquina', 'seguridad');

              await updateDoc(referencia, {
                apagadoSolicitado: true
              });

              Alert.alert(
                'Orden enviada',
                'Se envió la solicitud de apagado al sistema.'
              );

            } catch (error) {

              console.log(error);

              Alert.alert(
                'Error',
                'No se pudo enviar la orden de apagado.'
              );

            } finally {
              setApagando(false);
            }
          }
        }
      ]
    );
  };

  const peligro = llamaDetectada;
  const colorEstado = peligro ? '#EF4444' : '#22C55E';

  // PANTALLA DE CARGA
  if (cargando) {

    return (
      <ImageBackground
        source={FondoAzul}
        style={styles.background}
        resizeMode="cover"
      >

        <View style={styles.backgroundOverlay} />

        <SafeAreaView style={styles.loadingContainer}>
          <StatusBar
            backgroundColor="#06152D"
            barStyle="light-content"
          />

          <View style={styles.loadingLogo}>
            <Image
              source={MiLogo}
              style={styles.loadingLogoImage}
              resizeMode="contain"
            />
          </View>

          <ActivityIndicator
            size="large"
            color="#168BFF"
          />

          <Text style={styles.loadingText}>
            Conectando con SMARTGO...
          </Text>

        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (

    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >

      <View style={styles.backgroundOverlay} />

      <SafeAreaView style={styles.container}>

        <StatusBar
          backgroundColor="#06152D"
          barStyle="light-content"
        />

        {/* ENCABEZADO */}

        <View style={styles.header}>

          <View style={styles.headerTop}>

            <View style={styles.logoContainer}>
              <Image
                source={MiLogo}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.headerBrand}>

              <Text style={styles.brandTitle}>
                SMART<Text style={styles.brandBlue}>GO</Text>
              </Text>

             

            </View>

            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />

              <Text style={styles.onlineText}>
                MONITOREO
              </Text>
            </View>

          </View>

          <View style={styles.headerDivider} />

          <Text style={styles.headerTitle}>
            Sistema de seguridad
          </Text>

          <Text style={styles.headerDescription}>
            Supervisión y detección de incendios de la máquina.
          </Text>

        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* TÍTULO */}

          <View style={styles.sectionHeading}>

            <View>
              <Text style={styles.sectionTitle}>
                Detector de llama
              </Text>

              <Text style={styles.sectionSubtitle}>
                Estado actual del sensor
              </Text>
            </View>

            <View style={styles.shieldIcon}>
              <MaterialIcons
                name="verified-user"
                size={25}
                color="#168BFF"
              />
            </View>

          </View>

          {/* TARJETA PRINCIPAL */}

          <View
            style={[
              styles.statusCard,
              peligro ? styles.dangerCard : styles.normalCard
            ]}
          >

            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: peligro
                    ? '#451D2B'
                    : '#123E3A'
                }
              ]}
            >

              <MaterialIcons
                name={
                  peligro
                    ? 'local-fire-department'
                    : 'shield'
                }
                size={75}
                color={colorEstado}
              />

            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: peligro
                    ? '#451D2B'
                    : '#123E3A'
                }
              ]}
            >

              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: colorEstado }
                ]}
              />

              <Text
                style={[
                  styles.statusBadgeText,
                  { color: colorEstado }
                ]}
              >
                {peligro
                  ? (ignorada
                    ? 'ALERTA RECONOCIDA'
                    : 'ALERTA ACTIVA')
                  : 'SISTEMA NORMAL'}
              </Text>

            </View>

            <Text
              style={[
                styles.statusTitle,
                { color: colorEstado }
              ]}
            >
              {peligro
                ? '¡Llama detectada!'
                : 'Todo está bajo control'}
            </Text>

            <Text style={styles.statusDescription}>
              {peligro
                ? 'El sensor ha detectado una posible llama. Revisa la situación de la máquina.'
                : 'No se detectan llamas. El sistema de seguridad está funcionando normalmente.'}
            </Text>

            {peligro && (

              <View style={styles.warningMessage}>

                <MaterialIcons
                  name="warning"
                  size={20}
                  color="#FBBF24"
                />

                <Text style={styles.warningText}>
                  {ignorada
                    ? 'La alerta fue reconocida, pero la detección continúa activa.'
                    : 'Se requiere atención inmediata.'}
                </Text>

              </View>

            )}

          </View>

          {/* INFORMACIÓN DEL SENSOR */}

          <Text style={styles.sectionTitleSmall}>
            Información del sistema
          </Text>

          <View style={styles.sensorCard}>

            <View style={styles.sensorIcon}>
              <MaterialIcons
                name="sensors"
                size={30}
                color="#168BFF"
              />
            </View>

            <View style={styles.sensorInfo}>

              <Text style={styles.sensorTitle}>
                Sensor detector de llama
              </Text>

              <Text style={styles.sensorSubtitle}>
                Lectura en tiempo real
              </Text>

            </View>

            <View
              style={[
                styles.sensorIndicator,
                {
                  backgroundColor: peligro
                    ? '#EF4444'
                    : '#22C55E'
                }
              ]}
            />

          </View>

          {/* ESTADO DE LA MÁQUINA */}

          <View style={styles.machineCard}>

            <View style={styles.machineIcon}>
              <MaterialIcons
                name="precision-manufacturing"
                size={29}
                color="#168BFF"
              />
            </View>

            <View style={styles.machineInfo}>

              <Text style={styles.machineTitle}>
                Estado de la máquina
              </Text>

              <Text
                style={[
                  styles.machineStatus,
                  {
                    color: maquinaEncendida
                      ? '#22C55E'
                      : '#EF4444'
                  }
                ]}
              >
                {maquinaEncendida
                  ? 'ENCENDIDA'
                  : 'APAGADA'}
              </Text>

            </View>

            <MaterialIcons
              name={
                maquinaEncendida
                  ? 'power'
                  : 'power-off'
              }
              size={27}
              color={
                maquinaEncendida
                  ? '#22C55E'
                  : '#EF4444'
              }
            />

          </View>

          {/* ACCIONES */}

          <Text style={styles.sectionTitleSmall}>
            Acciones de seguridad
          </Text>

          <View style={styles.buttons}>

            {peligro && !ignorada && (

              <TouchableOpacity
                style={styles.ignoreButton}
                onPress={ignorarAlerta}
                activeOpacity={0.8}
              >

                <MaterialIcons
                  name="notifications-off"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.ignoreText}>
                  Reconocer alerta
                </Text>

              </TouchableOpacity>

            )}

            <TouchableOpacity
              style={[
                styles.shutdownButton,
                (!maquinaEncendida || apagando) &&
                  styles.disabledButton
              ]}
              onPress={apagarMaquina}
              disabled={!maquinaEncendida || apagando}
              activeOpacity={0.8}
            >

              {apagando ? (

                <ActivityIndicator color="#FFFFFF" />

              ) : (

                <MaterialIcons
                  name="power-settings-new"
                  size={23}
                  color="#FFFFFF"
                />

              )}

              <Text style={styles.shutdownText}>
                {apagando
                  ? 'Enviando solicitud...'
                  : maquinaEncendida
                    ? 'Apagar máquina'
                    : 'Máquina apagada'}
              </Text>

            </TouchableOpacity>

          </View>

          {/* NOTA INFORMATIVA */}

          <View style={styles.infoCard}>

            <MaterialIcons
              name="info-outline"
              size={22}
              color="#168BFF"
            />

            <Text style={styles.infoText}>
              Los datos se actualizan automáticamente mediante Firebase.
              Reconocer una alerta no elimina la detección ni apaga la máquina.
            </Text>

          </View>

        </ScrollView>

        {/* PIE DE PÁGINA */}

        <View style={styles.footer}>

          <Text style={styles.footerTitle}>
            SMARTGO
          </Text>

          <Text style={styles.footerSubtitle}>
            SISTEMA INTELIGENTE DE MONITOREO
          </Text>

        </View>

      </SafeAreaView>

    </ImageBackground>

  );
}

// ESTILOS

const styles = StyleSheet.create({

  background: {
    flex: 1,
    width: '100%',
    height: '100%'
  },

  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 18, 42, 0.48)'
  },

  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },

  // CARGA

  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center'
  },

  loadingLogo: {
    width: 105,
    height: 105,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    elevation: 8
  },

  loadingLogoImage: {
    width: 90,
    height: 90,
    borderRadius: 20
  },

  loadingText: {
    color: '#FFFFFF',
    fontSize: 13,
    marginTop: 18,
    fontWeight: '700'
  },

  // ENCABEZADO

  header: {
    backgroundColor: 'rgba(11, 33, 66, 0.94)',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    borderBottomWidth: 2,
    borderBottomColor: '#087BCE'
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 4
  },

  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12
  },

  headerBrand: {
    marginLeft: 12,
    flex: 1
  },

  brandTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1
  },

  brandBlue: {
    color: '#168BFF'
  },

  brandSubtitle: {
    color: '#A9C5E8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2
  },

  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#123E3A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    marginRight: 6
  },

  onlineText: {
    color: '#86EFAC',
    fontSize: 9,
    fontWeight: '900'
  },

  headerDivider: {
    height: 1,
    backgroundColor: '#21446C',
    marginVertical: 17
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900'
  },

  headerDescription: {
    color: '#A9C5E8',
    fontSize: 12,
    marginTop: 6
  },

  // CONTENIDO

  content: {
    flex: 1
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 30
  },

  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900'
  },

  sectionSubtitle: {
    color: '#D0DDF0',
    fontSize: 12,
    marginTop: 5
  },

  shieldIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#102D55',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B4D80'
  },

  // ESTADO PRINCIPAL

  statusCard: {
    backgroundColor: 'rgba(11, 33, 66, 0.96)',
    borderRadius: 23,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    elevation: 5
  },

  normalCard: {
    borderColor: '#219653',
    borderTopWidth: 5,
    borderTopColor: '#219653'
  },

  dangerCard: {
    borderColor: '#D9272E',
    borderTopWidth: 5,
    borderTopColor: '#D9272E'
  },

  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#31516F'
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    marginBottom: 15
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginRight: 7
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },

  statusTitle: {
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center'
  },

  statusDescription: {
    fontSize: 13,
    color: '#D0DDF0',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 12
  },

  warningMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B2C1B',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
    width: '100%'
  },

  warningText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginLeft: 9,
    lineHeight: 17
  },

  // TÍTULOS SECUNDARIOS

  sectionTitleSmall: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 25,
    marginBottom: 13
  },

  // SENSOR

  sensorCard: {
    backgroundColor: 'rgba(11, 33, 66, 0.96)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#174477'
  },

  sensorIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#102D55',
    justifyContent: 'center',
    alignItems: 'center'
  },

  sensorInfo: {
    flex: 1,
    marginLeft: 13
  },

  sensorTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },

  sensorSubtitle: {
    color: '#B9CCE4',
    fontSize: 11,
    marginTop: 5
  },

  sensorIndicator: {
    width: 11,
    height: 11,
    borderRadius: 10
  },

  // MÁQUINA

  machineCard: {
    backgroundColor: 'rgba(11, 33, 66, 0.96)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#174477'
  },

  machineIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#102D55',
    justifyContent: 'center',
    alignItems: 'center'
  },

  machineInfo: {
    flex: 1,
    marginLeft: 13
  },

  machineTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },

  machineStatus: {
    fontSize: 11,
    fontWeight: '900',
    marginTop: 5,
    letterSpacing: 1
  },

  // BOTONES

  buttons: {
    gap: 12
  },

  ignoreButton: {
    backgroundColor: '#102D55',
    borderWidth: 1,
    borderColor: '#276092',
    padding: 16,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  ignoreText: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginLeft: 9,
    fontSize: 13
  },

  shutdownButton: {
    backgroundColor: '#C51F2B',
    padding: 17,
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F04450',
    elevation: 4
  },

  disabledButton: {
    backgroundColor: '#475569',
    borderColor: '#64748B'
  },

  shutdownText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: 9,
    fontSize: 13
  },

  // INFORMACIÓN

  infoCard: {
    backgroundColor: 'rgba(16, 45, 85, 0.96)',
    borderRadius: 13,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#1B4D80'
  },

  infoText: {
    color: '#D0DDF0',
    fontSize: 11,
    lineHeight: 18,
    flex: 1,
    marginLeft: 10
  },

  // PIE DE PÁGINA

  footer: {
    backgroundColor: 'rgba(11, 33, 66, 0.97)',
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#174477'
  },

  footerTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 13
  },

  footerSubtitle: {
    color: '#A9C5E8',
    fontSize: 9,
    marginTop: 5,
    letterSpacing: 1
  }

});
