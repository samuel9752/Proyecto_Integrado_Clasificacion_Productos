
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ImageBackground,
} from 'react-native';

import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import FondoAzul from '../../../assets/Fondo_2.jpeg';
import MiLogo from '../../../assets/logo.jpeg';

export default function LoginAdminScreen({ navigation }) {

  const CodigoAdmin = '11223344';

  const [code, setCode] = useState('');
  const [ShowCode, setShowCode] = useState(false);

  const handleLogin = () => {

    if (code.trim() === '') {
      Alert.alert(
        'Campo requerido',
        'Ingresa el código administrativo.'
      );
    }

    else if (code === CodigoAdmin) {

      Alert.alert(
        'Acceso autorizado',
        'Acceso administrativo exitoso.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              setCode('');
              navigation.navigate('AdminBottomTabNavigator');
            },
          },
        ]
      );

    }

    else {
      Alert.alert(
        'Código incorrecto',
        'El código administrativo ingresado no es válido.'
      );

      setCode('');
    }
  };

  return (

    <ImageBackground
      source={FondoAzul}
      style={styles.background}
      resizeMode="cover"
    >

      <View style={styles.overlay} />

      <View style={styles.container}>

        {/* LOGO */}

        <View style={styles.brandContainer}>

          <Image
            source={MiLogo}
            style={styles.logo}
          />

          <View>
            <Text style={styles.brandName}>
              SMARTGO
            </Text>

          </View>

        </View>

        {/* FORMULARIO */}

        <View style={styles.formContainer}>

          <View style={styles.iconContainer}>

            <MaterialIcons
              name="admin-panel-settings"
              size={39}
              color="#14569A"
            />

          </View>

          <Text style={styles.title}>
            Acceso Administrativo
          </Text>

          <Text style={styles.subtitle}>
            Ingresa tu código de administrador para continuar.
          </Text>

          {/* ETIQUETA */}

          <Text style={styles.inputLabel}>
            CÓDIGO ADMINISTRATIVO
          </Text>

          {/* INPUT */}

          <View style={styles.inputContainer}>

            <MaterialIcons
              name="lock-outline"
              size={22}
              color="#14569A"
            />

            <TextInput
              style={styles.input}
              placeholder="Ingresa tu código"
              placeholderTextColor="#A0A8B5"
              keyboardType="numeric"
              value={code}
              onChangeText={setCode}
              secureTextEntry={!ShowCode}
              maxLength={8}
            />

            <TouchableOpacity
              onPress={() => setShowCode(!ShowCode)}
              activeOpacity={0.7}
              style={styles.eyeButton}
            >

              <Feather
                name={ShowCode ? 'eye' : 'eye-off'}
                size={21}
                color="#64748B"
              />

            </TouchableOpacity>

          </View>

          {/* MENSAJE */}

          <View style={styles.securityMessage}>

            <MaterialIcons
              name="info-outline"
              size={17}
              color="#14569A"
            />

            <Text style={styles.securityText}>
              Este acceso está destinado únicamente al personal administrativo.
            </Text>

          </View>

          {/* BOTÓN */}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >

            <MaterialIcons
              name="verified-user"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.loginButtonText}>
              Verificar código
            </Text>

            <MaterialIcons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />

          </TouchableOpacity>

          {/* REGRESAR */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >

            <MaterialIcons
              name="arrow-back"
              size={18}
              color="#14569A"
            />

            <Text style={styles.backButtonText}>
              Regresar al inicio de sesión
            </Text>

          </TouchableOpacity>

        </View>

        {/* PIE */}

        <View style={styles.footer}>

          <Text style={styles.footerTitle}>
            SMARTGO 
          </Text>

          <Text style={styles.footerSubtitle}>
            Clasificación inteligente de bebidas
          </Text>

          <View style={styles.footerLines}>
            <View style={styles.redLine} />
            <View style={styles.blueLine} />
          </View>

        </View>

      </View>

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
    backgroundColor: 'rgba(10, 31, 58, 0.42)',
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },

  // MARCA

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 28,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 14,
    resizeMode: 'cover',
  },

  brandName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },

  brandSubtitle: {
    color: '#DCEAF8',
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 3,
  },

  // FORMULARIO

  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 23,
    elevation: 6,
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#EAF2FC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 17,
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#172033',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 12,
    color: '#7B8491',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 25,
  },

  // INPUT

  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#596579',
    letterSpacing: 0.8,
    marginBottom: 9,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.3,
    borderColor: '#DCE4EE',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#F8FAFC',
    height: 55,
  },

  input: {
    flex: 1,
    height: 55,
    fontSize: 15,
    color: '#172033',
    marginLeft: 10,
    letterSpacing: 2,
  },

  eyeButton: {
    padding: 8,
  },

  // SEGURIDAD

  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EAF2FC',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 23,
  },

  securityText: {
    flex: 1,
    fontSize: 10,
    color: '#41658C',
    lineHeight: 16,
  },

  // BOTÓN

  loginButton: {
    backgroundColor: '#14569A',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
  },

  // REGRESAR

  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 22,
    padding: 8,
  },

  backButtonText: {
    color: '#14569A',
    fontSize: 12,
    fontWeight: '800',
  },

  // PIE

  footer: {
    alignItems: 'center',
    marginTop: 25,
  },

  footerTitle: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  footerSubtitle: {
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
