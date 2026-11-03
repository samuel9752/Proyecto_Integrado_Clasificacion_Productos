// src/navigation/BottomTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Admin from '../screens/Admin';
import Usuario from '../screens/Usuario'
import Profile from '../screens/Profile'
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
        component={Admin}
        options={{
          tabBarIcon: () => (
            <MaterialCommunityIcons name="garage" size={24} color="black" />
          )
        }}
      />

      <Tab.Screen
        name="Usuario"
        component={Usuario}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="living" size={24} color="black" />
          )
        }}
      />

      
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: () => (
            <MaterialIcons name="kitchen" size={24} color="black" />
          )
        }}
      />
    </Tab.Navigator>
  );
}