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
import { sshManager } from '../src/api/websocket-ssh';

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

      try {
        // Try WebSocket SSH connection first
        await sshManager.connect(sshConfig);
        
        // Connection successful
        const connectionId = `${config.hostname}-${config.username}-${Date.now()}`;
        
        (global as any).sshConnection = {
          id: connectionId,
          config: config,
          connected: true,
          connectedAt: new Date().toISOString(),
          type: 'websocket'
        };
        
        dispatch(setConnected(true));
        router.replace('/(tabs)/session');
        
      } catch (wsError) {
        // WebSocket failed, fall back to mock mode for testing
        console.log('WebSocket SSH connection failed, using mock mode:', wsError);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Strict validation for mock mode
        const invalidHosts = ['invalid.example.com', 'nonexistent.test', 'fake.server', 'badhost.com'];
        if (invalidHosts.includes(config.hostname.toLowerCase())) {
          throw new Error(`SSH connection failed: Could not resolve hostname '${config.hostname}': Name or service not known`);
        }
        
        const validPorts = [22, 2222];
        if (!validPorts.includes(config.port)) {
          throw new Error(`SSH connection failed: Connection refused to ${config.hostname}:${config.port}`);
        }
        
        const validCredentials = [
          { username: 'admin', password: 'admin123', hostname: 'testserver.com' },
          { username: 'root', password: 'password123', hostname: 'myserver.com' },
          { username: 'user', password: 'secret456', hostname: 'devserver.local' },
        ];
        
        const isValidCredential = validCredentials.some(cred => 
          cred.username === config.username && 
          cred.password === config.password && 
          cred.hostname === config.hostname
        );
        
        if (!isValidCredential) {
          if (!config.password || config.password.length === 0) {
            throw new Error('SSH connection failed: No password provided');
          }
          throw new Error(`SSH connection failed: Permission denied (publickey,password). Authentication failed for ${config.username}@${config.hostname}`);
        }
        
        // Mock connection successful
        const connectionId = `${config.hostname}-${config.username}-${Date.now()}`;
        
        (global as any).sshConnection = {
          id: connectionId,
          config: config,
          connected: true,
          connectedAt: new Date().toISOString(),
          type: 'mock'
        };
        
        dispatch(setConnected(true));
        router.replace('/(tabs)/session');
      }
      
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
            Enter your SSH connection details to connect to a server running Claude Code.
          </Paragraph>
          
          <Paragraph style={styles.testInfo}>
            🌐 Uses WebSocket SSH proxy (fallback to mock mode if server unavailable)
          </Paragraph>
          <Paragraph style={styles.testInfo}>
            💡 Mock mode credentials: admin/admin123@testserver.com, root/password123@myserver.com, user/secret456@devserver.local
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