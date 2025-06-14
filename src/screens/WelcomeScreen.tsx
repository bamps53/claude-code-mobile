import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Button, Text, Card} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

import {RootStackParamList} from '@/navigation/AppNavigator';

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  const handleSetupConnection = () => {
    navigation.navigate('Connection');
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            Claude Code Mobile
          </Text>
          
          <Text variant="bodyLarge" style={styles.description}>
            リモートサーバー上のClaude Codeセッションに
            モバイルデバイスから安全にアクセス
          </Text>

          <View style={styles.features}>
            <Text variant="bodyMedium" style={styles.feature}>
              • SSH接続による安全な通信
            </Text>
            <Text variant="bodyMedium" style={styles.feature}>
              • tmuxセッション管理
            </Text>
            <Text variant="bodyMedium" style={styles.feature}>
              • プッシュ通知対応
            </Text>
          </View>

          <Button
            mode="contained"
            onPress={handleSetupConnection}
            style={styles.button}
            contentStyle={styles.buttonContent}>
            セットアップを開始
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f6f6f6',
  },
  card: {
    elevation: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#6200ee',
  },
  description: {
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  features: {
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  feature: {
    marginBottom: 8,
    color: '#666',
  },
  button: {
    marginTop: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});