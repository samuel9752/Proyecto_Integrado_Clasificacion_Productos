
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
                    <Feather name="layers" size={65} color="#007AFF" />
                </View>

                <Text style={styles.title}>
                    Clasificador de bebidas
                </Text>

                <Text style={styles.subtitle}>
                    Sistema de clasificación de productos
                </Text>

                <Text style={styles.description}>
                    ¡Bienvenido a nuestro sistema!
                    {'\n\n'}
                    Administra y consulta la información de los productos
                    de manera sencilla.
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.buttonText}>
                        Comenzar
                    </Text>

                    <Feather name="arrow-right" size={20} color="white" />
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
        marginBottom: 20,
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
        marginTop: 8,
    },

    description: {
        fontSize: 14,
        textAlign: 'center',
        color: '#777',
        marginTop: 30,
        marginBottom: 30,
        lineHeight: 22,
    },

    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        gap: 10,
    },

    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    footer: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginTop: 30,
    },

});
