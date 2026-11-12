
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
  ScrollView
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
}
const styles = StyleSheet.create({

  // PANTALLA PRINCIPAL

  container: {
    flex: 1,
    backgroundColor: '#06152D'
  },

  // ENCABEZADO

  header: {
    backgroundColor: '#0B2142',
    padding: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#087BCE'
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 1.5
  },

  headerSubtitle: {
    color: '#A9C5E8',
    marginTop: 6,
    fontSize: 12
  },

  // CONTENEDOR DESLIZABLE

  content: {
    flex: 1
  },

  contentContainer: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 30
  },

  // TÍTULOS

  title: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 15
  },

  subtitle: {
    fontSize: 13,
    color: '#A9BBD2',
    marginTop: 7,
    marginBottom: 25
  },

  // TARJETA PRINCIPAL DE ESTADO

  statusCard: {
    backgroundColor: '#0B2142',
    borderRadius: 18,
    padding: 25,
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

  // ICONO DE SEGURIDAD

  iconCircle: {
    width: 115,
    height: 115,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },

  normalCircle: {
    backgroundColor: '#123E3A',
    borderWidth: 1,
    borderColor: '#219653'
  },

  dangerCircle: {
    backgroundColor: '#451D2B',
    borderWidth: 1,
    borderColor: '#D9272E'
  },

  // ESTADO DEL SISTEMA

  statusTitle: {
    fontSize: 23,
    fontWeight: '900',
    textAlign: 'center'
  },

  description: {
    fontSize: 13,
    color: '#A9BBD2',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 13
  },

  // INDICADOR DE ALERTA

  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#102D55',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 20,
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#1B4D80'
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 10,
    marginRight: 8
  },

  indicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7
  },

  // TARJETA DEL SENSOR

  sensorCard: {
    backgroundColor: '#0B2142',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#174477',
    elevation: 4
  },

  sensorTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF'
  },

  sensorStatus: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 6
  },

  // BOTONES DE ALERTA

  buttons: {
    marginTop: 20,
    gap: 12
  },

  ignoreButton: {
    backgroundColor: '#102D55',
    borderWidth: 1,
    borderColor: '#276092',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  ignoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 9
  },

  shutdownButton: {
    backgroundColor: '#C51F2B',
    padding: 17,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F04450',
    elevation: 4
  },

  shutdownText: {
    color: '#FFFFFF',
    fontWeight: '900',
    marginLeft: 9
  },

  // PIE DE PÁGINA

  footer: {
    backgroundColor: '#0B2142',
    padding: 18,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#174477'
  },

  footerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12
  },

  footerSubtitle: {
    color: '#8FAAC9',
    fontSize: 11,
    marginTop: 5
  }

});

  