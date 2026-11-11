
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';

const API_URL = 'http://192.168.1.120:3000/ventas';

export default function HistorialVentasScreen() {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  const cargarVentas = useCallback(async () => {
    try {
      setError('');

      const respuesta = await fetch(API_URL);

      if (!respuesta.ok) {
        throw new Error('Error al consultar las ventas');
      }

      const datos = await respuesta.json();
      setVentas(Array.isArray(datos) ? datos : []);
    } catch (e) {
      setError('No se pudo conectar con el servidor. Comprueba que esté encendido y que uses la IP correcta.');
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const totalIngresos = ventas.reduce((suma, venta) => {
    return suma + (Number(venta.precio) || 0) *
      (Number(venta.cantidad) || 1);
  }, 0);

  const totalBebidas = ventas.reduce((suma, venta) => {
    return suma + (Number(venta.cantidad) || 1);
  }, 0);

  // Calcula el total de bebidas compradas por cada usuario.
  const comprasPorUsuario = {};

  ventas.forEach((venta) => {
    const uid = venta.usuario?.uid;

    if (!uid) return;

    comprasPorUsuario[uid] =
      (comprasPorUsuario[uid] || 0) +
      (Number(venta.cantidad) || 1);
  });

  const fechaTexto = (fecha) => {
    if (!fecha) return 'Fecha no disponible';

    const valor = fecha.toDate
      ? fecha.toDate()
      : new Date(fecha);

    if (isNaN(valor.getTime())) return 'Fecha no disponible';

    return valor.toLocaleString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const colorProducto = (producto) =>
    producto?.includes('PEPSI') ? '#1769AA' : '#D71920';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => {
              setActualizando(true);
              cargarVentas();
            }}
            colors={['#D71920']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.marca}>SMARTGO</Text>
          <Text style={styles.titulo}>Historial de ventas</Text>
          <Text style={styles.subtitulo}>
            Control de ventas y clientes
          </Text>
        </View>

        <View style={styles.resumen}>
          <View style={styles.tarjetaRoja}>
            <Text style={styles.etiquetaBlanca}>VENTAS REGISTRADAS</Text>
            <Text style={styles.numeroBlanco}>{ventas.length}</Text>
            <Text style={styles.detalleBlanco}>Transacciones</Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>INGRESOS ACUMULADOS</Text>
            <Text style={styles.ingresos}>Q{totalIngresos.toFixed(2)}</Text>
            <Text style={styles.detalle}>Total recaudado</Text>
          </View>

          <View style={styles.tarjeta}>
            <Text style={styles.etiqueta}>BEBIDAS VENDIDAS</Text>
            <Text style={styles.numero}>{totalBebidas}</Text>
            <Text style={styles.detalle}>Unidades vendidas</Text>
          </View>
        </View>

        <View style={styles.encabezadoLista}>
          <View>
            <Text style={styles.tituloSeccion}>Ventas realizadas</Text>
            <Text style={styles.detalle}>Detalle de cada compra</Text>
          </View>

          <TouchableOpacity
            style={styles.botonActualizar}
            onPress={() => {
              setActualizando(true);
              cargarVentas();
            }}
          >
            <Text style={styles.textoActualizar}>Actualizar</Text>
          </TouchableOpacity>
        </View>

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#D71920"
            style={{ marginTop: 35 }}
          />
        ) : error ? (
          <View style={styles.vacio}>
            <Text style={styles.error}>{error}</Text>
            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={cargarVentas}
            >
              <Text style={styles.textoBoton}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : ventas.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>Todavía no hay ventas</Text>
            <Text style={styles.detalle}>
              Las compras aparecerán aquí cuando Arduino confirme una entrega
              y el servidor las registre.
            </Text>
          </View>
        ) : (
          ventas.map((venta, index) => {
            const usuario = venta.usuario || {};
            const uid = usuario.uid;
            const bebidasUsuario = uid
              ? comprasPorUsuario[uid] || 0
              : null;

            return (
              <View
                key={venta.id || index}
                style={styles.venta}
              >
                <View style={styles.fila}>
                  <View
                    style={[
                      styles.icono,
                      { backgroundColor: colorProducto(venta.producto) },
                    ]}
                  >
                    <Text style={styles.iconoTexto}>
                      {venta.producto?.includes('PEPSI') ? 'P' : 'C'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombreBebida}>
                      {venta.nombre || venta.producto || 'Bebida'}
                    </Text>
                    <Text style={styles.presentacion}>
                      {venta.presentacion || 'Presentación no especificada'}
                    </Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.precio}>
                      Q{(
                        (Number(venta.precio) || 0) *
                        (Number(venta.cantidad) || 1)
                      ).toFixed(2)}
                    </Text>
                    <Text style={styles.detalle}>
                      Q{Number(venta.precio || 0).toFixed(2)} c/u
                    </Text>
                  </View>
                </View>

                <View style={styles.separador} />

                <Text style={styles.dato}>
                  Cantidad comprada: {Number(venta.cantidad) || 1}
                </Text>
                <Text style={styles.dato}>
                  Fecha: {fechaTexto(venta.fecha)}
                </Text>

                <View style={styles.cliente}>
                  <Text style={styles.clienteTitulo}>
                    Información del comprador
                  </Text>
                  <Text style={styles.dato}>
                    Nombre: {usuario.nombre || 'No registrado'}
                  </Text>
                  <Text style={styles.dato}>
                    Correo: {usuario.correo || 'No registrado'}
                  </Text>
                  <Text style={styles.dato}>
                    UID: {usuario.uid || 'No asociado'}
                  </Text>
                  <Text style={styles.totalCliente}>
                    Bebidas compradas por este usuario: {
                      bebidasUsuario === null
                        ? 'No disponible'
                        : bebidasUsuario
                    }
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.pie}>
          SMARTGO · Sistema inteligente de bebidas
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    backgroundColor: '#171717',
    paddingTop: 55,
    paddingBottom: 28,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  marca: {
    color: '#E21B23',
    fontWeight: '900',
    letterSpacing: 3,
    fontSize: 14,
  },
  titulo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    marginTop: 12,
  },
  subtitulo: { color: '#BBBBBB', marginTop: 6, fontSize: 13 },
  resumen: { padding: 16, gap: 11 },
  tarjetaRoja: {
    backgroundColor: '#D71920',
    padding: 18,
    borderRadius: 15,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 15,
    elevation: 2,
  },
  etiquetaBlanca: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  etiqueta: { color: '#777777', fontSize: 11, fontWeight: 'bold' },
  numeroBlanco: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: 'bold',
    marginTop: 7,
  },
  numero: {
    color: '#171717',
    fontSize: 27,
    fontWeight: 'bold',
    marginTop: 7,
  },
  ingresos: {
    color: '#159447',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 7,
  },
  detalleBlanco: { color: '#F2DADA', fontSize: 11, marginTop: 4 },
  detalle: { color: '#888888', fontSize: 11, marginTop: 4 },
  encabezadoLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 14,
  },
  tituloSeccion: {
    color: '#171717',
    fontSize: 19,
    fontWeight: 'bold',
  },
  botonActualizar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#E3E3E3',
  },
  textoActualizar: { color: '#D71920', fontWeight: 'bold', fontSize: 12 },
  venta: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginBottom: 13,
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icono: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoTexto: { color: '#FFFFFF', fontSize: 21, fontWeight: 'bold' },
  nombreBebida: { color: '#222222', fontSize: 14, fontWeight: 'bold' },
  presentacion: { color: '#888888', fontSize: 12, marginTop: 3 },
  precio: { color: '#159447', fontSize: 16, fontWeight: 'bold' },
  separador: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: 12,
  },
  dato: { color: '#666666', fontSize: 12, marginTop: 5 },
  cliente: {
    backgroundColor: '#F6F6F6',
    padding: 12,
    borderRadius: 10,
    marginTop: 13,
  },
  clienteTitulo: {
    color: '#222222',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  totalCliente: {
    color: '#D71920',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 9,
  },
  vacio: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    padding: 25,
    borderRadius: 14,
    alignItems: 'center',
  },
  vacioTitulo: { fontSize: 16, fontWeight: 'bold', color: '#222222' },
  error: { color: '#D71920', textAlign: 'center', fontSize: 13 },
  botonReintentar: {
    backgroundColor: '#D71920',
    padding: 12,
    borderRadius: 9,
    marginTop: 15,
  },
  textoBoton: { color: '#FFFFFF', fontWeight: 'bold' },
  pie: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 10,
    marginVertical: 25,
  },
});
