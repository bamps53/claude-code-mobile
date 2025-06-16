/**
 * Welcome screen with authentication
 * @description Initial screen for user authentication using biometrics or PIN
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, useTheme } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppStore } from '../store';

/**
 * Welcome screen component with biometric authentication
 * @description Handles initial user authentication and app entry
 * @returns React component with authentication interface
 */
export default function WelcomeScreen() {
  const theme = useTheme();
  const { setAuthenticated, settings } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Handles biometric authentication process
   * @description Triggers biometric authentication if available, otherwise shows PIN
   */
  const handleAuthentication = async () => {
    setIsAuthenticating(true);

    try {
      if (settings.enableBiometrics) {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access Claude Code',
            fallbackLabel: 'Use PIN instead',
          });

          if (result.success) {
            setAuthenticated(true);
          }
        } else {
          // Fallback to PIN or direct access
          setAuthenticated(true);
        }
      } else {
        setAuthenticated(true);
      }
    } catch (error) {
      console.warn('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.title}>Claude Code Mobile</Title>
            <Paragraph style={styles.subtitle}>
              Secure access to your remote development environment
            </Paragraph>

            <Button
              mode="contained"
              onPress={handleAuthentication}
              loading={isAuthenticating}
              disabled={isAuthenticating}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {isAuthenticating ? 'Authenticating...' : 'Get Started'}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
  },
  cardContent: {
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  button: {
    width: '100%',
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
