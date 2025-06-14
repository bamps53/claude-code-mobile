import React, {useEffect} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {
  Text,
  Card,
  FAB,
  List,
  IconButton,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import {useAppDispatch, useAppSelector} from '@store/index';
import {fetchSessions, setCurrentSession} from '@store/sessionSlice';

export const SessionsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {sessions, currentSession, isLoading} = useAppSelector(state => state.session);

  useEffect(() => {
    // セッション一覧を取得
    dispatch(fetchSessions());
  }, [dispatch]);

  const handleCreateSession = () => {
    // TODO: 新規セッション作成ダイアログ
    console.log('Create new session');
  };

  const handleSelectSession = (sessionId: string) => {
    dispatch(setCurrentSession(sessionId));
  };

  const handleDeleteSession = (sessionId: string) => {
    // TODO: セッション削除確認ダイアログ
    console.log('Delete session:', sessionId);
  };

  const renderSession = ({item}: {item: any}) => (
    <Card style={styles.sessionCard}>
      <List.Item
        title={item.name}
        description={`作成: ${new Date(item.createdAt).toLocaleDateString()}`}
        left={() => (
          <View style={styles.sessionIcon}>
            <Text style={styles.sessionIconText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        right={() => (
          <View style={styles.sessionActions}>
            <Chip
              mode={item.status === 'active' ? 'flat' : 'outlined'}
              style={[
                styles.statusChip,
                {backgroundColor: item.status === 'active' ? '#4CAF50' : '#9E9E9E'},
              ]}>
              {item.status === 'active' ? 'アクティブ' : '停止中'}
            </Chip>
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteSession(item.id)}
            />
          </View>
        )}
        onPress={() => handleSelectSession(item.id)}
        style={[
          styles.sessionItem,
          currentSession === item.id && styles.selectedSession,
        ]}
      />
    </Card>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>セッションを読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          tmux セッション
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {sessions.length} 個のセッション
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            セッションがありません
          </Text>
          <Text variant="bodyMedium" style={styles.emptySubtext}>
            + ボタンを押して新しいセッションを作成してください
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sessionList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateSession}
        label="新規セッション"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    color: '#6200ee',
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  sessionList: {
    padding: 16,
  },
  sessionCard: {
    marginBottom: 8,
    elevation: 2,
  },
  sessionItem: {
    borderRadius: 8,
  },
  selectedSession: {
    backgroundColor: '#f3e5f5',
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  sessionIconText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginBottom: 8,
    color: '#666',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6200ee',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});