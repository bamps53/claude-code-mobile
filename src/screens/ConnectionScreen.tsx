/**
 * Connection management screen
 * @description Handles SSH connection profiles and connection management
 */

import React, { useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  IconButton,
  useTheme,
  Chip,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useAppStore } from '../store';
import { SSHConnection } from '../types';
import AddConnectionModal from '../components/AddConnectionModal';

/**
 * Connection card component for displaying SSH connection details
 * @param connection - SSH connection object
 * @param onConnect - Callback for connection action
 * @param onEdit - Callback for editing connection
 * @param onDelete - Callback for deleting connection
 * @returns React component displaying connection card
 */
function ConnectionCard({
  connection,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  isLoading = false,
}: {
  connection: SSHConnection;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}) {
  const theme = useTheme();

  return (
    <Card style={styles.connectionCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.connectionInfo}>
            <Title style={styles.connectionName}>{connection.name}</Title>
            <Paragraph style={styles.connectionDetails}>
              {connection.username}@{connection.host}:{connection.port}
            </Paragraph>
          </View>
          <View style={styles.cardActions}>
            <Chip
              icon={connection.isConnected ? 'check-circle' : 'circle-outline'}
              mode="outlined"
              style={[
                styles.statusChip,
                {
                  backgroundColor: connection.isConnected
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
                },
              ]}
            >
              {connection.isConnected ? 'Connected' : 'Disconnected'}
            </Chip>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => onEdit(connection.id)}
              disabled={isLoading}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => onDelete(connection.id)}
              disabled={isLoading}
            />
          </View>
        </View>

        <View style={styles.connectionMeta}>
          <Paragraph style={styles.authType}>
            Auth: {connection.authType === 'key' ? 'SSH Key' : 'Password'}
          </Paragraph>
          {connection.lastConnected && (
            <Paragraph style={styles.lastConnected}>
              Last: {connection.lastConnected.toLocaleDateString()}
            </Paragraph>
          )}
          {connection.connectionError && (
            <Paragraph style={[styles.connectionError, { color: theme.colors.error }]}>
              Error: {connection.connectionError}
            </Paragraph>
          )}
        </View>
      </Card.Content>

      <Card.Actions>
        {connection.isConnected ? (
          <Button
            mode="outlined"
            onPress={() => onDisconnect(connection.id)}
            disabled={isLoading}
            icon={isLoading ? () => <ActivityIndicator size="small" /> : undefined}
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => onConnect(connection.id)}
            disabled={isLoading}
            icon={
              isLoading
                ? () => (
                    <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                  )
                : undefined
            }
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </Card.Actions>
    </Card>
  );
}

/**
 * Main connections screen component
 * @description Displays list of SSH connections and manages connection state
 * @returns React component with connections interface
 */
export default function ConnectionScreen() {
  const theme = useTheme();
  const { connections, connectToServer, disconnectFromServer, removeConnection } =
    useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<
    SSHConnection | undefined
  >();
  const [loadingConnections, setLoadingConnections] = useState<Set<string>>(new Set());
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  /**
   * Shows a feedback message to the user
   * @param message - Message to display
   */
  const showMessage = (message: string) => {
    setSnackbarMessage(message);
    setShowSnackbar(true);
  };

  /**
   * Sets loading state for a specific connection
   * @param connectionId - ID of the connection
   * @param loading - Whether the connection is loading
   */
  const setConnectionLoading = (connectionId: string, loading: boolean) => {
    setLoadingConnections(prev => {
      const newSet = new Set(prev);
      if (loading) {
        newSet.add(connectionId);
      } else {
        newSet.delete(connectionId);
      }
      return newSet;
    });
  };

  /**
   * Handles connection to SSH server
   * @param connectionId - ID of the connection to establish
   */
  const handleConnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setConnectionLoading(connectionId, true);

    try {
      await connectToServer(connectionId);
      showMessage(`Connected to ${connection.name} successfully`);
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to connect to ${connection.name}: ${errorMessage}`);
    } finally {
      setConnectionLoading(connectionId, false);
    }
  };

  /**
   * Handles disconnection from SSH server
   * @param connectionId - ID of the connection to disconnect
   */
  const handleDisconnect = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    setConnectionLoading(connectionId, true);

    try {
      await disconnectFromServer(connectionId);
      showMessage(`Disconnected from ${connection.name}`);
    } catch (error) {
      console.error('Disconnect failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      showMessage(`Failed to disconnect from ${connection.name}: ${errorMessage}`);
    } finally {
      setConnectionLoading(connectionId, false);
    }
  };

  /**
   * Handles editing a connection profile
   * @param connectionId - ID of the connection to edit
   */
  const handleEdit = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      setEditingConnection(connection);
      setShowAddModal(true);
    }
  };

  /**
   * Handles deleting a connection profile
   * @param connectionId - ID of the connection to delete
   */
  const handleDelete = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    // Show confirmation dialog
    Alert.alert(
      'Delete Connection',
      `Are you sure you want to delete "${connection.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeConnection(connectionId);
          },
        },
      ]
    );
  };

  /**
   * Handles closing the add/edit modal
   */
  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingConnection(undefined);
  };

  /**
   * Renders individual connection item
   * @param item - Connection object from FlatList
   * @returns ConnectionCard component
   */
  const renderConnection = ({ item }: { item: SSHConnection }) => (
    <ConnectionCard
      connection={item}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onEdit={handleEdit}
      onDelete={handleDelete}
      isLoading={loadingConnections.has(item.id)}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={connections}
        renderItem={renderConnection}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setShowAddModal(true)}
      />

      <AddConnectionModal
        visible={showAddModal}
        onDismiss={handleCloseModal}
        editConnection={editingConnection}
      />

      <Snackbar
        visible={showSnackbar}
        onDismiss={() => setShowSnackbar(false)}
        duration={4000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  connectionCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 18,
    marginBottom: 4,
  },
  connectionDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: 8,
  },
  connectionMeta: {
    marginTop: 8,
  },
  authType: {
    fontSize: 12,
    opacity: 0.6,
  },
  lastConnected: {
    fontSize: 12,
    opacity: 0.6,
  },
  connectionError: {
    fontSize: 12,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  snackbar: {
    bottom: 90, // Position above the FAB
  },
});
