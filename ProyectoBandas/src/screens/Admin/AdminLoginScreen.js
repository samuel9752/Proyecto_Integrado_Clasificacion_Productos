
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert
} from 'react-native';

import Feather from '@expo/vector-icons/Feather';

export default function LoginAdminScreen({ navigation }) {

    let CodigoAdmin = '11223344';

    const [code, setCode] = useState('');
    const [ShowCode, setShowCode] = useState(false);

    const handleLogin = () => {

        if (code === '') {
            Alert.alert('Error', 'Ingresa el código administrativo');
        }
        else if (code === CodigoAdmin) {

            Alert.alert(
                'Éxito',
                'Acceso administrativo exitoso',
                [
                    {
                        text: 'Continuar',
                        onPress: () => {
                            setCode('');
                            navigation.navigate('AdminBottomTabNavigator');
                        }
                    }
                ]
            );

        }
        else {
            Alert.alert('Error', 'Código administrativo incorrecto');
            setCode('');
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.formContainer}>

                <Text style={styles.title}>
                    Acceso Administrativo
                </Text>

                <Text style={styles.subtitle}>
                    Ingresa el código para continuar
                </Text>

                <View style={styles.inputContainer}>

                    <TextInput
                        style={styles.input}
                        placeholder="Código administrativo"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                        value={code}
                        onChangeText={setCode}
                        secureTextEntry={!ShowCode}
                        maxLength={8}
                    />

                    <TouchableOpacity
                        onPress={() => setShowCode(!ShowCode)}
                    >
                        <Text style={{ paddingLeft: 15 }}>
                            {ShowCode
                                ? <Feather name="eye" size={21} color="black" />
                                : <Feather name="eye-off" size={21} color="black" />
                            }
                        </Text>
                    </TouchableOpacity>

                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>
                        Verificar código
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.registerLinkText}>
                        Regresar al inicio de sesión
                    </Text>
                </TouchableOpacity>

            </View>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
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
