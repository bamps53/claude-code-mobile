# WebSocket SSH Server Setup Guide

This document explains how to set up a WebSocket SSH proxy server for the Claude Code mobile client.

## Architecture Overview

```
[Mobile App] <-- WebSocket --> [WebSocket SSH Proxy] <-- SSH --> [Target Server]
```

The WebSocket SSH proxy acts as a bridge between the mobile client and SSH servers, allowing:
- SSH connections through WebSocket (works with Expo Go)
- Session management (tmux)
- Real-time terminal I/O streaming
- Multiple concurrent connections

## Server Implementation Example

Here's a Node.js implementation using `ws` and `ssh2`:

```javascript
// server.js
const WebSocket = require('ws');
const { Client } = require('ssh2');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket SSH Proxy Server listening on port 8080');

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  let sshClient = null;
  let sshStream = null;
  
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message.type);
      
      switch (message.type) {
        case 'connect':
          await handleSSHConnect(message, ws);
          break;
          
        case 'disconnect':
          await handleSSHDisconnect(message, ws);
          break;
          
        case 'list_sessions':
          await handleListSessions(message, ws);
          break;
          
        case 'create_session':
          await handleCreateSession(message, ws);
          break;
          
        case 'attach_session':
          await handleAttachSession(message, ws);
          break;
          
        case 'kill_session':
          await handleKillSession(message, ws);
          break;
          
        case 'command':
          await handleCommand(message, ws);
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: error.message }
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    if (sshClient) {
      sshClient.end();
    }
  });
  
  // SSH Connection Handler
  async function handleSSHConnect(message, ws) {
    return new Promise((resolve, reject) => {
      const { host, port, username, password, privateKey } = message.payload;
      
      sshClient = new Client();
      
      sshClient.on('ready', () => {
        console.log('SSH connection established');
        ws.send(JSON.stringify({
          type: 'connected',
          id: message.id
        }));
        resolve();
      });
      
      sshClient.on('error', (err) => {
        console.error('SSH connection error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: `SSH connection failed: ${err.message}` },
          id: message.id
        }));
        reject(err);
      });
      
      const connectConfig = {
        host,
        port,
        username,
        ...(password && { password }),
        ...(privateKey && { privateKey })
      };
      
      sshClient.connect(connectConfig);
    });
  }
  
  // Session List Handler
  async function handleListSessions(message, ws) {
    if (!sshClient) {
      throw new Error('SSH not connected');
    }
    
    return new Promise((resolve, reject) => {
      sshClient.exec('tmux list-sessions -F "#{session_name},#{session_created},#{session_attached}"', (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        
        let output = '';
        stream.on('data', (data) => {
          output += data.toString();
        });
        
        stream.on('close', () => {
          const sessions = output.trim().split('\n')
            .filter(line => line.length > 0)
            .map(line => {
              const [name, created, attached] = line.split(',');
              return {
                id: name,
                name,
                created: new Date(parseInt(created) * 1000).toISOString(),
                isActive: attached === '1',
                lastActivity: new Date().toISOString()
              };
            });
            
          ws.send(JSON.stringify({
            type: 'sessions',
            payload: sessions,
            id: message.id
          }));
          resolve();
        });
      });
    });
  }
  
  // Session Creation Handler
  async function handleCreateSession(message, ws) {
    if (!sshClient) {
      throw new Error('SSH not connected');
    }
    
    const { name } = message.payload;
    
    return new Promise((resolve, reject) => {
      sshClient.exec(`tmux new-session -d -s "${name}"`, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        
        stream.on('close', (code) => {
          if (code === 0) {
            const newSession = {
              id: name,
              name,
              created: new Date().toISOString(),
              isActive: true,
              lastActivity: new Date().toISOString()
            };
            
            ws.send(JSON.stringify({
              type: 'session_created',
              payload: newSession,
              id: message.id
            }));
            resolve();
          } else {
            reject(new Error(`Failed to create session: exit code ${code}`));
          }
        });
      });
    });
  }
  
  // Session Attachment Handler
  async function handleAttachSession(message, ws) {
    if (!sshClient) {
      throw new Error('SSH not connected');
    }
    
    const { name } = message.payload;
    
    return new Promise((resolve, reject) => {
      sshClient.shell((err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        
        sshStream = stream;
        
        // Attach to tmux session
        stream.write(`tmux attach-session -t "${name}"\n`);
        
        // Set up data forwarding
        stream.on('data', (data) => {
          ws.send(JSON.stringify({
            type: 'output',
            payload: {
              data: data.toString(),
              timestamp: new Date().toISOString(),
              type: 'stdout'
            }
          }));
        });
        
        ws.send(JSON.stringify({
          type: 'connected',
          id: message.id
        }));
        resolve();
      });
    });
  }
  
  // Session Kill Handler
  async function handleKillSession(message, ws) {
    if (!sshClient) {
      throw new Error('SSH not connected');
    }
    
    const { name } = message.payload;
    
    return new Promise((resolve, reject) => {
      sshClient.exec(`tmux kill-session -t "${name}"`, (err, stream) => {
        if (err) {
          reject(err);
          return;
        }
        
        stream.on('close', () => {
          ws.send(JSON.stringify({
            type: 'connected',
            id: message.id
          }));
          resolve();
        });
      });
    });
  }
  
  // Command Handler
  async function handleCommand(message, ws) {
    if (!sshStream) {
      throw new Error('No active session');
    }
    
    const { command } = message.payload;
    sshStream.write(command);
  }
  
  // Disconnect Handler
  async function handleSSHDisconnect(message, ws) {
    if (sshClient) {
      sshClient.end();
      sshClient = null;
    }
    
    ws.send(JSON.stringify({
      type: 'disconnected',
      id: message.id
    }));
  }
});
```

## Installation & Setup

1. **Install dependencies:**
```bash
npm init -y
npm install ws ssh2
```

2. **Run the server:**
```bash
node server.js
```

3. **Configure mobile app:**
Update the WebSocket URL in `websocket-ssh.ts`:
```typescript
constructor(private serverUrl: string = 'ws://YOUR_SERVER_IP:8080/ssh') {}
```

## Security Considerations

⚠️ **Important Security Notes:**

1. **Use HTTPS/WSS in production:**
```javascript
const server = require('https').createServer(sslOptions);
const wss = new WebSocket.Server({ server });
```

2. **Implement authentication:**
```javascript
// Add token-based authentication
ws.on('connection', (ws, req) => {
  const token = req.headers.authorization;
  if (!validateToken(token)) {
    ws.close(1008, 'Unauthorized');
    return;
  }
});
```

3. **Rate limiting:**
```javascript
// Implement rate limiting for commands
const rateLimiter = new Map();
```

4. **Input sanitization:**
```javascript
function sanitizeCommand(command) {
  // Sanitize shell commands
  return command.replace(/[;&|`$()]/g, '');
}
```

## Deployment Options

### Option 1: Docker Container
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY server.js ./
EXPOSE 8080
CMD ["node", "server.js"]
```

### Option 2: Cloud Functions
Deploy as a serverless function on AWS Lambda, Google Cloud Functions, or Vercel.

### Option 3: VPS/Dedicated Server
Run directly on a VPS with proper security configurations.

## Testing

Test the WebSocket server with a simple client:

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'connect',
    payload: {
      host: 'your-ssh-server.com',
      port: 22,
      username: 'your-username',
      password: 'your-password'
    },
    id: 'test-1'
  }));
});

ws.on('message', (data) => {
  console.log('Received:', JSON.parse(data));
});
```

## Benefits of WebSocket Approach

✅ **Expo Go Compatible** - Works without EAS Build  
✅ **Real-time Communication** - Bidirectional data flow  
✅ **Centralized SSH Management** - Server handles all SSH connections  
✅ **Multiple Client Support** - Share sessions across devices  
✅ **Better Security** - Credentials stay on server  
✅ **Easier Debugging** - Server-side logging and monitoring  

## Fallback Mode

The mobile app automatically falls back to mock mode when the WebSocket server is unavailable, allowing development and testing without a server setup.