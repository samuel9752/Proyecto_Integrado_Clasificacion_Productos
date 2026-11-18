import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import UserScreen from '../screens/Usuario/UserScreen';
import ComprasUserScreen from '../screens/Usuario/ComprasUserScreen';
import CarritoUserScreen from '../screens/Usuario/CarritoUserScreen';
import UserProfileScreen from '../screens/Usuario/UserProfileScreen';

import FloatingAssistant from '../components/FloatingAssistant';

import { CartProvider } from '../context/CartContext';

const Tab = createBottomTabNavigator();

export default function UserBottomTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <CartProvider>
      <View style={styles.contenedor}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#C51F2B',
            tabBarInactiveTintColor: '#64748B',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              height: 65 + insets.bottom,
              paddingBottom: Math.max(insets.bottom, 8),
              paddingTop: 8,
              borderTopColor: '#E5E7EB',
            },
          }}
        >
          <Tab.Screen
            name="Usuario"
            component={UserScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons
                  name="home"
                  color={color}
                  size={size + 4}
                />
              ),
            }}
          />

          <Tab.Screen
            name="Compras"
            component={ComprasUserScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons
                  name="shopping-bag"
                  color={color}
                  size={size + 4}
                />
              ),
            }}
          />

          <Tab.Screen
            name="Carrito"
            component={CarritoUserScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons
                  name="shopping-cart"
                  color={color}
                  size={size + 4}
                />
              ),
            }}
          />

          <Tab.Screen
            name="Perfil"
            component={UserProfileScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons
                  name="person"
                  color={color}
                  size={size + 4}
                />
              ),
            }}
          />
        </Tab.Navigator>

        {/* Burbuja del asistente para usuarios */}
        <FloatingAssistant modo="usuario" />
      </View>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
});