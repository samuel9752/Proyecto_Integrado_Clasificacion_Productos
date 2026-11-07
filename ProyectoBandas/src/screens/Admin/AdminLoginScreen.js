import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../firebase/FirebaseConfig';

import Feather1 from '@expo/vector-icons/Feather';
import Feather2 from '@expo/vector-icons/Feather';

export default function LoginAdminScreen({ navigation }) {
    let CodigoAdmin = '11223344'; // Código administrativo predefinido para el inicio de sesión de administrador
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [ShowCode, setShowCode] = useState(false);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const handleLogin = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then(() => {
                if (code === CodigoAdmin) {
                    Alert.alert('Éxito', 'Inicio de sesión como administrador exitoso');
                    setEmail('');
                    setPassword('');
                    setCode('');
                    navigation.navigate('AdminBottomTabNavigator');
                } else if (code === '') {
                    Alert.alert('Error', 'Ingresa el código de administrador');
                } else {
                    Alert.alert('Error', 'Código de administrador incorrecto');
                    setCode('');
                }
            })
            .catch(error => {
                alert(error);
            });
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Iniciar Sesión Como Administrador</Text>
                <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

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

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor="#999"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />

                    {/* Botón táctil para alternar la visibilidad de la contraseña */}
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        {/* Al presionar, invierte el valor de showPassword (true ↔ false).*/}
                        {/* Esto hace que el TextInput cambie dinámicamente entre ocultar y mostrar la contraseña.*/}
                        <Text style={{ paddingLeft: 15, paddingVertical: 12 }}>
                            {/* Renderiza un ícono distinto según el estado showPassword */}
                            {showPassword
                                ? <Feather2 name="eye" size={21} color="black" />     // Ícono de ojo abierto (contraseña visible)
                                : <Feather1 name="eye-off" size={21} color="black" /> // Ícono de ojo tachado (contraseña oculta)
                            }
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Codigo administrativo"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        autoCapitalize="none"
                        value={code}
                        onChangeText={setCode}
                        secureTextEntry={!ShowCode}
                    />

                    {/* Botón táctil para alternar la visibilidad de la contraseña */}
                    <TouchableOpacity onPress={() => setShowCode(!ShowCode)}>
                        {/* Al presionar, invierte el valor de showCode (true ↔ false).*/}
                        {/* Esto hace que el TextInput cambie dinámicamente entre ocultar y mostrar la contraseña.*/}
                        <Text style={{ paddingLeft: 15, paddingVertical: 12 }}>
                            {/* Renderiza un ícono distinto según el estado showCode */}
                            {ShowCode
                                ? <Feather2 name="eye" size={21} color="black" />     // Ícono de ojo abierto (contraseña visible)
                                : <Feather1 name="eye-off" size={21} color="black" /> // Ícono de ojo tachado (contraseña oculta)
                            }
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                    <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.registerLinkText}>
                        ¿Iniciar sesión como Usuario?
                    </Text>
                </TouchableOpacity>

                <Text style={styles.registerLinkText}>
                    o
                </Text>

                <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
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