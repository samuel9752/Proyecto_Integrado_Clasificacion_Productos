import { NavigationContainer } from '@react-navigation/native';
import LoginStackNavigator from './LoginStackNavigator'

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <LoginStackNavigator/>
        </NavigationContainer>
    );
}