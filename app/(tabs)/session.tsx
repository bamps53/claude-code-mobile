import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Card, Title, Paragraph, Button, FAB, Dialog, Portal, TextInput as PaperTextInput } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../src/store';
import { Session, setCurrentSession, addSession, removeSession } from '../../src/store/sessionSlice';
import { sshManager } from '../../src/api/websocket-ssh';
import { router } from 'expo-router';

export default function SessionScreen() {
  const dispatch = useDispatch();
  const { sessions, currentSession } = useSelector((state: RootState) => state.session);
  const { isConnected } = useSelector((state: RootState) => state.auth);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');

  const handleSessionSelect = (session: Session) => {
    dispatch(setCurrentSession(session));
    router.push('/(tabs)/terminal');
  };

  const handleCreateSession = () => {
    setShowCreateDialog(true);
  };

  const handleConfirmCreateSession = async () => {
    if (!newSessionName.trim()) {
      Alert.alert('Error', 'Session name is required');
      return;
    }

    // Check if SSH connection exists
    const sshConnection = (global as any).sshConnection;
    if (!sshConnection || !sshConnection.connected) {
      Alert.alert('Error', 'No SSH connection available. Please reconnect.');
      return;
    }

    try {
      // Check for duplicate session names
      if (sessions.some(s => s.name === newSessionName.trim())) {
        throw new Error(`Session '${newSessionName.trim()}' already exists`);
      }

      let newSession: Session;

      if (sshConnection.type === 'websocket' && sshManager.getConnectionStatus()) {
        // Use WebSocket SSH manager for real session creation
        const session = await sshManager.createSession(newSessionName.trim());
        newSession = session;
      } else {
        // Fall back to mock session creation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        newSession = {
          id: `session-${Date.now()}`,
          name: newSessionName.trim(),
          created: new Date().toISOString(),
          isActive: true,
          lastActivity: new Date().toISOString(),
        };
      }

      dispatch(addSession(newSession));
      setShowCreateDialog(false);
      setNewSessionName('');
      
      Alert.alert('Success', `Session '${newSession.name}' created successfully`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create session');
    }
  };

  const handleDeleteSession = (session: Session) => {
    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete session '${session.name}'?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const sshConnection = (global as any).sshConnection;
              
              if (sshConnection?.type === 'websocket' && sshManager.getConnectionStatus()) {
                // Use WebSocket SSH manager for real session deletion
                await sshManager.killSession(session.name);
              }
              
              // Remove from Redux store (both WebSocket and mock modes)
              dispatch(removeSession(session.id));
              
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete session');
            }
          }
        }
      ]
    );
  };

  const renderSession = ({ item }: { item: Session }) => (
    <Card style={styles.card} onPress={() => handleSessionSelect(item)}>
      <Card.Content>
        <View style={styles.sessionHeader}>
          <Title style={styles.sessionTitle}>{item.name}</Title>
          <Button 
            mode="text" 
            onPress={() => handleDeleteSession(item)}
            textColor="#b00020"
            compact
          >
            Delete
          </Button>
        </View>
        <Paragraph>Created: {new Date(item.created).toLocaleString()}</Paragraph>
        <Paragraph>Status: {item.isActive ? 'Active' : 'Inactive'}</Paragraph>
        {item.lastActivity && (
          <Paragraph>Last Activity: {new Date(item.lastActivity).toLocaleString()}</Paragraph>
        )}
      </Card.Content>
    </Card>
  );

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Title>Not Connected</Title>
        <Paragraph>Please connect to a server first.</Paragraph>
        <Button mode="contained" onPress={() => router.push('/server-connection')}>
          Connect to Server
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Title>No Sessions</Title>
            <Paragraph>Create a new tmux session to get started.</Paragraph>
          </View>
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateSession}
      />
      
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create New Session</Dialog.Title>
          <Dialog.Content>
            <PaperTextInput
              label="Session Name"
              value={newSessionName}
              onChangeText={setNewSessionName}
              mode="outlined"
              placeholder="my-session"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={handleConfirmCreateSession} mode="contained">Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  list: {
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitle: {
    flex: 1,
  },
});