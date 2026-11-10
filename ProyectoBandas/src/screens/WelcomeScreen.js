
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ImageBackground,
    Image,
    useWindowDimensions
} from 'react-native';

import Logo from '../../assets/logo.jpeg';
import Fondo_1 from '../../assets/Fondo_1.jpeg';
import Feather from '@expo/vector-icons/Feather';

export default function WelcomeScreen({ navigation }) {

    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;

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
                >
                    <View
                        style={[
                            styles.formContainer,
                            {
                                width: isTablet ? '75%' : '100%',
                                maxWidth: isTablet ? 750 : 500,
                                padding: isTablet ? 45 : 25,
                            }
                        ]}
                    >
                        <Image
                            source={Logo}
                            style={[
                                styles.logo,
                                {
                                    width: isTablet ? 420 : 250,
                                    height: isTablet ? 210 : 140,
                                    borderRadius: isTablet ? 1000 : 1000
                                }
                            ]}
                            resizeMode="contain"
                        />

                        <Text
                            style={[
                                styles.title,
                                { fontSize: isTablet ? 38 : 26 }
                            ]}
                        >
                            Clasificador de bebidas
                        </Text>

                        <Text
                            style={[
                                styles.subtitle,
                                { fontSize: isTablet ? 22 : 15 }
                            ]}
                        >
                            Sistema de clasificación de productos
                        </Text>

                        <Text
                            style={[
                                styles.description,
                                {
                                    fontSize: isTablet ? 19 : 14,
                                    lineHeight: isTablet ? 30 : 22,
                                }
                            ]}
                        >
                            ¡Bienvenido a nuestro sistema!
                            {'\n\n'}
                            Administra y consulta la información
                            de los productos de manera sencilla.
                        </Text>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                {
                                    padding: isTablet ? 22 : 16,
                                    maxWidth: isTablet ? 450 : '100%',
                                }
                            ]}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Text
                                style={[
                                    styles.buttonText,
                                    { fontSize: isTablet ? 21 : 16 }
                                ]}
                            >
                                Comenzar
                            </Text>

                            <Feather
                                name="arrow-right"
                                size={isTablet ? 26 : 20}
                                color="white"
                            />
                        </TouchableOpacity>

                        <Text
                            style={[
                                styles.footer,
                                { fontSize: isTablet ? 16 : 12 }
                            ]}
                        >
                            Proyecto Integrado © 2026
                        </Text>

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
        backgroundColor: 'rgba(5, 35, 75, 0.82)',
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
    },

    subtitle: {
        textAlign: 'center',
        color: '#D6E8FF',
        marginTop: 12,
    },

    description: {
        textAlign: 'center',
        color: '#EAF3FF',
        marginTop: 30,
        marginBottom: 35,
        paddingHorizontal: 10,
    },

    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 14,
        gap: 12,
        width: '100%',
    },

    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },

    footer: {
        textAlign: 'center',
        color: '#B8D4F5',
        marginTop: 30,
    },

});
