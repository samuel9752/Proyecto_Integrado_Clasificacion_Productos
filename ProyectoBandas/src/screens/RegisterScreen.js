
import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ImageBackground,
  useWindowDimensions,
  Modal,
} from 'react-native';

import {
  getAuth,
  createUserWithEmailAndPassword
} from 'firebase/auth';

import {
  getFirestore,
  doc,
  setDoc
} from 'firebase/firestore';

import {
  initializeApp,
  getApps
} from 'firebase/app';

import firebaseConfig from '../firebase/FirebaseConfig';

import Logo from '../../assets/logo.jpeg';
import Fondo_2 from '../../assets/Fondo_2.jpeg';

import Feather from '@expo/vector-icons/Feather';

export default function RegisterScreen({ navigation }) {

  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState('Usuario');

  // Controlar ventana emergente
  const [modalVisible, setModalVisible] = useState(false);

  // Conexión con Firebase
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Seleccionar tipo de usuario
  const seleccionarTipo = (tipo) => {
    setTipoUsuario(tipo);
    setModalVisible(false);
  };

  // Función para registrar usuarios
  const Registro = () => {

    if (email === '' || password === '') {
      alert('Completa todos los campos');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((resultado) => {

        return setDoc(doc(db, 'usuarios', resultado.user.uid), {
          correo: email,
          tipoUsuario: tipoUsuario
        });

      })
      .then(() => {
        alert('Usuario creado correctamente');
        navigation.navigate('Login');
      })
      .catch(error => {
        alert(error.message);
      });

  };

  return (

    <ImageBackground
      source={Fondo_2}
      style={styles.background}
      resizeMode="cover"
    >

      {/* Capa oscura */}
      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { minHeight: height }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        <View
          style={[
            styles.formContainer,
            {
              width: isTablet ? '75%' : '100%',
              maxWidth: isTablet ? 650 : 450,
              padding: isTablet ? 35 : 25,
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

          {/* Títulos */}
          <Text
            style={[
              styles.title,
              { fontSize: isTablet ? 34 : 27 }
            ]}
          >
            Crear una cuenta
          </Text>

          <Text
            style={[
              styles.subtitle,
              { fontSize: isTablet ? 19 : 16 }
            ]}
          >
            Únete a SMARTGO
          </Text>

          {/* Correo electrónico */}
          <View style={styles.inputContainer}>

            <Feather
              name="mail"
              size={21}
              color="#B8D4F5"
            />

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              placeholderTextColor="#B8D4F5"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

          </View>

          {/* Contraseña */}
          <View style={styles.inputContainer}>

            <Feather
              name="lock"
              size={21}
              color="#B8D4F5"
            />

            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#B8D4F5"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={21}
                color="#B8D4F5"
              />
            </TouchableOpacity>

          </View>

          {/* Tipo de usuario */}
          <TouchableOpacity
            style={styles.pickerContainer}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >

            <View style={styles.pickerLabelContainer}>

              <Feather
                name="users"
                size={20}
                color="#B8D4F5"
              />

              <Text style={styles.label}>
                Tipo de usuario
              </Text>

            </View>

            <View style={styles.selectedContainer}>

              <Text style={styles.selectedText}>
                {tipoUsuario}
              </Text>

              <Feather
                name="chevron-down"
                size={22}
                color="#FFFFFF"
              />

            </View>

          </TouchableOpacity>

          {/* Botón registrarse */}
          <TouchableOpacity
            style={styles.registerButton}
            onPress={Registro}
            activeOpacity={0.8}
          >

            <Feather
              name="user-plus"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.registerButtonText}>
              Registrarse
            </Text>

          </TouchableOpacity>

          {/* Regresar al Login */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >

            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.loginLinkBold}>
                Inicia Sesión
              </Text>
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* VENTANA EMERGENTE DE TIPO DE USUARIO */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContainer}>

            {/* Encabezado */}
            <View style={styles.modalHeader}>

              <Feather
                name="users"
                size={25}
                color="#FFFFFF"
              />

              <Text style={styles.modalTitle}>
                Tipo de usuario
              </Text>

            </View>

            <Text style={styles.modalSubtitle}>
              Selecciona el tipo de cuenta que deseas crear.
            </Text>

            {/* Opción Usuario */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                tipoUsuario === 'Usuario' && styles.optionSelected
              ]}
              onPress={() => seleccionarTipo('Usuario')}
            >

              <Feather
                name="user"
                size={23}
                color="#FFFFFF"
              />

              <Text style={styles.optionText}>
                Usuario
              </Text>

              {tipoUsuario === 'Usuario' && (
                <Feather
                  name="check-circle"
                  size={21}
                  color="#38BDF8"
                />
              )}

            </TouchableOpacity>

            {/* Opción Administrador */}
            <TouchableOpacity
              style={[
                styles.optionButton,
                tipoUsuario === 'Administrador' && styles.optionSelected
              ]}
              onPress={() => seleccionarTipo('Administrador')}
            >

              <Feather
                name="shield"
                size={23}
                color="#FFFFFF"
              />

              <Text style={styles.optionText}>
                Administrador
              </Text>

              {tipoUsuario === 'Administrador' && (
                <Feather
                  name="check-circle"
                  size={21}
                  color="#38BDF8"
                />
              )}

            </TouchableOpacity>

            {/* Cancelar */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>

  );
}

const styles = StyleSheet.create({

  background: {
    flex: 1,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  formContainer: {
    backgroundColor: 'rgba(5, 35, 75, 0.85)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },

  logo: {
    marginBottom: 15,
    borderRadius: 25,
  },

  title: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },

  subtitle: {
    color: '#D6E8FF',
    textAlign: 'center',
    marginBottom: 25,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 58,
    paddingHorizontal: 15,
    marginBottom: 18,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 12,
  },

  pickerContainer: {
    width: '100%',
    marginBottom: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },

  pickerLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },

  label: {
    color: '#D6E8FF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  selectedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },

  selectedText: {
    color: '#FFFFFF',
    fontSize: 16,
  },

  registerButton: {
    width: '100%',
    height: 55,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 22,
  },

  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },

  loginLink: {
    alignItems: 'center',
  },

  loginLinkText: {
    color: '#D6E8FF',
    fontSize: 14,
  },

  loginLinkBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // ESTILOS DE LA VENTANA EMERGENTE

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#08264F',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    elevation: 15,
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },

  modalTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: 'bold',
  },

  modalSubtitle: {
    color: '#B8D4F5',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 22,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    padding: 16,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },

  optionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.30)',
    borderColor: '#007AFF',
  },

  optionText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    marginTop: 8,
    padding: 13,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },

  cancelText: {
    color: '#B8D4F5',
    fontSize: 15,
    fontWeight: 'bold',
  },

});
