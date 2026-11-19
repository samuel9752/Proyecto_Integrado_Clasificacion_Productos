import React, { useCallback, useEffect, useMemo, useState } from 'react';

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

import { getApps, initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import {
  collection,
  getDocs,
  getFirestore,
  query,
  where,
} from 'firebase/firestore';

import { firebaseConfig } from '../firebase/FirebaseConfig';

import FondoAzul from '../../assets/Fondo_2.jpeg';
import MiLogo from '../../assets/logo.jpeg';

const app = getApps().length
  ? getApps()[0]
  : initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);

const API_URL = 'http://192.168.1.194:3001/api/asistente';

const PRODUCTOS = {
  COCA_LATA: {
    nombre: 'Coca-Cola de lata',
    precio: 8,
  },

  COCA_BOTELLA: {
    nombre: 'Coca-Cola de botella',
    precio: 12,
  },

  PEPSI_LATA: {
    nombre: 'Pepsi de lata',
    precio: 7,
  },
};

const mensajeInicial = (modo) =>
  modo === 'admin'
    ? '¡Hola! Soy el asistente de SMARTGO. Puedo analizar las ventas recientes y las existencias para estimar cuándo podría agotarse cada bebida.'
    : '¡Hola! Puedo revisar tus compras anteriores y ayudarte a elegir una bebida. Pregúntame qué te recomiendo.';

const fechaDeVenta = (valor) => {
  if (!valor) return null;

  if (typeof valor.toDate === 'function') {
    return valor.toDate();
  }

  const fecha = new Date(valor);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const cantidadVenta = (venta) =>
  Math.max(0, Number(venta.cantidad) || 1);

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

  const [uid, setUid] = useState(auth.currentUser?.uid || null);

  const [mensajes, setMensajes] = useState([
    {
      id: 'bienvenida',
      emisor: 'bot',
      texto: mensajeInicial(modo),
    },
  ]);

  const [texto, setTexto] = useState('');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [ventas, setVentas] = useState([]);
  const [inventario, setInventario] = useState({});

  const [errorDatos, setErrorDatos] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      setUid(usuario?.uid || null);
    });

    return unsubscribe;
  }, []);

  const cargarDatos = useCallback(async () => {
    setCargandoDatos(true);
    setErrorDatos('');

    try {
      let consultaVentas;

      if (esAdmin) {
        consultaVentas = collection(db, 'ventas');
      } else {
        if (!uid) {
          setVentas([]);
          setInventario({});

          setErrorDatos(
            'Inicia sesión para consultar tu historial de compras.'
          );

          return;
        }

        consultaVentas = query(
          collection(db, 'ventas'),
          where('usuario.uid', '==', uid)
        );
      }

      const [resultadoVentas, resultadoInventario] =
        await Promise.all([
          getDocs(consultaVentas),

          esAdmin
            ? getDocs(collection(db, 'inventario'))
            : Promise.resolve(null),
        ]);

      setVentas(
        resultadoVentas.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }))
      );

      if (resultadoInventario) {
        const existencias = {};

        resultadoInventario.docs.forEach((documento) => {
          const datos = documento.data();

          existencias[documento.id] = Math.max(
            0,
            Number(datos.cantidad) || 0
          );
        });

        setInventario(existencias);
      }
    } catch (error) {
      console.log('Error al cargar datos del asistente:', error);

      setErrorDatos(
        'No pude consultar los datos de Firebase. Revisa la conexión y los permisos de lectura.'
      );
    } finally {
      setCargandoDatos(false);
    }
  }, [esAdmin, uid]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const resumenAdmin = useMemo(() => {
    const ahora = new Date();

    const haceSieteDias = new Date(
      ahora.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    return Object.keys(PRODUCTOS).map((id) => {
      const unidades = ventas.reduce((total, venta) => {
        if (venta.producto !== id) return total;

        const fecha = fechaDeVenta(venta.fecha);

        if (!fecha || fecha < haceSieteDias || fecha > ahora) {
          return total;
        }

        return total + cantidadVenta(venta);
      }, 0);

      const promedio = unidades / 7;

      const stock = inventario[id] ?? null;

      return {
        id,
        nombre: PRODUCTOS[id].nombre,
        stock,
        unidades,
        promedio,
        dias:
          stock !== null && promedio > 0
            ? stock / promedio
            : null,
      };
    });
  }, [ventas, inventario]);

  const resumenUsuario = useMemo(() => {
    const conteo = {};

    ventas.forEach((venta) => {
      if (!PRODUCTOS[venta.producto]) return;

      conteo[venta.producto] =
        (conteo[venta.producto] || 0) + cantidadVenta(venta);
    });

    return Object.entries(conteo).sort(
      (a, b) => b[1] - a[1]
    );
  }, [ventas]);

  const responderAdmin = (pregunta) => {
    const textoPregunta = pregunta.toLowerCase();

    if (errorDatos) return errorDatos;

    if (!ventas.length) {
      return 'Todavía no hay ventas registradas para calcular una tendencia. Cuando existan ventas, podré estimar el consumo usando los últimos siete días.';
    }

    const resultados = resumenAdmin.map((item) => {
      if (item.stock === null) {
        return `${item.nombre}: no encontré existencias registradas en Firebase.`;
      }

      if (item.promedio === 0) {
        return `${item.nombre}: quedan ${item.stock} unidades y no se registraron ventas en los últimos siete días. No hay suficiente actividad reciente para estimar agotamiento.`;
      }

      if (item.dias <= 1) {
        return `${item.nombre}: quedan ${item.stock} unidades. Con un promedio de ${item.promedio.toFixed(1)} ventas al día, podría agotarse en aproximadamente ${item.dias.toFixed(1)} días.`;
      }

      return `${item.nombre}: quedan ${item.stock} unidades. Promedio de ${item.promedio.toFixed(1)} ventas al día; estimación de agotamiento: ${item.dias.toFixed(1)} días.`;
    });

    if (
      textoPregunta.includes('coca') ||
      textoPregunta.includes('pepsi')
    ) {
      const encontrado = resumenAdmin.find(
        (item) =>
          textoPregunta.includes(
            item.nombre.toLowerCase().split(' ')[0]
          ) &&
          (
            textoPregunta.includes('botella')
              ? item.id === 'COCA_BOTELLA'
              : textoPregunta.includes('lata')
                ? item.id !== 'COCA_BOTELLA'
                : true
          )
      );

      if (encontrado) {
        return resultados[resumenAdmin.indexOf(encontrado)];
      }
    }

    return `Este es el análisis de los últimos siete días:\n\n${resultados.join('\n\n')}\n\nEs una estimación basada en el promedio reciente; las ventas pueden variar y no garantiza la fecha exacta de agotamiento.`;
  };

  const responderUsuario = (pregunta) => {
    const textoPregunta = pregunta.toLowerCase();

    if (errorDatos) return errorDatos;

    if (!ventas.length) {
      return 'Aún no encuentro compras anteriores asociadas a tu cuenta. Cuando realices tu primera compra podré identificar tus preferencias y recomendarte bebidas.';
    }

    const favorita = resumenUsuario[0];

    const productoFavorito = PRODUCTOS[favorita[0]];

    const totalCompras = resumenUsuario.reduce(
      (suma, item) => suma + item[1],
      0
    );

    if (
      textoPregunta.includes('historial') ||
      textoPregunta.includes('compr')
    ) {
      return `He encontrado ${totalCompras} unidad(es) comprada(s) en tu historial. Tu bebida más comprada es ${productoFavorito.nombre}, con ${favorita[1]} unidad(es).`;
    }

    const alternativa = Object.keys(PRODUCTOS).find(
      (id) => id !== favorita[0]
    );

    return `Según tu historial, tu bebida más elegida es ${productoFavorito.nombre} (${favorita[1]} unidad(es).).\n\nMi recomendación es que pruebes ${PRODUCTOS[alternativa].nombre}. Así puedes variar tu elección. La sugerencia se basa en tus compras registradas, no en una evaluación de tus gustos fuera de la aplicación.`;
  };


  const enviarMensaje = async (valor = texto) => {
    const pregunta = String(valor || '').trim();

    if (!pregunta || enviando || cargandoDatos) return;

    setTexto('');

    setMensajes((anteriores) => [
      ...anteriores,
      {
        id: `${Date.now()}-user`,
        emisor: 'usuario',
        texto: pregunta,
      },
    ]);

    setEnviando(true);

    try {
      if (errorDatos) {
        throw new Error(errorDatos);
      }

      // Preparar los datos que recibirá Gemini.
      const convertirVenta = (venta) => {
        const fecha = fechaDeVenta(venta.fecha);

        return {
          producto: venta.producto || '',
          nombre: venta.nombre || '',
          presentacion: venta.presentacion || '',
          precio: Number(venta.precio) || 0,
          cantidad: cantidadVenta(venta),
          total: Number(venta.total) || 0,
          fecha: fecha ? fecha.toISOString() : null,
        };
      };

      const datosAsistente = esAdmin
        ? {
          tipo: 'administrador',
          resumenInventario: resumenAdmin,
          inventario,
          ventasRecientes: ventas
            .slice(0, 30)
            .map(convertirVenta),
          totalVentasConsultadas: ventas.length,
        }
        : {
          tipo: 'usuario',
          resumenCompras: resumenUsuario.map(([producto, cantidad]) => ({
            producto,
            nombre: PRODUCTOS[producto]?.nombre || producto,
            cantidad,
          })),
          historialCompras: ventas
            .slice(0, 30)
            .map(convertirVenta),
          totalComprasConsultadas: ventas.length,
        };

      const respuestaServidor = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pregunta,
          modo,
          datos: datosAsistente,
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
            error.message ||
            'No pude comunicarme con el asistente. Inténtalo nuevamente.',
        },
      ]);

    } finally {
      setEnviando(false);
    }
  };


  const sugerencias = esAdmin
    ? [
      '¿Qué bebida está por agotarse?',
      'Analiza todas las existencias',
    ]
    : [
      '¿Qué bebida me recomiendas?',
      '¿Qué he comprado anteriormente?',
    ];

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
                  ? 'Asistente de existencias'
                  : 'Asistente de bebidas'}
              </Text>

              <Text style={styles.subtitulo}>
                {esAdmin
                  ? 'Análisis de ventas e inventario'
                  : 'Recomendaciones para ti'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.refresh}
              onPress={cargarDatos}
              disabled={cargandoDatos}
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

          {cargandoDatos ? (
            <View style={styles.estadoCarga}>
              <ActivityIndicator
                color="#FFFFFF"
                size="large"
              />

              <Text style={styles.textoCarga}>
                Consultando tus datos...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.estadoDatos}>
                <MaterialIcons
                  name={errorDatos ? 'cloud-off' : 'cloud-done'}
                  size={17}
                  color={errorDatos ? '#FCA5A5' : '#86EFAC'}
                />

                <Text style={styles.estadoDatosTexto}>
                  {errorDatos
                    ? 'Datos no disponibles'
                    : esAdmin
                      ? `${ventas.length} ventas consultadas`
                      : `${ventas.length} compras encontradas`}
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
                  style={styles.enviar}
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
            </>
          )}
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

  estadoCarga: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCarga: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 13,
  },
});