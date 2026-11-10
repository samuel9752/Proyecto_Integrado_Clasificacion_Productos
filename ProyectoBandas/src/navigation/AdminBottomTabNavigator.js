// src/navigation/BottomTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AdminProfileScreen from '../screens/Admin/AdminProfileScreen';
import HitorialVentasScreen from '../screens/Admin/HistorialVentasScreen';
import ExistenciasScreen from '../screens/Admin/ExistenciasScreen';
import AdminScreen from '../screens/Admin/AdminScreen';
import DetectorScreen from '../screens/Admin/DetectorScreen';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';

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
        name="Ventas"
        component={HitorialVentasScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="living" size={24} color="black" />
          )
        }}
      />
      <Tab.Screen
        name="Existencias"
        component={ExistenciasScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="kitchen" size={24} color="black" />
          )
        }}
      />
       <Tab.Screen
        name="Sobrecalentamiento"
        component={DetectorScreen}
        options={{
          tabBarIcon: () => (
            <AntDesign name="fire" size={24} color="black" />
          )
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AdminProfileScreen}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="kitchen" size={24} color="black" />
          )
        }}
      />
    </Tab.Navigator>
  );
}