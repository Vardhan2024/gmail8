import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SwipeScreen from './src/screens/SwipeScreen';
import ReplyScreen from './src/screens/ReplyScreen';
import ComposeScreen from './src/screens/ComposeScreen';
import { GmailAuthProvider } from './src/GmailAuthContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Animated } from 'react-native';

const Stack = createStackNavigator();

const slideTransition = {
    cardStyleInterpolator: ({ current, layouts }) => ({
        cardStyle: {
            transform: [
                {
                    translateX: current.progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [layouts.screen.width, 0],
                    }),
                },
            ],
        },
    }),
    transitionSpec: {
        open: { animation: 'timing', config: { duration: 350 } },
        close: { animation: 'timing', config: { duration: 300 } },
    },
};

export default function App() {
    return (
        <GmailAuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <NavigationContainer>
                        <Stack.Navigator initialRouteName="Swipe" screenOptions={{ headerShown: false, ...slideTransition }}>
                            <Stack.Screen name="Swipe" component={SwipeScreen} />
                            <Stack.Screen name="Reply" component={ReplyScreen} />
                            <Stack.Screen name="Compose" component={ComposeScreen} />
                        </Stack.Navigator>
                    </NavigationContainer>
                    <StatusBar style="auto" />
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </GmailAuthProvider>
    );
} 