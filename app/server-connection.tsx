import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { RootState } from '../src/store';
import { 
  setConnectionConfig, 
  setConnecting, 
  setConnected, 
  setError,
  ConnectionConfig 
} from '../src/store/authSlice';
import { nativeSSHManager } from '../src/api/ssh-native';

export default function ServerConnectionScreen() {
  const dispatch = useDispatch();
  const { isConnecting, error } = useSelector((state: RootState) => state.auth);
  
  const [hostname, setHostname] = useState('');
  const [port, setPort] = useState('22');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const validateForm = (): boolean => {
    if (!hostname.trim()) {
      Alert.alert('Error', 'Hostname is required');
      return false;
    }
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return false;
    }
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
      Alert.alert('Error', 'Port must be a number between 1 and 65535');
      return false;
    }
    return true;
  };

  const handleConnect = async () => {
    if (!validateForm()) return;

    const config: ConnectionConfig = {
      hostname: hostname.trim(),
      port: parseInt(port),
      username: username.trim(),
      password: password.trim() || undefined,
    };

    dispatch(setConnecting(true));
    dispatch(setConnectionConfig(config));

    try {
      // Convert config format for WebSocket SSH manager
      const sshConfig = {
        host: config.hostname,
        port: config.port,
        username: config.username,
        password: config.password,
      };

      // Attempt native SSH connection
      await nativeSSHManager.connect(sshConfig);
      
      // Connection successful
      const connectionId = `${config.hostname}-${config.username}-${Date.now()}`;
      
      (global as any).sshConnection = {
        id: connectionId,
        config: config,
        connected: true,
        connectedAt: new Date().toISOString(),
        type: 'native'
      };
      
      dispatch(setConnected(true));
      router.replace('/(tabs)/session');
      
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Connection failed'));
    } finally {
      dispatch(setConnecting(false));
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Connect to Server</Title>
          <Paragraph style={styles.description}>
            Enter your SSH connection details to connect directly to your server.
          </Paragraph>
          
          <Paragraph style={styles.testInfo}>
            🔒 Direct SSH connection - Your credentials stay secure on your device
          </Paragraph>
          <Paragraph style={styles.testInfo}>
            ⚡ Production-ready native SSH implementation
          </Paragraph>

          <TextInput
            label="Hostname"
            value={hostname}
            onChangeText={setHostname}
            mode="outlined"
            style={styles.input}
            placeholder="example.com"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label="Port"
            value={port}
            onChangeText={setPort}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
            placeholder="22"
          />

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            placeholder="user"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {error && (
            <Paragraph style={styles.error}>
              {error}
            </Paragraph>
          )}

          <Button
            mode="contained"
            onPress={handleConnect}
            style={styles.button}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <ActivityIndicator size="small" color="white" />
                <Paragraph style={styles.buttonText}>Connecting...</Paragraph>
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    padding: 16,
  },
  description: {
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
  },
  error: {
    color: '#b00020',
    textAlign: 'center',
    marginBottom: 16,
  },
  testInfo: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    color: '#666',
  },
});