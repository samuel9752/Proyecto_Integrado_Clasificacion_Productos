import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/Login';
import RegisterScreen from '../screens/Register';
import BottomTabNavigator from '../navigation/BottomTabNavigator'

// Creamos nuestro Stack Navigator.
const Stack = createNativeStackNavigator();

export default function LoginStackNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name='Login'
                component={LoginScreen}
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name='Register'
                component={RegisterScreen}
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name='BottomTabNavigator'
                component={BottomTabNavigator}
                options={{
                    headerShown: false
                }}
            />
        </Stack.Navigator>
    )
}