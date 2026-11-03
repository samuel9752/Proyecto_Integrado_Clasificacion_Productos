
import React, { useState } from "react";

import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    StatusBar,
    ActivityIndicator
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { firebaseConfig } from "../firebase/FirebaseConfig";

import { initializeApp, getApps, getApp } from "firebase/app";

import {
    getAuth,
    createUserWithEmailAndPassword
} from "firebase/auth";

import {
    getFirestore,
    doc,
    setDoc
} from "firebase/firestore";

// FIREBASE

const app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

export default function Register({ navigation }) {

    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("usuario");
    const [loading, setLoading] = useState(false);

    // REGISTRO

    const Registro = async () => {

        if (!nombre.trim() || !email.trim() || !password) {
            Alert.alert(
                "Campos incompletos",
                "Completa todos los campos."
            );
            return;
        }

        if (password.length < 6) {
            Alert.alert(
                "Contraseña inválida",
                "La contraseña debe tener al menos 6 caracteres."
            );
            return;
        }

        // LOS ADMINISTRADORES NECESITAN AUTORIZACIÓN

        if (rol === "admin") {
            Alert.alert(
                "Registro de administrador",
                "Las cuentas de administrador deben ser autorizadas y creadas mediante un proceso seguro. Contacta al administrador del sistema."
            );
            return;
        }

        try {

            setLoading(true);

            // CREAR CUENTA

            const resultado = await createUserWithEmailAndPassword(
                auth,
                email.trim(),
                password
            );

            const usuario = resultado.user;

            // GUARDAR INFORMACIÓN EN FIRESTORE

            await setDoc(doc(db, "usuarios", usuario.uid), {

                nombre: nombre.trim(),
                correo: email.trim(),
                rol: "usuario",
                fechaRegistro: new Date().toISOString()

            });

            Alert.alert(
                "¡Registro exitoso!",
                "Tu cuenta ha sido creada correctamente."
            );

            navigation.replace("Usuario");

        } catch (error) {

            let mensaje = "No se pudo crear la cuenta.";

            if (error.code === "auth/email-already-in-use") {
                mensaje = "Este correo ya está registrado.";
            } else if (error.code === "auth/invalid-email") {
                mensaje = "El correo electrónico no es válido.";
            } else if (error.code === "auth/weak-password") {
                mensaje = "La contraseña es demasiado débil.";
            }

            Alert.alert("Error de registro", mensaje);

        } finally {

            setLoading(false);

        }
    };

    return (

        <SafeAreaView style={styles.safeArea}>

            <StatusBar
                backgroundColor="#142D4E"
                barStyle="light-content"
            />

            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >

                {/* ENCABEZADO */}

                <View style={styles.header}>

                    <Text style={styles.icon}>🥤</Text>

                    <Text style={styles.brand}>
                        BEBIDAS SMART
                    </Text>

                    <Text style={styles.headerTitle}>
                        ¡Únete a nosotros!
                    </Text>

                    <Text style={styles.headerSubtitle}>
                        Coca-Cola o Pepsi, tú decides.
                    </Text>

                    <View style={styles.brands}>

                        <Text style={styles.coca}>
                            Coca-Cola
                        </Text>

                        <Text style={styles.pepsi}>
                            Pepsi
                        </Text>

                    </View>

                </View>

                {/* FORMULARIO */}

                <View style={styles.content}>

                    <View style={styles.card}>

                        <Text style={styles.title}>
                            Crear cuenta
                        </Text>

                        <Text style={styles.subtitle}>
                            Completa tus datos para registrarte
                        </Text>

                        {/* NOMBRE */}

                        <Text style={styles.label}>
                            Nombre completo
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ingresa tu nombre"
                            placeholderTextColor="#9AA8B8"
                            value={nombre}
                            onChangeText={setNombre}
                        />

                        {/* CORREO */}

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

                        {/* CONTRASEÑA */}

                        <Text style={styles.label}>
                            Contraseña
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Crea una contraseña"
                            placeholderTextColor="#9AA8B8"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />

                        {/* TIPO DE CUENTA */}

                        <Text style={styles.label}>
                            Tipo de cuenta
                        </Text>

                        <View style={styles.roles}>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    rol === "usuario" && styles.roleSelected
                                ]}
                                onPress={() => setRol("usuario")}
                            >

                                <Text style={styles.roleIcon}>
                                    👤
                                </Text>

                                <Text style={[
                                    styles.roleText,
                                    rol === "usuario" && styles.roleTextSelected
                                ]}>
                                    Usuario
                                </Text>

                                <Text style={styles.roleDescription}>
                                    Solicitar bebidas
                                </Text>

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.roleButton,
                                    rol === "admin" && styles.adminSelected
                                ]}
                                onPress={() => setRol("admin")}
                            >

                                <Text style={styles.roleIcon}>
                                    🛡️
                                </Text>

                                <Text style={[
                                    styles.roleText,
                                    rol === "admin" && styles.roleTextSelected
                                ]}>
                                    Administrador
                                </Text>

                                <Text style={styles.roleDescription}>
                                    Acceso autorizado
                                </Text>

                            </TouchableOpacity>

                        </View>

                        {/* BOTÓN */}

                        <TouchableOpacity
                            style={[
                                styles.button,
                                loading && { opacity: 0.7 }
                            ]}
                            onPress={Registro}
                            disabled={loading}
                        >

                            {loading ? (

                                <ActivityIndicator color="#FFFFFF" />

                            ) : (

                                <Text style={styles.buttonText}>
                                    Crear cuenta
                                </Text>

                            )}

                        </TouchableOpacity>

                        {/* INICIAR SESIÓN */}

                        <View style={styles.loginContainer}>

                            <Text style={styles.loginText}>
                                ¿Ya tienes cuenta?
                            </Text>

                            <TouchableOpacity
                                onPress={() => navigation.navigate("Login")}
                            >

                                <Text style={styles.loginLink}>
                                    Inicia sesión
                                </Text>

                            </TouchableOpacity>

                        </View>

                    </View>

                    <Text style={styles.footer}>
                        TU BEBIDA, A UN SOLO TOQUE
                    </Text>

                </View>

            </ScrollView>

        </SafeAreaView>

    );
}

const styles = StyleSheet.create({

    safeArea: {
        flex: 1,
        backgroundColor: "#F3F6FA"
    },

    scroll: {
        flexGrow: 1
    },

    header: {
        height: 300,
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

    headerSubtitle: {
        color: "#D3DFEC",
        marginTop: 8,
        fontSize: 14
    },

    brands: {
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
        paddingHorizontal: 22,
        marginTop: -30,
        paddingBottom: 20
    },

    card: {
        width: "100%",
        maxWidth: 430,
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 25,
        padding: 25,
        elevation: 7,
        shadowColor: "#142D4E",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.12,
        shadowRadius: 12
    },

    title: {
        fontSize: 27,
        fontWeight: "bold",
        color: "#142D4E"
    },

    subtitle: {
        fontSize: 13,
        color: "#8492A3",
        marginTop: 5,
        marginBottom: 24
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

    roles: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 22
    },

    roleButton: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: "#E1E8F0",
        backgroundColor: "#F8FAFC",
        borderRadius: 13,
        padding: 12,
        alignItems: "center"
    },

    roleSelected: {
        borderColor: "#28679E",
        backgroundColor: "#EAF3FC"
    },

    adminSelected: {
        borderColor: "#D71920",
        backgroundColor: "#FCEBEC"
    },

    roleIcon: {
        fontSize: 25,
        marginBottom: 6
    },

    roleText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#52657A"
    },

    roleTextSelected: {
        color: "#142D4E"
    },

    roleDescription: {
        fontSize: 10,
        color: "#8492A3",
        marginTop: 5,
        textAlign: "center"
    },

    button: {
        height: 53,
        backgroundColor: "#28679E",
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 5
    },

    buttonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16
    },

    loginContainer: {
        alignItems: "center",
        marginTop: 23
    },

    loginText: {
        color: "#8492A3",
        fontSize: 13
    },

    loginLink: {
        color: "#28679E",
        fontWeight: "bold",
        marginTop: 7
    },

    footer: {
        textAlign: "center",
        fontSize: 10,
        letterSpacing: 2,
        color: "#9AA8B8",
        fontWeight: "600",
        marginTop: 25
    }

});
