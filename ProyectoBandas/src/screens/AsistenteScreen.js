
import React, { useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';

import FondoAzul from '../../assets/Fondo_2.jpeg';
import MiLogo from '../../assets/logo.jpeg';

// Dirección del servidor de SMARTGO AI
const API_URL = 'http://192.168.1.194:3001/api/asistente';

const mensajeInicial = (modo) =>
  modo === 'admin'
    ? '¡Hola! Soy SMARTGO AI. Estoy aquí para ayudarte a gestionar la tienda, analizar las ventas, organizar el inventario y tomar mejores decisiones. ¿Qué necesitas saber?'
    : '¡Hola! Soy SMARTGO AI. Puedo ayudarte a conocer nuestros productos, comparar bebidas y encontrar recomendaciones. ¿Qué te gustaría saber?';

export default function AsistenteScreen({
  route,
  modo: modoProp,
  onClose,
  flotante = false,
}) {
  const modo =
    (modoProp || route?.params?.modo) === 'admin'
      ? 'admin'
      : 'usuario';

  const esAdmin = modo === 'admin';

  const [mensajes, setMensajes] = useState([
    {
      id: 'bienvenida',
      emisor: 'bot',
      texto: mensajeInicial(modo),
    },
  ]);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const enviarMensaje = async (valor = texto) => {
    const pregunta = String(valor || '').trim();

    if (!pregunta || enviando) return;

    setTexto('');

    const mensajeUsuario = {
      id: `${Date.now()}-user`,
      emisor: 'usuario',
      texto: pregunta,
    };

    const historialActualizado = [
      ...mensajes,
      mensajeUsuario,
    ];

    setMensajes(historialActualizado);
    setEnviando(true);

    try {
      const historial = historialActualizado
        .slice(-12)
        .map((mensaje) => ({
          emisor: mensaje.emisor,
          texto: mensaje.texto,
        }));

      const respuestaServidor = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pregunta,
          modo,
          historial,
        }),
      });

      const resultado = await respuestaServidor.json();

      if (!respuestaServidor.ok) {
        throw new Error(
          resultado.error || 'No se pudo obtener una respuesta.'
        );
      }

      setMensajes((anteriores) => [
        ...anteriores,
        {
          id: `${Date.now()}-bot`,
          emisor: 'bot',
          texto: resultado.respuesta || 'No recibí una respuesta.',
        },
      ]);

    } catch (error) {
      console.log('Error al comunicarse con Gemini:', error);

      setMensajes((anteriores) => [
        ...anteriores,
        {
          id: `${Date.now()}-error`,
          emisor: 'bot',
          texto:
            'No pude comunicarme con SMARTGO AI. Inténtalo nuevamente.',
        },
      ]);

    } finally {
      setEnviando(false);
    }
  };

  const sugerencias = esAdmin
    ? [
        '¿Cómo puedo mejorar las ventas?',
        '¿Qué productos tienen mayor demanda?',
        '¿Cómo debería organizar el inventario?',
        '¿Qué estrategias me recomiendas para la tienda?',
      ]
    : [
        '¿Qué bebida me recomiendas?',
        '¿Cuál es la diferencia entre Coca-Cola y Pepsi?',
        'Recomiéndame una bebida refrescante.',
        '¿Qué productos puedo encontrar en la tienda?',
      ];

  const limpiarConversacion = () => {
    if (enviando) return;

    setMensajes([
      {
        id: 'bienvenida',
        emisor: 'bot',
        texto: mensajeInicial(modo),
      },
    ]);

    setTexto('');
  };

  return (
    <ImageBackground
      source={FondoAzul}
      style={[
        styles.fondo,
        flotante && styles.fondoFlotante,
      ]}
      resizeMode="cover"
    >
      <View
        style={[
          styles.overlay,
          flotante && styles.overlayFlotante,
        ]}
      />

      <SafeAreaView style={styles.safe}>
        <StatusBar
          backgroundColor="#06152D"
          barStyle="light-content"
        />

        <KeyboardAvoidingView
          style={styles.contenedor}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Image
              source={MiLogo}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.headerTextos}>
              <Text style={styles.marca}>SMARTGO</Text>

              <Text style={styles.titulo}>
                {esAdmin
                  ? 'Asistente administrativo'
                  : 'Asistente de bebidas'}
              </Text>

              <Text style={styles.subtitulo}>
                {esAdmin
                  ? 'Tu asistente inteligente'
                  : 'Recomendaciones para ti'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refresh}
              onPress={limpiarConversacion}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityLabel="Nueva conversación"
            >
              <MaterialIcons
                name="refresh"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {flotante && (
              <TouchableOpacity
                style={styles.cerrar}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Cerrar asistente"
              >
                <MaterialIcons
                  name="close"
                  size={23}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.estadoDatos}>
            <MaterialIcons
              name="auto-awesome"
              size={17}
              color="#86EFAC"
            />

            <Text style={styles.estadoDatosTexto}>
              SMARTGO AI disponible
            </Text>
          </View>

          <FlatList
            style={styles.lista}
            contentContainerStyle={styles.listaContenido}
            data={mensajes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.filaMensaje,
                  item.emisor === 'usuario'
                    ? styles.filaUsuario
                    : styles.filaBot,
                ]}
              >
                {item.emisor === 'bot' && (
                  <View style={styles.avatar}>
                    <MaterialIcons
                      name="smart-toy"
                      size={18}
                      color="#FFFFFF"
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.burbuja,
                    item.emisor === 'usuario'
                      ? styles.burbujaUsuario
                      : styles.burbujaBot,
                  ]}
                >
                  <Text
                    style={[
                      styles.mensaje,
                      item.emisor === 'usuario' &&
                        styles.mensajeUsuario,
                    ]}
                  >
                    {item.texto}
                  </Text>
                </View>
              </View>
            )}
            ListFooterComponent={
              enviando ? (
                <View style={styles.escribiendo}>
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />

                  <Text style={styles.escribiendoTexto}>
                    Preparando respuesta...
                  </Text>
                </View>
              ) : null
            }
          />

          <View style={styles.sugerencias}>
            {sugerencias.map((sugerencia) => (
              <TouchableOpacity
                key={sugerencia}
                style={styles.chip}
                onPress={() => enviarMensaje(sugerencia)}
                disabled={enviando}
              >
                <Text style={styles.chipTexto}>
                  {sugerencia}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.compositor}>
            <TextInput
              style={styles.input}
              value={texto}
              onChangeText={setTexto}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={300}
            />

            <TouchableOpacity
              style={[
                styles.enviar,
                (!texto.trim() || enviando) &&
                  styles.enviarDeshabilitado,
              ]}
              onPress={() => enviarMensaje()}
              disabled={!texto.trim() || enviando}
            >
              <MaterialIcons
                name="send"
                size={21}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },

  fondoFlotante: {
    borderRadius: 22,
    overflow: 'hidden',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,18,42,0.58)',
  },

  overlayFlotante: {
    borderRadius: 22,
  },

  safe: {
    flex: 1,
  },

  contenedor: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
  },

  logo: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
  },

  headerTextos: {
    flex: 1,
    marginLeft: 12,
  },

  marca: {
    color: '#7DD3FC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  titulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },

  subtitulo: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },

  refresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cerrar: {
    width: 36,
    height: 36,
    marginLeft: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  estadoDatos: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  estadoDatosTexto: {
    color: '#E2E8F0',
    fontSize: 11,
    marginLeft: 6,
  },

  lista: {
    flex: 1,
  },

  listaContenido: {
    padding: 16,
    paddingBottom: 12,
  },

  filaMensaje: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 13,
  },

  filaBot: {
    justifyContent: 'flex-start',
  },

  filaUsuario: {
    justifyContent: 'flex-end',
  },

  avatar: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: '#1673B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  burbuja: {
    maxWidth: '84%',
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },

  burbujaBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },

  burbujaUsuario: {
    backgroundColor: '#1769C2',
    borderBottomRightRadius: 4,
  },

  mensaje: {
    color: '#172B4D',
    fontSize: 14,
    lineHeight: 20,
  },

  mensajeUsuario: {
    color: '#FFFFFF',
  },

  escribiendo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 36,
    marginBottom: 10,
  },

  escribiendoTexto: {
    color: '#E2E8F0',
    fontSize: 12,
    marginLeft: 8,
  },

  sugerencias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 7,
  },

  chip: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  chipTexto: {
    color: '#FFFFFF',
    fontSize: 11,
  },

  compositor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
    paddingLeft: 14,
    paddingRight: 6,
    minHeight: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },

  input: {
    flex: 1,
    maxHeight: 90,
    paddingVertical: 10,
    color: '#172B4D',
    fontSize: 14,
  },

  enviar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: '#1769C2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  enviarDeshabilitado: {
    opacity: 0.5,
  },
});
