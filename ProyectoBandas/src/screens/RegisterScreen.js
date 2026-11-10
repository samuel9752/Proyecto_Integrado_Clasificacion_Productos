
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../firebase/FireBaseConfig';
import { useState } from 'react';

import Feather from '@expo/vector-icons/Feather';

export default function RegisterScreen({ navigation }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState('Usuario');

  // Conexión con Firebase
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  const auth = getAuth(app);
  const db = getFirestore(app);

  // Función para registrar usuarios
  const Registro = () => {

    if (email === '' || password === '') {
      alert('Completa todos los campos');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)

      .then((resultado) => {

        // Guardar información del usuario en Firestore
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.formContainer}>

        <Text style={styles.title}>Crear una cuenta</Text>
        <Text style={styles.subtitle}>Únete a nosotros</Text>

        {/* Correo electrónico */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Contraseña */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ paddingLeft: 15, paddingVertical: 12 }}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={21}
                color="black"
              />
            </Text>
          </TouchableOpacity>
        </View>

        {/* ComboBox de tipo de usuario */}
        <View style={styles.pickerContainer}>

          <Text style={styles.label}>Tipo de usuario</Text>

          <Picker
            selectedValue={tipoUsuario}
            onValueChange={(itemValue) => setTipoUsuario(itemValue)}
          >
            <Picker.Item label="Usuario" value="Usuario" />
            <Picker.Item label="Administrador" value="Administrador" />
          </Picker>

        </View>

        {/* Botón de registro */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={Registro}
        >
          <Text style={styles.registerButtonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            ¿Ya tienes cuenta? Inicia Sesión
          </Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  formContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333',
  },

  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 20,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
  },

  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },

  pickerContainer: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f8f8f8',
  },

  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },

  registerButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },

  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  loginLink: {
    alignItems: 'center',
  },

  loginLinkText: {
    color: '#007AFF',
    fontSize: 14,
  },

});
