/**
 * Connection management screen
 * @description Handles SSH connection profiles and connection management
 */

import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  IconButton,
  useTheme,
  Chip,
} from 'react-native-paper';
import { useAppStore } from '../store';
import { SSHConnection } from '../types';

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
  onEdit,
  onDelete,
}: {
  connection: SSHConnection;
  onConnect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
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
            <IconButton icon="pencil" size={20} onPress={() => onEdit(connection.id)} />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => onDelete(connection.id)}
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
        </View>
      </Card.Content>

      <Card.Actions>
        <Button
          mode={connection.isConnected ? 'outlined' : 'contained'}
          onPress={() => onConnect(connection.id)}
          disabled={connection.isConnected}
        >
          {connection.isConnected ? 'Connected' : 'Connect'}
        </Button>
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
  const { connections, connectToServer, disconnectFromServer } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);

  /**
   * Handles connection to SSH server
   * @param connectionId - ID of the connection to establish
   */
  const handleConnect = async (connectionId: string) => {
    try {
      await connectToServer(connectionId);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  /**
   * Handles editing a connection profile
   * @param connectionId - ID of the connection to edit
   */
  const handleEdit = (connectionId: string) => {
    // Navigate to edit screen (to be implemented)
    console.log('Edit connection:', connectionId);
  };

  /**
   * Handles deleting a connection profile
   * @param connectionId - ID of the connection to delete
   */
  const handleDelete = (connectionId: string) => {
    // Show confirmation dialog and delete (to be implemented)
    console.log('Delete connection:', connectionId);
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
      onEdit={handleEdit}
      onDelete={handleDelete}
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
