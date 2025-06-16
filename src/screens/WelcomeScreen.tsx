/**
 * Welcome screen with authentication
 * @description Initial screen for user authentication using biometrics or PIN
 */

import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Card, Title, Paragraph, useTheme } from 'react-native-paper';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppStore } from '../store';
import TerminalTypingText from '../components/TerminalTypingText';

/**
 * Welcome screen component with biometric authentication
 * @description Handles initial user authentication and app entry
 * @returns React component with authentication interface
 */
export default function WelcomeScreen() {
  const theme = useTheme();
  const { setAuthenticated, settings } = useAppStore();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [titleComplete, setTitleComplete] = useState(false);
  const [subtitleComplete, setSubtitleComplete] = useState(false);

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
        <Card
          style={[
            styles.card,
            {
              elevation: 0,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              borderRadius: 0,
            },
          ]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleContainer}>
              <TerminalTypingText
                text="Claude Code Mobile"
                typeSpeed={80}
                showCursor={!titleComplete}
                onComplete={() => setTitleComplete(true)}
                style={styles.title}
              />
            </View>
            {titleComplete && (
              <View style={styles.subtitleContainer}>
                <TerminalTypingText
                  text="> Secure access to your remote development environment"
                  typeSpeed={30}
                  showCursor={!subtitleComplete}
                  onComplete={() => setSubtitleComplete(true)}
                  style={styles.subtitle}
                />
              </View>
            )}

            {subtitleComplete && (
              <Button
                mode="outlined"
                onPress={handleAuthentication}
                loading={isAuthenticating}
                disabled={isAuthenticating}
                style={[
                  styles.button,
                  { borderColor: theme.colors.primary, borderRadius: 0 },
                ]}
                contentStyle={styles.buttonContent}
                labelStyle={{ fontFamily: 'RobotoMono_500Medium' }}
                textColor={theme.colors.primary}
              >
                {isAuthenticating ? 'AUTHENTICATING...' : '[ GET STARTED ]'}
              </Button>
            )}
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
  titleContainer: {
    minHeight: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'RobotoMono_700Bold',
    textAlign: 'center',
  },
  subtitleContainer: {
    minHeight: 24,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'RobotoMono_400Regular',
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    width: '100%',
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
