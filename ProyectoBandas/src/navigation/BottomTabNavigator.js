// src/navigation/BottomTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminScreen from '../screens/AdminSreen';
import UsuarioScreen from '../screens/UsuarioScreen';
import ProfileScreen from '../screens/ProfileScreen';

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
        name="Admin"
        component={AdminScreen}
        options={{
          tabBarIcon: () => (
            <MaterialCommunityIcons name="garage" size={24} color="black" />
          )
        }}
      />
      <Tab.Screen
        name="Usuario"
        component={UsuarioScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="living" size={24} color="black" />
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="kitchen" size={24} color="black" />
          )
        }}
      />
    </Tab.Navigator>
  );
}