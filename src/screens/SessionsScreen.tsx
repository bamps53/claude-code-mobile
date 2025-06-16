/**
 * Tmux sessions management screen
 * @description Displays and manages tmux sessions for connected servers
 */

import React, { useEffect } from 'react';
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
  Text,
} from 'react-native-paper';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { NavigationScreens } from '../types';
import { useAppStore } from '../store';
import { TmuxSession } from '../types';

/**
 * Session card component for displaying tmux session details
 * @param session - Tmux session object
 * @param onAttach - Callback for attaching to session
 * @param onKill - Callback for killing session
 * @returns React component displaying session card
 */
function SessionCard({
  session,
  onAttach,
  onKill,
}: {
  session: TmuxSession;
  onAttach: (sessionId: string) => void;
  onKill: (sessionId: string) => void;
}) {
  const theme = useTheme();

  /**
   * Safely formats date for display with relative time
   * @param date - Date to format (can be Date object or string)
   * @returns Formatted relative time string
   */
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Unknown';

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid date';

      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) {
        return `${diffMins}m ago`;
      } else if (diffHours < 24) {
        return `${diffHours}h ago`;
      } else {
        return `${diffDays}d ago`;
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card style={styles.sessionCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.sessionInfo}>
            <Title style={styles.sessionName}>{session.name}</Title>
            <Paragraph style={styles.sessionDetails}>
              {session.windowCount} window{session.windowCount !== 1 ? 's' : ''}
            </Paragraph>
          </View>
          <View style={styles.cardActions}>
            <Chip
              icon={session.isActive ? 'play-circle' : 'pause-circle'}
              mode="outlined"
              style={[
                styles.statusChip,
                {
                  backgroundColor: session.isActive
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
                },
              ]}
            >
              {session.isActive ? 'Active' : 'Inactive'}
            </Chip>
            <IconButton icon="delete" size={20} onPress={() => onKill(session.id)} />
          </View>
        </View>

        <View style={styles.sessionMeta}>
          <Paragraph style={styles.metaText}>
            Created: {formatDate(session.created)}
          </Paragraph>
          <Paragraph style={styles.metaText}>
            Last activity: {formatDate(session.lastActivity)}
          </Paragraph>
        </View>
      </Card.Content>

      <Card.Actions>
        <Button mode="contained" onPress={() => onAttach(session.id)}>
          Attach
        </Button>
      </Card.Actions>
    </Card>
  );
}

/**
 * Main sessions screen component
 * @description Displays list of tmux sessions and manages session operations
 * @returns React component with sessions interface
 */
export default function SessionsScreen() {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp<NavigationScreens>>();
  const {
    sessions,
    activeConnectionId,
    connections,
    refreshSessions,
    createSession,
    killSession,
  } = useAppStore();

  const activeConnection = connections.find(c => c.id === activeConnectionId);

  useEffect(() => {
    if (activeConnectionId) {
      refreshSessions(activeConnectionId);
    }
  }, [activeConnectionId]);

  /**
   * Handles attaching to a tmux session
   * @param sessionId - ID of the session to attach to
   */
  const handleAttach = (sessionId: string) => {
    if (activeConnectionId) {
      navigation.navigate('Terminal', {
        sessionId,
        connectionId: activeConnectionId,
      });
    }
  };

  /**
   * Handles creating a new tmux session
   */
  const handleCreateSession = async () => {
    if (activeConnectionId) {
      try {
        await createSession(activeConnectionId);
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    }
  };

  /**
   * Handles killing a tmux session
   * @param sessionId - ID of the session to kill
   */
  const handleKillSession = async (sessionId: string) => {
    try {
      await killSession(sessionId);
    } catch (error) {
      console.error('Failed to kill session:', error);
    }
  };

  /**
   * Renders individual session item
   * @param item - Session object from FlatList
   * @returns SessionCard component
   */
  const renderSession = ({ item }: { item: TmuxSession }) => (
    <SessionCard session={item} onAttach={handleAttach} onKill={handleKillSession} />
  );

  if (!activeConnection) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={styles.emptyText}>
          No active connection. Please connect to a server first.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Sessions - {activeConnection.name}</Title>
        <Paragraph style={styles.headerSubtitle}>
          {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
        </Paragraph>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={() => activeConnectionId && refreshSessions(activeConnectionId)}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  sessionCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    marginBottom: 4,
  },
  sessionDetails: {
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
  sessionMeta: {
    marginTop: 8,
  },
  metaText: {
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
