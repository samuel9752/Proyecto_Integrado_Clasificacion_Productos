// src/navigation/BottomTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import UserScreen from '../screens/Usuario/UserScreen';
import CarritoUserScreen from '../screens/Usuario/CarritoUserScreen';
import ComprasUserScreen from '../screens/Usuario/ComprasUserScreen';
import UserProfileScreen from '../screens/Usuario/UserProfileScreen';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0fbbe6',
        tabBarInactiveTintColor: '#111f7a',
        tabBarStyle: {
          backgroundColor: '#c8c8cb'
        },
        tabBarShowLabel: false
      }}
    >
      <Tab.Screen
        name="Usuario"
        component={UserScreen}
        options={{
          tabBarIcon: () => (
            <MaterialCommunityIcons name="garage" size={24} color="black" />
          )
        }}
      />
      <Tab.Screen
        name="Compras"
        component={ComprasUserScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="kitchen" size={24} color="black" />
          )
        }}
      />
      <Tab.Screen
        name="Comprar"
        component={CarritoUserScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="living" size={24} color="black" />
          )
        }}
      />
      
      <Tab.Screen
        name="Perfil"
        component={UserProfileScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="kitchen" size={24} color="black" />
          )
        }}
      />
    </Tab.Navigator>
  );
}