
import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  Image,
  useWindowDimensions
} from 'react-native';

import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';

import {
  initializeApp,
  getApps
} from 'firebase/app';

import {
  getFirestore,
  doc,
  getDoc
} from 'firebase/firestore';

import { firebaseConfig } from '../firebase/FirebaseConfig';

import Logo from '../../assets/logo.jpeg';
import Fondo_1 from '../../assets/Fondo_2.jpeg';

import Feather from '@expo/vector-icons/Feather';

export default function LoginScreen({ navigation }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  // Conexión con Firebase
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Función para iniciar sesión
  const handleLogin = () => {

    if (email === '' || password === '') {
      alert('Completa todos los campos');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)

      .then((resultado) => {

        const uid = resultado.user.uid;
        const referencia = doc(db, 'usuarios', uid);

        return getDoc(referencia);

      })

      .then((documento) => {

        if (documento.exists()) {

          const datos = documento.data();
          const tipo = datos.tipoUsuario;

          setEmail('');
          setPassword('');

          if (tipo && tipo.toLowerCase() === 'administrador') {

            alert('Bienvenido administrador');

            navigation.navigate('AdminLoginScreen');

          } else {

            alert('Inicio de sesión exitoso');

            navigation.navigate('UserBottomTabNavigator');

          }

        } else {

          alert('No se encontraron los datos del usuario en Firestore');

        }

      })

      .catch(error => {

        alert('Error al iniciar sesión: ' + error.message);

      });

  };

  return (

    <ImageBackground
      source={Fondo_1}
      style={styles.background}
      resizeMode="cover"
    >

      <View style={styles.overlay}>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              minHeight: height,
              paddingHorizontal: isTablet ? 50 : 20,
            }
          ]}
          keyboardShouldPersistTaps="handled"
        >

          <View
            style={[
              styles.formContainer,
              {
                width: isTablet ? '75%' : '100%',
                maxWidth: isTablet ? 650 : 450,
                padding: isTablet ? 40 : 25,
              }
            ]}
          >

            {/* Logo */}
            <Image
              source={Logo}
              style={[
                styles.logo,
                {
                  width: isTablet ? 350 : 230,
                  height: isTablet ? 170 : 120,
                }
              ]}
              resizeMode="contain"
            />

            {/* Título */}
            <Text
              style={[
                styles.title,
                { fontSize: isTablet ? 36 : 26 }
              ]}
            >
              Iniciar Sesión
            </Text>

            <Text
              style={[
                styles.subtitle,
                { fontSize: isTablet ? 20 : 16 }
              ]}
            >
              Bienvenido de nuevo
            </Text>

            {/* Correo electrónico */}
            <View style={styles.inputContainer}>

              <Feather
                name="mail"
                size={isTablet ? 23 : 20}
                color="#B8D4F5"
              />

              <TextInput
                style={[
                  styles.input,
                  { fontSize: isTablet ? 19 : 16 }
                ]}
                placeholder="Correo electrónico"
                placeholderTextColor="#B8CBE0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

            </View>

            {/* Contraseña */}
            <View style={styles.inputContainer}>

              <Feather
                name="lock"
                size={isTablet ? 23 : 20}
                color="#B8D4F5"
              />

              <TextInput
                style={[
                  styles.input,
                  { fontSize: isTablet ? 19 : 16 }
                ]}
                placeholder="Contraseña"
                placeholderTextColor="#B8CBE0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
              >

                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={isTablet ? 24 : 21}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

            </View>

            {/* Botón iniciar sesión */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { padding: isTablet ? 20 : 16 }
              ]}
              onPress={handleLogin}
            >

              <Text
                style={[
                  styles.loginButtonText,
                  { fontSize: isTablet ? 21 : 16 }
                ]}
              >
                Iniciar Sesión
              </Text>

              <Feather
                name="arrow-right"
                size={isTablet ? 25 : 20}
                color="white"
              />

            </TouchableOpacity>

            {/* Enlace de registro */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
            >

              <Text
                style={[
                  styles.registerLinkText,
                  { fontSize: isTablet ? 18 : 14 }
                ]}
              >
                ¿No tienes cuenta? Regístrate
              </Text>

            </TouchableOpacity>

          </View>

        </ScrollView>

      </View>

    </ImageBackground>

  );

}

const styles = StyleSheet.create({

  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 35,
  },

  formContainer: {
    backgroundColor: 'rgba(5, 35, 75, 0.85)',
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.30,
    shadowRadius: 8,
    elevation: 8,
  },

  logo: {
    marginBottom: 20,
  },

  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 5,
  },

  subtitle: {
    textAlign: 'center',
    color: '#D6E8FF',
    marginBottom: 30,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.30)',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    width: '100%',
  },

  input: {
    flex: 1,
    height: 58,
    color: '#FFFFFF',
    paddingHorizontal: 12,
  },

  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 25,
    gap: 12,
    width: '100%',
  },

  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  registerLink: {
    alignItems: 'center',
    padding: 8,
  },

  registerLinkText: {
    color: '#D6E8FF',
    textAlign: 'center',
    fontWeight: '600',
  },

});
