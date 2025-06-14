import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {useAppSelector} from '@store/index';
import {WelcomeScreen} from '@screens/WelcomeScreen';
import {ConnectionScreen} from '@screens/ConnectionScreen';
import {SessionsScreen} from '@screens/SessionsScreen';
import {TerminalScreen} from '@screens/TerminalScreen';
import {SettingsScreen} from '@screens/SettingsScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Connection: undefined;
  MainTabs: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Sessions: undefined;
  Terminal: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Sessions') {
            iconName = focused ? 'list' : 'list';
          } else if (route.name === 'Terminal') {
            iconName = focused ? 'terminal' : 'terminal';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen 
        name="Sessions" 
        component={SessionsScreen}
        options={{ title: 'セッション' }}
      />
      <Tab.Screen 
        name="Terminal" 
        component={TerminalScreen}
        options={{ title: 'ターミナル' }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const isConnected = useAppSelector(state => state.auth.isConnected);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      
      {!isConnected ? (
        <>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              title: 'Claude Code Mobile',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Connection"
            component={ConnectionScreen}
            options={{
              title: 'サーバー接続',
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '設定',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};