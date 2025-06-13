import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../src/store';
import { addTerminalOutput } from '../../src/store/sessionSlice';

export default function TerminalScreen() {
  const dispatch = useDispatch();
  const { currentSession, terminalOutput } = useSelector((state: RootState) => state.session);
  const [input, setInput] = useState('');

  const handleSendCommand = () => {
    if (!input.trim()) return;

    // Add command to output
    dispatch(addTerminalOutput(`$ ${input}`));
    
    // TODO: Send command via SSH
    console.log('Sending command:', input);
    
    // Mock response
    setTimeout(() => {
      dispatch(addTerminalOutput(`Command executed: ${input}`));
    }, 1000);

    setInput('');
  };

  const handleSpecialKey = (key: string) => {
    // TODO: Send special key sequences via SSH
    console.log('Special key:', key);
    dispatch(addTerminalOutput(`[${key}]`));
  };

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall">No Session Selected</Text>
        <Text variant="bodyMedium">Please select a session first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.sessionInfo}>
        <Card.Content>
          <Text variant="titleMedium">Session: {currentSession.name}</Text>
          <Text variant="bodySmall">Status: {currentSession.isActive ? 'Active' : 'Inactive'}</Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.terminal} contentContainerStyle={styles.terminalContent}>
        {terminalOutput.map((line, index) => (
          <Text key={index} style={styles.terminalText}>
            {line}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.specialKeys}>
          <IconButton
            icon="keyboard-backspace"
            size={20}
            onPress={() => handleSpecialKey('Ctrl+C')}
          />
          <IconButton
            icon="keyboard-tab"
            size={20}
            onPress={() => handleSpecialKey('Tab')}
          />
          <IconButton
            icon="arrow-up"
            size={20}
            onPress={() => handleSpecialKey('Up')}
          />
          <IconButton
            icon="arrow-down"
            size={20}
            onPress={() => handleSpecialKey('Down')}
          />
        </View>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Enter command..."
            mode="outlined"
            multiline
            onSubmitEditing={handleSendCommand}
          />
          <Button
            mode="contained"
            onPress={handleSendCommand}
            style={styles.sendButton}
          >
            Send
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  sessionInfo: {
    marginBottom: 16,
  },
  terminal: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 12,
  },
  terminalContent: {
    paddingBottom: 20,
  },
  terminalText: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    marginTop: 16,
  },
  specialKeys: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    alignSelf: 'flex-end',
  },
});