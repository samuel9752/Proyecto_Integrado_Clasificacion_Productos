import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminBottomTabNavigator from './AdminBottomTabNavigator'
import UserBottomTabNavigator from './UserBottomTabNavigator';

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
                name='AdminBottomTabNavigator'
                component={AdminBottomTabNavigator}
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name='UserBottomTabNavigator'
                component={UserBottomTabNavigator}
                options={{
                    headerShown: false
                }}
            />
            
        </Stack.Navigator>
    )
}