
import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert
} from "react-native";

import { firebaseConfig } from "../firebase/FirebaseConfig";

import { initializeApp, getApps, getApp } from "firebase/app";

import {
    getAuth,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";

import {
    getFirestore,
    doc,
    getDoc
} from "firebase/firestore";

// FIREBASE

const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export default function Login({ navigation }) {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // INICIAR SESIÓN

    const handleLogin = async () => {

        if (!email.trim() || !password) {
            Alert.alert(
                "Campos incompletos",
                "Ingresa tu correo y contraseña."
            );
            return;
        }

        try {

            setLoading(true);

            const resultado = await signInWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const usuario = resultado.user;

            // CONSULTAR ROL EN FIRESTORE

            const referencia = doc(db, "usuarios", usuario.uid);

            const documento = await getDoc(referencia);

            if (!documento.exists()) {

                await auth.signOut();

                Alert.alert(
                    "Cuenta no configurada",
                    "No se encontró el perfil de tu cuenta."
                );

                return;
            }

            const datos = documento.data();

            if (datos.rol === "admin") {

                navigation.replace("Admin");

            } else if (datos.rol === "usuario") {

                navigation.replace("Usuario");

            } else {

                await auth.signOut();

                Alert.alert(
                    "Error",
                    "El tipo de cuenta no es válido."
                );

            }

        } catch (error) {

            Alert.alert(
                "Error al iniciar sesión",
                "Verifica tu correo y contraseña."
            );

        } finally {

            setLoading(false);

        }
    };

    // RECUPERAR CONTRASEÑA

    const recuperarPassword = async () => {

        if (!email.trim()) {

            Alert.alert(
                "Recuperar contraseña",
                "Primero ingresa tu correo electrónico."
            );

            return;
        }

        try {

            await sendPasswordResetEmail(
                auth,
                email.trim()
            );

            Alert.alert(
                "Correo enviado",
                "Revisa tu correo para cambiar tu contraseña."
            );

        } catch (error) {

            Alert.alert(
                "Error",
                "No se pudo enviar el correo de recuperación."
            );

        }
    };

    return (

        <SafeAreaView style={styles.container}>

            <StatusBar
                backgroundColor="#142D4E"
                barStyle="light-content"
            />

            <View style={styles.header}>

                <Text style={styles.icon}>🥤</Text>

                <Text style={styles.brand}>
                    BEBIDAS SMART
                </Text>

                <Text style={styles.headerTitle}>
                    ¡Elige tu favorita!
                </Text>

                <Text style={styles.subtitleHeader}>
                    Coca-Cola o Pepsi, tú decides.
                </Text>

                <View style={styles.marcas}>

                    <Text style={styles.coca}>
                        Coca-Cola
                    </Text>

                    <Text style={styles.pepsi}>
                        Pepsi
                    </Text>

                </View>

            </View>

            <View style={styles.content}>

                <View style={styles.card}>

                    <Text style={styles.title}>
                        Bienvenido
                    </Text>

                    <Text style={styles.subtitle}>
                        Inicia sesión para continuar
                    </Text>

                    <Text style={styles.label}>
                        Correo electrónico
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="correo@ejemplo.com"
                        placeholderTextColor="#9AA8B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>
                        Contraseña
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Ingresa tu contraseña"
                        placeholderTextColor="#9AA8B8"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        onPress={recuperarPassword}
                        style={styles.forgot}
                    >

                        <Text style={styles.forgotText}>
                            ¿Olvidaste tu contraseña?
                        </Text>

                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                        disabled={loading}
                    >

                        <Text style={styles.buttonText}>
                            {loading ? "Ingresando..." : "Iniciar sesión"}
                        </Text>

                    </TouchableOpacity>

                    <View style={styles.registerContainer}>

                        <Text style={styles.registerText}>
                            ¿No tienes cuenta?
                        </Text>

                        <TouchableOpacity
                            onPress={() => navigation.navigate("Register")}
                        >

                            <Text style={styles.registerLink}>
                                Regístrate aquí
                            </Text>

                        </TouchableOpacity>

                    </View>

                </View>

            </View>

        </SafeAreaView>

    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F3F6FA"
    },

    header: {
        height: 290,
        backgroundColor: "#142D4E",
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        justifyContent: "center",
        alignItems: "center"
    },

    icon: {
        fontSize: 48,
        marginBottom: 10
    },

    brand: {
        fontSize: 13,
        color: "#8DBDEB",
        fontWeight: "bold",
        letterSpacing: 4
    },

    headerTitle: {
        fontSize: 27,
        color: "#FFFFFF",
        fontWeight: "bold",
        marginTop: 12
    },

    subtitleHeader: {
        color: "#D3DFEC",
        marginTop: 8,
        fontSize: 14
    },

    marcas: {
        flexDirection: "row",
        gap: 12,
        marginTop: 20
    },

    coca: {
        backgroundColor: "#E51B23",
        color: "#FFFFFF",
        padding: 10,
        borderRadius: 20,
        overflow: "hidden",
        fontWeight: "bold"
    },

    pepsi: {
        backgroundColor: "#005CB4",
        color: "#FFFFFF",
        padding: 10,
        borderRadius: 20,
        overflow: "hidden",
        fontWeight: "bold"
    },

    content: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 22,
        marginTop: -25
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 25,
        padding: 27,
        elevation: 7
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#142D4E"
    },

    subtitle: {
        fontSize: 14,
        color: "#8492A3",
        marginBottom: 25,
        marginTop: 5
    },

    label: {
        fontSize: 14,
        color: "#263F5C",
        fontWeight: "600",
        marginBottom: 8
    },

    input: {
        height: 52,
        backgroundColor: "#F5F8FC",
        borderWidth: 1,
        borderColor: "#E1E8F0",
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 18,
        color: "#263F5C"
    },

    forgot: {
        alignItems: "flex-end",
        marginBottom: 20
    },

    forgotText: {
        color: "#28679E",
        fontSize: 13,
        fontWeight: "600"
    },

    button: {
        height: 53,
        backgroundColor: "#28679E",
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center"
    },

    buttonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16
    },

    registerContainer: {
        alignItems: "center",
        marginTop: 23
    },

    registerText: {
        color: "#8492A3",
        fontSize: 13
    },

    registerLink: {
        color: "#28679E",
        fontWeight: "bold",
        marginTop: 7
    }

});
