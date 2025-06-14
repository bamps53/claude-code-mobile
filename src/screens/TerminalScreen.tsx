/**
 * Terminal interface screen using WebView and xterm.js
 * @description Provides full terminal functionality for tmux sessions
 */

import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ActivityIndicator, useTheme } from 'react-native-paper';
import { useAppStore } from '../store';
import { NavigationScreens } from '../types';

type TerminalScreenRouteProp = RouteProp<NavigationScreens, 'Terminal'>;

/**
 * Terminal screen component with xterm.js integration
 * @description Provides interactive terminal interface for SSH sessions
 * @returns React component with WebView terminal
 */
export default function TerminalScreen() {
  const theme = useTheme();
  const route = useRoute<TerminalScreenRouteProp>();
  const { sessionId, connectionId } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { connections, sessions, settings, sendCommand, attachToSession } =
    useAppStore();

  const connection = connections.find(c => c.id === connectionId);
  const session = sessions.find(s => s.id === sessionId);

  useEffect(() => {
    if (connection && session) {
      attachToSession(sessionId);
    }
  }, [sessionId, connectionId]);

  /**
   * Generates HTML content for xterm.js terminal
   * @returns HTML string with embedded xterm.js terminal
   */
  const generateTerminalHTML = () => {
    const { width } = Dimensions.get('window');
    const isDarkTheme = theme.dark || settings.theme === 'dark';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Terminal</title>
    <script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/xterm-addon-web-links@0.9.0/lib/xterm-addon-web-links.min.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
    <style>
        body {
            margin: 0;
            padding: 8px;
            background-color: ${isDarkTheme ? '#1e1e1e' : '#ffffff'};
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        #terminal {
            width: 100%;
            height: 100vh;
        }
        .xterm {
            padding: 0;
        }
        .xterm-viewport {
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div id="terminal"></div>
    <script>
        // Initialize xterm.js
        const terminal = new Terminal({
            fontSize: ${settings.fontSize || 14},
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            theme: {
                background: '${isDarkTheme ? '#1e1e1e' : '#ffffff'}',
                foreground: '${isDarkTheme ? '#d4d4d4' : '#000000'}',
                cursor: '${isDarkTheme ? '#ffffff' : '#000000'}',
                cursorAccent: '${isDarkTheme ? '#000000' : '#ffffff'}',
                selection: '${isDarkTheme ? '#264f78' : '#add6ff'}',
                black: '${isDarkTheme ? '#000000' : '#000000'}',
                red: '${isDarkTheme ? '#cd3131' : '#cd3131'}',
                green: '${isDarkTheme ? '#0dbc79' : '#00bc00'}',
                yellow: '${isDarkTheme ? '#e5e510' : '#949800'}',
                blue: '${isDarkTheme ? '#2472c8' : '#0451a5'}',
                magenta: '${isDarkTheme ? '#bc3fbc' : '#bc05bc'}',
                cyan: '${isDarkTheme ? '#11a8cd' : '#0598bc'}',
                white: '${isDarkTheme ? '#e5e5e5' : '#555555'}',
                brightBlack: '${isDarkTheme ? '#666666' : '#666666'}',
                brightRed: '${isDarkTheme ? '#f14c4c' : '#cd3131'}',
                brightGreen: '${isDarkTheme ? '#23d18b' : '#14ce14'}',
                brightYellow: '${isDarkTheme ? '#f5f543' : '#b5ba00'}',
                brightBlue: '${isDarkTheme ? '#3b8eea' : '#0451a5'}',
                brightMagenta: '${isDarkTheme ? '#d670d6' : '#bc05bc'}',
                brightCyan: '${isDarkTheme ? '#29b8db' : '#0598bc'}',
                brightWhite: '${isDarkTheme ? '#e5e5e5' : '#a5a5a5'}'
            },
            cursorBlink: true,
            cursorStyle: 'block',
            scrollback: 1000,
            tabStopWidth: 4,
            allowTransparency: false
        });

        // Load addons
        const fitAddon = new FitAddon.FitAddon();
        const webLinksAddon = new WebLinksAddon.WebLinksAddon();
        
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);

        // Open terminal in DOM
        terminal.open(document.getElementById('terminal'));
        
        // Fit terminal to container
        fitAddon.fit();

        // Handle terminal input
        terminal.onData((data) => {
            // Send data to React Native
            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'terminal_input',
                data: data
            }));
        });

        // Handle terminal resize
        terminal.onResize((size) => {
            window.ReactNativeWebView?.postMessage(JSON.stringify({
                type: 'terminal_resize',
                cols: size.cols,
                rows: size.rows
            }));
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });

        // Listen for messages from React Native
        window.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                
                switch (message.type) {
                    case 'terminal_output':
                        terminal.write(message.data);
                        break;
                    case 'terminal_clear':
                        terminal.clear();
                        break;
                    case 'terminal_focus':
                        terminal.focus();
                        break;
                    case 'terminal_resize':
                        fitAddon.fit();
                        break;
                }
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        // Focus terminal when loaded
        terminal.focus();

        // Send ready signal
        window.ReactNativeWebView?.postMessage(JSON.stringify({
            type: 'terminal_ready',
            cols: terminal.cols,
            rows: terminal.rows
        }));

        // Welcome message
        terminal.writeln('\\x1b[32mConnected to ${session?.name || 'session'}\\x1b[0m');
        terminal.writeln('\\x1b[90mType commands or press Ctrl+C to interrupt\\x1b[0m');
        terminal.write('\\x1b[36m$ \\x1b[0m');
    </script>
</body>
</html>`;
  };

  /**
   * Handles messages from WebView terminal
   * @param event - WebView message event
   */
  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case 'terminal_ready':
          setIsLoading(false);
          break;
        case 'terminal_input':
          if (connection && session) {
            sendCommand(sessionId, message.data);
          }
          break;
        case 'terminal_resize':
          // Handle terminal resize if needed
          break;
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  /**
   * Sends output to terminal
   * @param output - Output data to display
   */
  const sendToTerminal = (output: string) => {
    if (webViewRef.current) {
      const message = JSON.stringify({
        type: 'terminal_output',
        data: output,
      });
      webViewRef.current.postMessage(message);
    }
  };

  if (!connection || !session) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: generateTerminalHTML() }}
        onMessage={handleWebViewMessage}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView={true}
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
});
