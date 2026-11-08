import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '../../firebase/FirebaseConfig';

import {
  getFirestore,
  doc,
  onSnapshot,
  updateDoc,
  setDoc
} from 'firebase/firestore';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const db = getFirestore(app);

export default function DetectorScreen() {

  const [llamaDetectada, setLlamaDetectada] = useState(false);
  const [maquinaEncendida, setMaquinaEncendida] = useState(true);
  const [ignorada, setIgnorada] = useState(false);
  const [cargando, setCargando] = useState(true);

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
      }
    );

    return () => unsubscribe();

  }, []);

  const ignorarAlerta = () => {
    setIgnorada(true);
  };

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
            }
          }
        }
      ]
    );
  };

  const alertaActiva = llamaDetectada && !ignorada;

  return (

    <SafeAreaView style={styles.container}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#171B24"
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          SMART VENDING SYSTEM
        </Text>

        <Text style={styles.headerSubtitle}>
          Seguridad y monitoreo
        </Text>
      </View>

      <View style={styles.content}>

        <Text style={styles.title}>
          Detector de seguridad
        </Text>

        <Text style={styles.subtitle}>
          Monitoreo del sensor de llama
        </Text>

        {cargando ? (

          <ActivityIndicator
            size="large"
            color="#D9272E"
            style={{ marginTop: 60 }}
          />

        ) : (

          <>

            <View style={[
              styles.statusCard,
              alertaActiva ? styles.dangerCard : styles.normalCard
            ]}>

              <View style={[
                styles.iconCircle,
                alertaActiva
                  ? styles.dangerCircle
                  : styles.normalCircle
              ]}>

                <MaterialIcons
                  name={alertaActiva ? 'local-fire-department' : 'verified-user'}
                  size={65}
                  color={alertaActiva ? '#D9272E' : '#219653'}
                />

              </View>

              <Text style={[
                styles.statusTitle,
                { color: alertaActiva ? '#D9272E' : '#219653' }
              ]}>
                {alertaActiva
                  ? '¡ALERTA DE LLAMA!'
                  : maquinaEncendida
                    ? 'Sistema seguro'
                    : 'Máquina apagada'}
              </Text>

              <Text style={styles.description}>
                {alertaActiva
                  ? 'El sensor ha detectado una llama. Se recomienda detener la máquina y revisar la situación.'
                  : maquinaEncendida
                    ? 'No se detecta presencia de llama. El sistema se encuentra en monitoreo.'
                    : 'La máquina figura como apagada.'}
              </Text>

              <View style={styles.indicator}>
                <View style={[
                  styles.dot,
                  { backgroundColor: alertaActiva ? '#D9272E' : '#219653' }
                ]} />

                <Text style={styles.indicatorText}>
                  {alertaActiva ? 'ALERTA ACTIVA' : 'MONITOREO ACTIVO'}
                </Text>
              </View>

            </View>

            <View style={styles.sensorCard}>

              <MaterialIcons
                name="sensors"
                size={35}
                color="#D9272E"
              />

              <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.sensorTitle}>
                  Sensor de llama
                </Text>

                <Text style={[
                  styles.sensorStatus,
                  { color: llamaDetectada ? '#D9272E' : '#219653' }
                ]}>
                  {llamaDetectada ? 'DETECCIÓN ACTIVA' : 'SIN DETECCIÓN'}
                </Text>
              </View>

            </View>

            {alertaActiva && (

              <View style={styles.buttons}>

                <TouchableOpacity
                  style={styles.ignoreButton}
                  onPress={ignorarAlerta}
                >
                  <MaterialIcons
                    name="notifications-off"
                    size={22}
                    color="#333"
                  />

                  <Text style={styles.ignoreText}>
                    Ignorar alerta
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shutdownButton}
                  onPress={apagarMaquina}
                >
                  <MaterialIcons
                    name="power-settings-new"
                    size={23}
                    color="#fff"
                  />

                  <Text style={styles.shutdownText}>
                    Apagar máquina
                  </Text>
                </TouchableOpacity>

              </View>

            )}

          </>

        )}

      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          SMART VENDING SYSTEM
        </Text>
        <Text style={styles.footerSubtitle}>
          Sistema inteligente de seguridad
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F3F5F8'
  },

  header: {
    backgroundColor: '#171B24',
    padding: 24
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 1
  },

  headerSubtitle: {
    color: '#B8BEC9',
    marginTop: 5,
    fontSize: 13
  },

  content: {
    flex: 1,
    padding: 20
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#171B24',
    marginTop: 15
  },

  subtitle: {
    fontSize: 14,
    color: '#777F8C',
    marginTop: 6,
    marginBottom: 25
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    elevation: 3
  },

  normalCard: {
    borderTopWidth: 5,
    borderTopColor: '#219653'
  },

  dangerCard: {
    borderTopWidth: 5,
    borderTopColor: '#D9272E'
  },

  iconCircle: {
    width: 115,
    height: 115,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },

  normalCircle: {
    backgroundColor: '#E5F7EC'
  },

  dangerCircle: {
    backgroundColor: '#FDE8E8'
  },

  statusTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  description: {
    fontSize: 14,
    color: '#777F8C',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12
  },

  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F5F8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 22
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 10,
    marginRight: 8
  },

  indicatorText: {
    color: '#555D69',
    fontSize: 11,
    fontWeight: 'bold'
  },

  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    elevation: 2
  },

  sensorTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#171B24'
  },

  sensorStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5
  },

  buttons: {
    marginTop: 20,
    gap: 12
  },

  ignoreButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9DDE4',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  ignoreText: {
    color: '#333333',
    fontWeight: 'bold',
    marginLeft: 9
  },

  shutdownButton: {
    backgroundColor: '#D9272E',
    padding: 17,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  shutdownText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 9
  },

  footer: {
    padding: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E1E4E9'
  },

  footerText: {
    color: '#171B24',
    fontWeight: 'bold',
    letterSpacing: 2,
    fontSize: 12
  },

  footerSubtitle: {
    color: '#9299A5',
    fontSize: 11,
    marginTop: 5
  }

});