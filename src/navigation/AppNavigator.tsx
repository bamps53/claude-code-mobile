/**
 * Main navigation component for the Claude Code Mobile application
 * @description Handles navigation between screens and authentication state
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppStore } from '../store';
import { NavigationScreens } from '../types';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import ConnectionScreen from '../screens/ConnectionScreen';
import SessionsScreen from '../screens/SessionsScreen';
import TerminalScreen from '../screens/TerminalScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Import MaterialCommunityIcons for tab icons
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Stack = createStackNavigator<NavigationScreens>();
const Tab = createBottomTabNavigator();

/**
 * Main authenticated navigation with bottom tabs
 * @returns React component with authenticated navigation structure
 */
function AuthenticatedTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { paddingBottom: 8, height: 60 },
      }}
    >
      <Tab.Screen
        name="Connections"
        component={ConnectionScreen}
        options={{
          tabBarLabel: 'Connections',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="server" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sessions"
        component={SessionsScreen}
        options={{
          tabBarLabel: 'Sessions',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="console" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cog" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Main application navigator
 * @description Routes between authentication and main app based on auth state
 * @returns Navigation container with appropriate screen stack
 */
export default function AppNavigator() {
  const { isAuthenticated } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
        ) : (
          <>
            <Stack.Group>
              <Stack.Screen name="Main" component={AuthenticatedTabs} />
              <Stack.Screen
                name="Terminal"
                component={TerminalScreen}
                options={{
                  headerShown: true,
                  title: 'Terminal Session',
                  headerBackTitle: 'Back',
                }}
              />
            </Stack.Group>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
