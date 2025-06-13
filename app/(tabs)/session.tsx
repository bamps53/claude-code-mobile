import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, Button, FAB } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../src/store';
import { Session, setCurrentSession } from '../../src/store/sessionSlice';
import { router } from 'expo-router';

export default function SessionScreen() {
  const dispatch = useDispatch();
  const { sessions, currentSession } = useSelector((state: RootState) => state.session);
  const { isConnected } = useSelector((state: RootState) => state.auth);

  const handleSessionSelect = (session: Session) => {
    dispatch(setCurrentSession(session));
    router.push('/(tabs)/terminal');
  };

  const handleCreateSession = () => {
    // TODO: Implement session creation
    console.log('Create new session');
  };

  const renderSession = ({ item }: { item: Session }) => (
    <Card style={styles.card} onPress={() => handleSessionSelect(item)}>
      <Card.Content>
        <Title>{item.name}</Title>
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
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleCreateSession}
      />
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
});