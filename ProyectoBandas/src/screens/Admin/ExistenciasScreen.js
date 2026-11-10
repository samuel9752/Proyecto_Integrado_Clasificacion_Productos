
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const bandas = [
  {
    id: 1,
    nombre: 'Coca-Cola',
    presentacion: 'Lata · 355 ml',
    cantidad: 12,
    capacidad: 20,
    color: '#E5252A',
    fondo: '#FFF0F0',
    imagen: 'COCA-COLA LATA',
  },
  {
    id: 2,
    nombre: 'Coca-Cola',
    presentacion: 'Botella · 500 ml',
    cantidad: 8,
    capacidad: 20,
    color: '#B91C1C',
    fondo: '#FFF1F1',
    imagen: 'COCA-COLA BOTELLA',
  },
  {
    id: 3,
    nombre: 'Pepsi',
    presentacion: 'Lata · 355 ml',
    cantidad: 0,
    capacidad: 20,
    color: '#005CB4',
    fondo: '#EEF5FF',
    imagen: 'PEPSI LATA',
  },
];

function BandaCard({ banda }) {
  const porcentaje =
    (banda.cantidad / banda.capacidad) * 100;

  let estado = 'Disponible';
  let colorEstado = '#16A34A';
  let fondoEstado = '#DCFCE7';

  if (banda.cantidad === 0) {
    estado = 'Agotada';
    colorEstado = '#DC2626';
    fondoEstado = '#FEE2E2';
  } else if (banda.cantidad === banda.capacidad) {
    estado = 'Llena';
    colorEstado = '#2563EB';
    fondoEstado = '#DBEAFE';
  } else if (banda.cantidad <= 5) {
    estado = 'Poca existencia';
    colorEstado = '#D97706';
    fondoEstado = '#FEF3C7';
  }

  return (
    <View style={styles.card}>

      <View style={styles.cardHeader}>
        <Text style={styles.bandNumber}>
          BANDA 0{banda.id}
        </Text>

        <View
          style={[
            styles.status,
            { backgroundColor: fondoEstado },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: colorEstado },
            ]}
          >
            {estado}
          </Text>
        </View>
      </View>

      <View style={styles.productContainer}>

        {/* Espacio para imagen del producto */}
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: banda.fondo },
          ]}
        >
          <Text
            style={[
              styles.imageText,
              { color: banda.color },
            ]}
          >
            {banda.imagen}
          </Text>
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>
            {banda.nombre}
          </Text>

          <Text style={styles.presentation}>
            {banda.presentacion}
          </Text>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantity}>
              {banda.cantidad}
            </Text>

            <Text style={styles.capacity}>
              / {banda.capacidad} unidades
            </Text>
          </View>
        </View>

      </View>

      <View style={styles.progressBackground}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${porcentaje}%`,
              backgroundColor: banda.color,
            },
          ]}
        />
      </View>

      <Text style={styles.percentage}>
        {porcentaje}% de capacidad
      </Text>

    </View>
  );
}

export default function ExistenciasScreen() {
  const total = bandas.reduce(
    (suma, banda) => suma + banda.cantidad,
    0
  );

  const bandasActivas = bandas.filter(
    banda => banda.cantidad > 0
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >

        {/* Encabezado */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Stock en tiempo real
            </Text>

            <Text style={styles.subtitle}>
              Control de inventario
            </Text>
          </View>
        </View>

        {/* Resumen */}
        <View style={styles.summaryContainer}>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Productos disponibles
            </Text>

            <Text style={styles.summaryNumber}>
              {total}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              Bandas activas
            </Text>

            <Text style={styles.summaryNumber}>
              {bandasActivas}/3
            </Text>
          </View>

        </View>

        {/* Inventario */}
        <Text style={styles.sectionTitle}>
          Inventario por banda
        </Text>

        {bandas.map(banda => (
          <BandaCard
            key={banda.id}
            banda={banda}
          />
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },

  container: {
    padding: 20,
    paddingBottom: 35,
  },

  header: {
    marginBottom: 22,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#172033',
  },

  subtitle: {
    fontSize: 14,
    color: '#788397',
    marginTop: 5,
  },

  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 15,
    elevation: 2,
  },

  summaryLabel: {
    color: '#788397',
    fontSize: 12,
  },

  summaryNumber: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#172033',
    marginTop: 7,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#172033',
    marginBottom: 15,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 17,
  },

  bandNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#788397',
    letterSpacing: 1,
  },

  status: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 18,
  },

  imagePlaceholder: {
    width: 90,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },

  imageText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  productInfo: {
    flex: 1,
  },

  productName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#172033',
  },

  presentation: {
    fontSize: 12,
    color: '#788397',
    marginTop: 5,
  },

  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },

  quantity: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#172033',
  },

  capacity: {
    fontSize: 12,
    color: '#788397',
    marginLeft: 4,
  },

  progressBackground: {
    height: 9,
    backgroundColor: '#E8ECF2',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressBar: {
    height: 9,
    borderRadius: 10,
  },

  percentage: {
    fontSize: 11,
    color: '#788397',
    marginTop: 8,
  },

});

