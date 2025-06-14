import React, {useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Switch,
  HelperText,
  ActivityIndicator,
} from 'react-native-paper';
import {useAppDispatch, useAppSelector} from '@store/index';
import {setConnectionConfig, setConnecting} from '@store/authSlice';

export const ConnectionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {connectionConfig, isConnecting, error} = useAppSelector(state => state.auth);

  const [host, setHost] = useState(connectionConfig?.host || '');
  const [port, setPort] = useState(connectionConfig?.port?.toString() || '22');
  const [username, setUsername] = useState(connectionConfig?.username || '');
  const [password, setPassword] = useState('');
  const [useKey, setUseKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!host.trim()) {
      newErrors.host = 'ホスト名を入力してください';
    }

    if (!port.trim() || isNaN(Number(port)) || Number(port) <= 0) {
      newErrors.port = '有効なポート番号を入力してください';
    }

    if (!username.trim()) {
      newErrors.username = 'ユーザー名を入力してください';
    }

    if (!useKey && !password.trim()) {
      newErrors.password = 'パスワードを入力してください';
    }

    if (useKey && !privateKey.trim()) {
      newErrors.privateKey = '秘密鍵を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConnect = async () => {
    if (!validateForm()) {
      return;
    }

    dispatch(setConnecting(true));

    try {
      const config: import('@store/authSlice').ConnectionConfig = {
        host: host.trim(),
        port: Number(port),
        username: username.trim(),
        authMethod: useKey ? 'key' as const : 'password' as const,
        ...(useKey ? {privateKey} : {password}),
      };

      dispatch(setConnectionConfig(config));

      // TODO: 実際のSSH接続を実装
      // await sshManager.connect(config);
      
      // 一時的なシミュレーション
      await new Promise<void>(resolve => setTimeout(resolve, 2000));
      
      console.log('Connection successful (simulated)');
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      dispatch(setConnecting(false));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            SSH接続設定
          </Text>

          <TextInput
            label="ホスト名"
            value={host}
            onChangeText={setHost}
            mode="outlined"
            style={styles.input}
            error={!!errors.host}
            placeholder="例: example.com"
          />
          <HelperText type="error" visible={!!errors.host}>
            {errors.host}
          </HelperText>

          <TextInput
            label="ポート"
            value={port}
            onChangeText={setPort}
            mode="outlined"
            style={styles.input}
            error={!!errors.port}
            keyboardType="numeric"
            placeholder="22"
          />
          <HelperText type="error" visible={!!errors.port}>
            {errors.port}
          </HelperText>

          <TextInput
            label="ユーザー名"
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            style={styles.input}
            error={!!errors.username}
            autoCapitalize="none"
          />
          <HelperText type="error" visible={!!errors.username}>
            {errors.username}
          </HelperText>

          <View style={styles.authMethodContainer}>
            <Text variant="bodyLarge">認証方式</Text>
            <View style={styles.switchContainer}>
              <Text>パスワード</Text>
              <Switch value={useKey} onValueChange={setUseKey} />
              <Text>秘密鍵</Text>
            </View>
          </View>

          {!useKey ? (
            <>
              <TextInput
                label="パスワード"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                style={styles.input}
                error={!!errors.password}
                secureTextEntry
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>
            </>
          ) : (
            <>
              <TextInput
                label="秘密鍵"
                value={privateKey}
                onChangeText={setPrivateKey}
                mode="outlined"
                style={styles.input}
                error={!!errors.privateKey}
                multiline
                numberOfLines={4}
                placeholder="-----BEGIN PRIVATE KEY-----"
              />
              <HelperText type="error" visible={!!errors.privateKey}>
                {errors.privateKey}
              </HelperText>
            </>
          )}

          {error && (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          )}

          <Button
            mode="contained"
            onPress={handleConnect}
            style={styles.button}
            disabled={isConnecting}
            contentStyle={styles.buttonContent}>
            {isConnecting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              '接続テスト'
            )}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    marginBottom: 24,
    textAlign: 'center',
    color: '#6200ee',
  },
  input: {
    marginBottom: 8,
  },
  authMethodContainer: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    marginTop: 24,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});