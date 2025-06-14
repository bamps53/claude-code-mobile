import React from 'react';
import { WebSocketSSHManager } from '../api/websocket-ssh'; // Import the actual class

export interface SSHContextType {
  sshManager: WebSocketSSHManager | null; // Use WebSocketSSHManager as the type
  // Potentially other connection status or methods related to SSH management
}

// Create a context with a default value (null for sshManager initially)
const SSHContext = React.createContext<SSHContextType>({
  sshManager: null,
});

export default SSHContext;
