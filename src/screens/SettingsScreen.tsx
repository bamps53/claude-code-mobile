import React from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {
  List,
  Switch,
  Text,
  Divider,
  Button,
  Card,
} from 'react-native-paper';
import {useAppDispatch, useAppSelector} from '@store/index';
import {logout} from '@store/authSlice';

export const SettingsScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {connectionConfig, isConnected} = useAppSelector(state => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleReconnect = () => {
    // TODO: 再接続処理
    console.log('Reconnect to server');
  };

  return (
    <ScrollView style={styles.container}>
      {/* 接続情報 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            接続情報
          </Text>
          
          <List.Item
            title="サーバー"
            description={connectionConfig?.host || '未設定'}
            left={(props) => <List.Icon {...props} icon="server" />}
          />
          
          <List.Item
            title="ユーザー"
            description={connectionConfig?.username || '未設定'}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          
          <List.Item
            title="接続状態"
            description={isConnected ? '接続中' : '切断中'}
            left={(props) => <List.Icon {...props} icon="connection" />}
            right={() => (
              <View style={[
                styles.statusIndicator,
                {backgroundColor: isConnected ? '#4CAF50' : '#f44336'}
              ]} />
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleReconnect}
              style={styles.button}
              disabled={!connectionConfig}>
              再接続
            </Button>
            <Button
              mode="contained"
              onPress={handleLogout}
              style={[styles.button, styles.logoutButton]}
              buttonColor="#f44336">
              切断
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* アプリ設定 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            アプリ設定
          </Text>

          <List.Item
            title="ダークモード"
            description="アプリの外観テーマ"
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={false}
                onValueChange={() => console.log('Toggle dark mode')}
              />
            )}
          />

          <Divider />

          <List.Item
            title="プッシュ通知"
            description="Claude Code完了時の通知"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={true}
                onValueChange={() => console.log('Toggle notifications')}
              />
            )}
          />

          <Divider />

          <List.Item
            title="自動再接続"
            description="ネットワーク切断時の自動復旧"
            left={(props) => <List.Icon {...props} icon="autorenew" />}
            right={() => (
              <Switch
                value={true}
                onValueChange={() => console.log('Toggle auto reconnect')}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* ターミナル設定 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            ターミナル設定
          </Text>

          <List.Item
            title="フォントサイズ"
            description="ターミナルのテキストサイズ"
            left={(props) => <List.Icon {...props} icon="format-size" />}
            onPress={() => console.log('Font size settings')}
          />

          <Divider />

          <List.Item
            title="カラーテーマ"
            description="ターミナルの配色設定"
            left={(props) => <List.Icon {...props} icon="palette" />}
            onPress={() => console.log('Color theme settings')}
          />

          <Divider />

          <List.Item
            title="キーバインド"
            description="特殊キーのカスタマイズ"
            left={(props) => <List.Icon {...props} icon="keyboard" />}
            onPress={() => console.log('Key binding settings')}
          />
        </Card.Content>
      </Card>

      {/* アプリ情報 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            アプリ情報
          </Text>

          <List.Item
            title="バージョン"
            description="1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />

          <Divider />

          <List.Item
            title="プライバシーポリシー"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            onPress={() => console.log('Privacy policy')}
          />

          <Divider />

          <List.Item
            title="利用規約"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => console.log('Terms of service')}
          />

          <Divider />

          <List.Item
            title="サポート"
            left={(props) => <List.Icon {...props} icon="help" />}
            onPress={() => console.log('Support')}
          />
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 8,
    color: '#6200ee',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
  },
  logoutButton: {
    marginLeft: 8,
  },
});