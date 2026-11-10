
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

import { firebaseConfig } from '../firebase/FireBaseConfig';
import { useState } from 'react';

import Feather from '@expo/vector-icons/Feather';

export default function LoginScreen({ navigation }) {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

    // Comprobar correo y contraseña
    signInWithEmailAndPassword(auth, email, password)

      .then((resultado) => {

        // Obtener el UID del usuario
        const uid = resultado.user.uid;

        // Buscar sus datos en Firestore
        const referencia = doc(db, 'usuarios', uid);

        return getDoc(referencia);

      })

      .then((documento) => {

        if (documento.exists()) {

          // Obtener el tipo de usuario
          const datos = documento.data();
          const tipo = datos.tipoUsuario;

          setEmail('');
          setPassword('');

          if (tipo && tipo.toLowerCase() === 'administrador') {

            alert('Bienvenido administrador');

            // Ir a la pantalla que solicita el código
            navigation.navigate('AdminLoginScreen');

          } else {

            alert('Inicio de sesión exitoso');

            // Ir al menú principal del usuario
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>

      <View style={styles.formContainer}>

        <Text style={styles.title}>Iniciar Sesión</Text>

        <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

        {/* Correo electrónico */}
        <View style={styles.inputContainer}>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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

        {/* Botón iniciar sesión */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >

          <Text style={styles.loginButtonText}>
            Iniciar Sesión
          </Text>

        </TouchableOpacity>

        {/* Enlace de registro */}
        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >

          <Text style={styles.registerLinkText}>
            ¿No tienes cuenta? Regístrate
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

  loginButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },

  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  registerLink: {
    alignItems: 'center',
  },

  registerLinkText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },

});
