
import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { firebaseConfig } from "../firebase/FirebaseConfig";
import { useState } from "react";
import { initializeApp } from "firebase/app";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register({ navigation }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const Registro = () => {

        createUserWithEmailAndPassword(auth, email, password)

            .then(() => {

                alert("Usuario registrado");
                setEmail("");
                setPassword("");

            })

            .catch((error) => {

                alert(error);

            });

    };

    return (

        <SafeAreaView style={styles.safeArea}>

            <View style={styles.container}>

                <View style={styles.header}>

                    <Text style={styles.houseIcon}>⌂</Text>

                    <Text style={styles.logo}>Banda Expendedora</Text>

                    <Text style={styles.headerSubtitle}>
                        Crea tu cuenta para comenzar
                    </Text>

                </View>

                <View style={styles.content}>

                    <View style={styles.card}>

                        <Text style={styles.title}>Crear cuenta</Text>

                        <Text style={styles.subtitle}>
                            Regístrate
                        </Text>

                        <Text style={styles.label}>Correo electrónico</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="correo@ejemplo.com"
                            placeholderTextColor="#9AA4B2"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />

                        <Text style={styles.label}>Contraseña</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Crea una contraseña"
                            placeholderTextColor="#9AA4B2"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={Registro}
                        >

                            <Text style={styles.buttonText}>
                                Crear cuenta
                            </Text>

                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.loginButton}
                            onPress={() => navigation.navigate("Login")}
                        >

                            <Text style={styles.loginText}>
                                ¿Ya tienes cuenta?{" "}
                                <Text style={styles.link}>
                                    Inicia sesión
                                </Text>
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </View>

        </SafeAreaView>

    );

}

const styles = StyleSheet.create({

    safeArea: {

        flex: 1,
        backgroundColor: "#F2F6FA",

    },

    container: {

        flex: 1,
        backgroundColor: "#F2F6FA",

    },

    header: {

        backgroundColor: "#1E3A5F",
        paddingTop: 25,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
        alignItems: "center",

    },

    houseIcon: {

        fontSize: 38,
        color: "#FFFFFF",
        marginBottom: 5,

    },

    logo: {

        fontSize: 27,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",

    },

    headerSubtitle: {

        fontSize: 14,
        color: "#D9E8F5",
        textAlign: "center",
        marginTop: 6,

    },

    content: {

        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 20,
        paddingVertical: 25,

    },

    card: {

        width: "100%",
        maxWidth: 400,
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 30,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.10,
        shadowRadius: 10,
        elevation: 6,

    },

    title: {

        fontSize: 30,
        fontWeight: "bold",
        color: "#1E3A5F",
        textAlign: "center",
        marginBottom: 8,

    },

    subtitle: {

        fontSize: 14,
        color: "#718096",
        textAlign: "center",
        marginBottom: 30,

    },

    label: {

        fontSize: 15,
        fontWeight: "600",
        color: "#334E68",
        marginBottom: 8,

    },

    input: {

        height: 52,
        borderWidth: 1,
        borderColor: "#C7D4E2",
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#243B53",
        marginBottom: 20,
        backgroundColor: "#F8FAFC",

    },

    button: {

        height: 52,
        backgroundColor: "#2F6B9A",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 5,

    },

    buttonText: {

        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "bold",

    },

    loginButton: {

        marginTop: 22,
        alignItems: "center",

    },

    loginText: {

        color: "#718096",
        fontSize: 14,

    },

    link: {

        color: "#2F6B9A",
        fontWeight: "bold",

    },

});

