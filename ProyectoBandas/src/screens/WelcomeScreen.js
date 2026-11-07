
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
} from 'react-native';

import Feather from '@expo/vector-icons/Feather';

export default function WelcomeScreen({ navigation }) {

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>

            <View style={styles.formContainer}>

                <View style={styles.iconContainer}>
                    <Feather name="layers" size={55} color="#007AFF" />
                </View>

                <Text style={styles.title}>Clasificador de bebidas</Text>

                <Text style={styles.subtitle}>
                    Sistema de clasificación de productos
                </Text>

                <Text style={styles.description}>
                    Bienvenido. Selecciona el tipo de acceso que deseas utilizar.
                </Text>

                {/* Acceso Usuario */}
                <TouchableOpacity
                    style={styles.userButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Feather name="user" size={23} color="white" />

                    <View style={styles.buttonTextContainer}>
                        <Text style={styles.buttonTitle}>
                            Usuario
                        </Text>

                        <Text style={styles.buttonDescription}>
                            Iniciar sesión o crear una cuenta
                        </Text>
                    </View>

                    <Feather name="chevron-right" size={23} color="white" />
                </TouchableOpacity>

                {/* Acceso Administrador */}
                <TouchableOpacity
                    style={styles.adminButton}
                    onPress={() => navigation.navigate('AdminLoginScreen')}
                >
                    <Feather name="shield" size={23} color="#007AFF" />

                    <View style={styles.buttonTextContainer}>
                        <Text style={styles.adminButtonTitle}>
                            Administrador
                        </Text>

                        <Text style={styles.adminButtonDescription}>
                            Acceso al panel administrativo
                        </Text>
                    </View>

                    <Feather name="chevron-right" size={23} color="#007AFF" />
                </TouchableOpacity>

                <Text style={styles.footer}>
                    Proyecto Integrado © 2026
                </Text>

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
        padding: 25,
        backgroundColor: 'white',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },

    iconContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },

    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },

    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        color: '#666',
        marginTop: 5,
    },

    description: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginTop: 25,
        marginBottom: 25,
    },

    userButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
    },

    adminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        borderColor: '#007AFF',
        borderWidth: 1,
        padding: 15,
        borderRadius: 8,
    },

    buttonTextContainer: {
        flex: 1,
        marginLeft: 12,
    },

    buttonTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    buttonDescription: {
        color: '#e8f2ff',
        fontSize: 12,
        marginTop: 3,
    },

    adminButtonTitle: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold',
    },

    adminButtonDescription: {
        color: '#666',
        fontSize: 12,
        marginTop: 3,
    },

    footer: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 30,
    },

});
