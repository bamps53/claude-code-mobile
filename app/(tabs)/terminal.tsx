import React, { useState, useContext } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, TextInput, Button, Card, IconButton } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../src/store';
import { addTerminalOutput } from '../../src/store/sessionSlice';
import SSHContext from '../../src/contexts/SSHContext'; // Changed to default import

export default function TerminalScreen() {
  const dispatch = useDispatch();
  const { currentSession, terminalOutput } = useSelector((state: RootState) => state.session);
  const [input, setInput] = useState('');
  const { sshManager } = useContext(SSHContext); // Destructure sshManager

  const handleSendCommand = async () => {
    if (!input.trim() || !sshManager) return;

    dispatch(addTerminalOutput(`$ ${input}`));
    
    try {
      await sshManager.sendCommand(input);
      console.log('Command sent:', input);
    } catch (error: any) {
      console.error('Failed to send command:', error);
      dispatch(addTerminalOutput(`Error sending command: ${error.message}`));
    }

    setInput('');
  };

  const handleSpecialKey = async (key: string) => { // key is "Ctrl+C", "Tab", "Up", "Down"
    if (!sshManager) return;
    
    dispatch(addTerminalOutput(`[Sending: ${key}]`));
    try {
      let handled = false;
      if (key === 'Ctrl+C') {
        await sshManager.sendKeySequence('ctrl+c');
        handled = true;
      } else if (key === 'Tab') {
        await sshManager.sendKeySequence('tab');
        handled = true;
      } else if (key === 'Up') {
        await sshManager.sendCommand('\x1b[A'); // ANSI escape for Up Arrow
        handled = true;
      } else if (key === 'Down') {
        await sshManager.sendCommand('\x1b[B'); // ANSI escape for Down Arrow
        handled = true;
      }
      // Add other keys like 'Enter', 'Ctrl+D', 'Ctrl+Z' if UI buttons exist and sendKeySequence supports them.
      // Example: else if (key === 'Enter') { await sshManager.sendKeySequence('enter'); handled = true; }

      if (!handled) {
        // If the key is not one of the above, it might be a simple character or an unhandled special key.
        // Sending the key name itself (e.g., "F1") as a command is usually not what's intended for special function keys.
        // If 'key' could represent a literal character to send, then sshManager.sendCommand(key) would be appropriate here.
        // For now, we log a warning for unhandled special keys.
        console.warn(`Special key "${key}" is not explicitly handled. Not sending.`);
      }
    } catch (error: any) {
      console.error(`Failed to send special key "${key}":`, error);
      dispatch(addTerminalOutput(`Error sending special key ${key}: ${error.message}`));
    }
  };

  if (!sshManager) {
    return (
      <View style={styles.container}>
        <Text variant="headlineSmall">SSH Manager Not Available</Text>
        <Text variant="bodyMedium">Please ensure the SSH connection is established.</Text>
      </View>
    );
  }

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