import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Button,
  Chip,
} from 'react-native-paper';
import {useAppSelector} from '@store/index';

export const TerminalScreen: React.FC = () => {
  const {currentSession} = useAppSelector(state => state.session);
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([
    {id: '1', text: 'Welcome to Claude Code Mobile Terminal', type: 'system'},
    {id: '2', text: '$ ', type: 'prompt'},
  ]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    // Auto-scroll to bottom when output changes
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({animated: true});
    }
  }, [output]);

  const handleSendCommand = () => {
    if (!command.trim()) return;

    // Add command to output
    const newOutput = [
      ...output,
      {id: Date.now().toString(), text: `$ ${command}`, type: 'command'},
    ];

    // TODO: Send command via SSH and get real output
    // For now, simulate a response
    setTimeout(() => {
      setOutput(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: `Executed: ${command}\n(This is a placeholder response)`,
          type: 'output',
        },
        {id: (Date.now() + 2).toString(), text: '$ ', type: 'prompt'},
      ]);
    }, 500);

    setOutput(newOutput);
    setCommand('');
  };

  const handleSpecialKey = (key: string) => {
    switch (key) {
      case 'ctrl-c':
        // TODO: Send Ctrl+C signal
        setOutput(prev => [
          ...prev,
          {id: Date.now().toString(), text: '^C', type: 'command'},
          {id: (Date.now() + 1).toString(), text: '$ ', type: 'prompt'},
        ]);
        setCommand('');
        break;
      case 'tab':
        // TODO: Implement tab completion
        console.log('Tab completion requested');
        break;
      case 'clear':
        setOutput([{id: Date.now().toString(), text: '$ ', type: 'prompt'}]);
        break;
    }
  };

  const renderOutputLine = (line: any) => {
    let textStyle = styles.outputText;
    
    switch (line.type) {
      case 'command':
        textStyle = styles.commandText;
        break;
      case 'error':
        textStyle = styles.errorText;
        break;
      case 'system':
        textStyle = styles.systemText;
        break;
      case 'prompt':
        textStyle = styles.promptText;
        break;
    }

    return (
      <Text key={line.id} style={textStyle}>
        {line.text}
      </Text>
    );
  };

  if (!currentSession) {
    return (
      <View style={styles.noSessionContainer}>
        <Text variant="bodyLarge" style={styles.noSessionText}>
          セッションが選択されていません
        </Text>
        <Text variant="bodyMedium" style={styles.noSessionSubtext}>
          セッション画面から接続するセッションを選択してください
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      
      <View style={styles.header}>
        <Chip mode="outlined" style={styles.sessionChip}>
          セッション: {currentSession}
        </Chip>
        <View style={styles.headerActions}>
          <IconButton
            icon="refresh"
            size={20}
            onPress={() => console.log('Refresh terminal')}
          />
          <IconButton
            icon="settings"
            size={20}
            onPress={() => console.log('Terminal settings')}
          />
        </View>
      </View>

      <Surface style={styles.terminal}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.outputContainer}
          showsVerticalScrollIndicator={false}>
          {output.map(renderOutputLine)}
        </ScrollView>
      </Surface>

      <View style={styles.specialKeysContainer}>
        <Button
          mode="outlined"
          onPress={() => handleSpecialKey('ctrl-c')}
          style={styles.specialKey}
          compact>
          Ctrl+C
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleSpecialKey('tab')}
          style={styles.specialKey}
          compact>
          Tab
        </Button>
        <Button
          mode="outlined"
          onPress={() => handleSpecialKey('clear')}
          style={styles.specialKey}
          compact>
          Clear
        </Button>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.commandInput}
          value={command}
          onChangeText={setCommand}
          placeholder="コマンドを入力..."
          placeholderTextColor="#999"
          multiline={false}
          onSubmitEditing={handleSendCommand}
          returnKeyType="send"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSendCommand}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sessionChip: {
    backgroundColor: '#e3f2fd',
  },
  headerActions: {
    flexDirection: 'row',
  },
  terminal: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    elevation: 2,
  },
  outputContainer: {
    flex: 1,
    padding: 12,
  },
  outputText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  commandText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 20,
  },
  errorText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#f44336',
    lineHeight: 20,
  },
  systemText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#2196F3',
    lineHeight: 20,
  },
  promptText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  specialKeysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  specialKey: {
    flex: 1,
    marginHorizontal: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  commandInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    marginLeft: 8,
  },
  noSessionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noSessionText: {
    marginBottom: 8,
    color: '#666',
  },
  noSessionSubtext: {
    textAlign: 'center',
    color: '#999',
  },
});