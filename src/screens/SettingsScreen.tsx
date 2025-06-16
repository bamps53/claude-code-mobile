/**
 * Settings screen for app configuration
 * @description Handles user preferences, security settings, and app configuration
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  List,
  Switch,
  Button,
  Divider,
  useTheme,
  Title,
  Card,
  Text,
} from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppStore } from '../store';

/**
 * Settings screen component
 * @description Provides interface for managing app settings and preferences
 * @returns React component with settings interface
 */
export default function SettingsScreen() {
  const theme = useTheme();
  const { settings, updateSettings, clearAllData, setAuthenticated } = useAppStore();
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  /**
   * Checks if biometric authentication is available on device
   */
  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
    }
  };

  /**
   * Handles theme change
   * @param theme - New theme setting
   */
  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    updateSettings({ theme });
  };

  /**
   * Handles font size change
   * @param increase - Whether to increase or decrease font size
   */
  const handleFontSizeChange = (increase: boolean) => {
    const newSize = increase ? settings.fontSize + 1 : settings.fontSize - 1;
    const clampedSize = Math.max(10, Math.min(24, newSize));
    updateSettings({ fontSize: clampedSize });
  };

  /**
   * Handles auto-timeout change
   * @param minutes - Timeout duration in minutes
   */
  const handleAutoTimeoutChange = (minutes: number) => {
    updateSettings({ autoTimeout: minutes });
  };

  /**
   * Handles biometric setting toggle
   * @param enabled - Whether biometrics should be enabled
   */
  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && biometricAvailable) {
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enable biometric authentication',
          fallbackLabel: 'Cancel',
        });

        if (result.success) {
          updateSettings({ enableBiometrics: enabled });
        }
      } catch (error) {
        console.error('Biometric authentication error:', error);
      }
    } else {
      updateSettings({ enableBiometrics: enabled });
    }
  };

  /**
   * Handles notifications toggle
   * @param enabled - Whether notifications should be enabled
   */
  const handleNotificationsToggle = (enabled: boolean) => {
    updateSettings({ notificationsEnabled: enabled });
  };

  /**
   * Shows confirmation dialog for clearing app data
   */
  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all connections, settings, and stored data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            setAuthenticated(false);
          },
        },
      ]
    );
  };

  /**
   * Handles sign out
   */
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'default',
        onPress: () => setAuthenticated(false),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Appearance Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Appearance</Title>

            <List.Item
              title="Theme"
              description={`Current: ${settings.theme}`}
              left={props => <List.Icon {...props} icon="palette" />}
              right={() => (
                <View style={styles.themeButtons}>
                  <Button
                    mode={settings.theme === 'light' ? 'contained' : 'outlined'}
                    compact
                    onPress={() => handleThemeChange('light')}
                    style={styles.themeButton}
                  >
                    Light
                  </Button>
                  <Button
                    mode={settings.theme === 'dark' ? 'contained' : 'outlined'}
                    compact
                    onPress={() => handleThemeChange('dark')}
                    style={styles.themeButton}
                  >
                    Dark
                  </Button>
                  <Button
                    mode={settings.theme === 'auto' ? 'contained' : 'outlined'}
                    compact
                    onPress={() => handleThemeChange('auto')}
                    style={styles.themeButton}
                  >
                    Auto
                  </Button>
                </View>
              )}
            />

            <List.Item
              title="Terminal Font Size"
              description={`Current: ${settings.fontSize}px`}
              left={props => <List.Icon {...props} icon="format-size" />}
              right={() => (
                <View style={styles.fontSizeButtons}>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handleFontSizeChange(false)}
                    disabled={settings.fontSize <= 10}
                  >
                    A-
                  </Button>
                  <Text style={styles.fontSizeText}>{settings.fontSize}</Text>
                  <Button
                    mode="outlined"
                    compact
                    onPress={() => handleFontSizeChange(true)}
                    disabled={settings.fontSize >= 24}
                  >
                    A+
                  </Button>
                </View>
              )}
            />
          </Card.Content>
        </Card>

        {/* Security Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Security</Title>

            <List.Item
              title="Biometric Authentication"
              description={
                biometricAvailable
                  ? 'Use Face ID, Touch ID, or fingerprint to unlock'
                  : 'Not available on this device'
              }
              left={props => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch
                  value={settings.enableBiometrics}
                  onValueChange={handleBiometricToggle}
                  disabled={!biometricAvailable}
                />
              )}
            />

            <List.Item
              title="Auto-Lock Timeout"
              description={`Lock app after ${settings.autoTimeout} minutes of inactivity`}
              left={props => <List.Icon {...props} icon="lock-clock" />}
              right={() => (
                <View style={styles.timeoutButtons}>
                  {[5, 15, 30, 60].map(minutes => (
                    <Button
                      key={minutes}
                      mode={settings.autoTimeout === minutes ? 'contained' : 'outlined'}
                      compact
                      onPress={() => handleAutoTimeoutChange(minutes)}
                      style={styles.timeoutButton}
                    >
                      {minutes}m
                    </Button>
                  ))}
                </View>
              )}
            />
          </Card.Content>
        </Card>

        {/* Notifications Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Notifications</Title>

            <List.Item
              title="Push Notifications"
              description="Receive notifications when tasks complete"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={handleNotificationsToggle}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Data & Privacy Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Data & Privacy</Title>

            <List.Item
              title="Clear All Data"
              description="Remove all connections and settings"
              left={props => <List.Icon {...props} icon="delete-sweep" />}
              onPress={handleClearData}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Sign Out"
              description="Sign out and return to welcome screen"
              left={props => <List.Icon {...props} icon="logout" />}
              onPress={handleSignOut}
            />
          </Card.Content>
        </Card>

        {/* App Info Section */}
        <Card style={styles.section}>
          <Card.Content>
            <Title style={styles.sectionTitle}>About</Title>

            <List.Item
              title="Claude Code Mobile"
              description="Version 1.0.0"
              left={props => <List.Icon {...props} icon="information" />}
            />

            <List.Item
              title="Report Issues"
              description="GitHub repository"
              left={props => <List.Icon {...props} icon="bug" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  themeButton: {
    minWidth: 60,
  },
  fontSizeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontSizeText: {
    minWidth: 30,
    textAlign: 'center',
  },
  timeoutButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  timeoutButton: {
    minWidth: 50,
  },
  divider: {
    marginVertical: 8,
  },
});
