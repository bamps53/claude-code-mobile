import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Button, Card, Title } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { router } from 'expo-router';
import { RootState } from '../src/store';
import { disconnect } from '../src/store/authSlice';

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const { isConnected, connectionConfig } = useSelector((state: RootState) => state.auth);
  const { sessions } = useSelector((state: RootState) => state.session);

  const handleDisconnect = async () => {
    try {
      const sshConnection = (global as any).sshConnection;
      
      // Disconnect WebSocket SSH manager if it was being used
      if (sshConnection?.type === 'websocket') {
        const { sshManager } = await import('../src/api/websocket-ssh');
        if (sshManager.getConnectionStatus()) {
          await sshManager.disconnect();
        }
      }
      
      // Clear global SSH connection
      (global as any).sshConnection = null;
      dispatch(disconnect());
      router.replace('/server-connection');
    } catch (error) {
      console.error('Disconnect error:', error);
      // Force disconnect even if there's an error
      (global as any).sshConnection = null;
      dispatch(disconnect());
      router.replace('/server-connection');
    }
  };

  // Get SSH connection info
  const sshConnection = (global as any).sshConnection;

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Connection Status</Title>
          {isConnected && connectionConfig ? (
            <>
              <List.Item
                title="Server"
                description={`${connectionConfig.username}@${connectionConfig.hostname}:${connectionConfig.port}`}
                left={(props) => <List.Icon {...props} icon="server" />}
              />
              <List.Item
                title="Status"
                description={sshConnection?.connected ? `Connected (${sshConnection.type || 'unknown'} mode)` : "Disconnected"}
                left={(props) => <List.Icon {...props} icon={sshConnection?.connected ? "check-circle" : "close-circle"} />}
              />
              {sshConnection?.connectedAt && (
                <List.Item
                  title="Connected Since"
                  description={new Date(sshConnection.connectedAt).toLocaleString()}
                  left={(props) => <List.Icon {...props} icon="clock" />}
                />
              )}
              <List.Item
                title="Active Sessions"
                description={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
                left={(props) => <List.Icon {...props} icon="console" />}
              />
              <Button
                mode="contained"
                onPress={handleDisconnect}
                style={styles.button}
                buttonColor="#b00020"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <>
              <List.Item
                title="Status"
                description="Not connected"
                left={(props) => <List.Icon {...props} icon="close-circle" />}
              />
              <Button
                mode="contained"
                onPress={() => router.push('/server-connection')}
                style={styles.button}
              >
                Connect to Server
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          <List.Item
            title="Notifications"
            description="Push notification settings"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to notification settings
              console.log('Open notification settings');
            }}
          />
          <List.Item
            title="Theme"
            description="Light/Dark mode"
            left={(props) => <List.Icon {...props} icon="palette" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to theme settings
              console.log('Open theme settings');
            }}
          />
          <List.Item
            title="About"
            description="App version and info"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // TODO: Navigate to about page
              console.log('Open about page');
            }}
          />
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  button: {
    marginTop: 16,
  },
});