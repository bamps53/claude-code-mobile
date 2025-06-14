# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile client application for Claude Code, designed to provide remote access to Claude Code sessions running on servers. The app enables asynchronous workflows through push notifications and management of multiple concurrent sessions.

**Tech Stack:** TypeScript + React Native + Expo (EAS Build)

**⚠️ Important**: This app uses native SSH implementation for production readiness. See `ARCHITECTURE_DECISIONS.md` for technical decision rationale.

## Implementation Status

### ✅ Completed
- Basic Expo + React Native + TypeScript project setup
- Redux Toolkit store configuration with auth and session slices
- Expo Router navigation with tab-based layout
- React Native Paper Material Design integration
- Core screens: server connection, session management, terminal interface, settings
- Project structure following design document specifications
- **Native SSH connectivity via react-native-ssh-sftp (`ssh-native.ts`) - PRODUCTION READY**
- Direct SSH connections without proxy server requirements
- Tmux session management (create, list, delete, attach) via native SSH

### 🚧 In Progress / TODO
- Expo Secure Store credential persistence
- Push notification setup and server monitoring  
- Real terminal I/O streaming for attached sessions
- SSH key pair generation and management
- EAS Build configuration for production deployment

## Architecture

### Core Technologies
- **Framework:** React Native with Expo (EAS Build for native features) ✅
- **Language:** TypeScript for type safety ✅
- **State Management:** Redux Toolkit for complex app state ✅
- **Navigation:** Expo Router (file-based routing) ✅
- **UI Components:** React Native Paper (Material Design) ✅
- **Communication:** Direct SSH via react-native-ssh-sftp (`ssh-native.ts`) for Claude Code sessions ✅
- **Secure Storage:** Expo Secure Store for connection credentials 🚧
- **Push Notifications:** Expo Notifications (FCM/APNS) 🚧

### Current Directory Structure
```
/
├── app/                     # Expo Router screens
│   ├── (tabs)/             # Main tab navigation
│   │   ├── session.tsx     # Session management
│   │   └── terminal.tsx    # Terminal/chat interface
│   ├── server-connection.tsx # Server setup
│   └── settings.tsx        # App settings
├── src/
│   ├── api/               # SSH/API communication
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Redux slices (auth, session)
│   ├── theme/             # App theming
│   └── utils/             # Utility functions
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on specific platforms
npm run android
npm run ios
npm run web

# Build for production
eas build --platform all

# Run tests
npm test

# Type checking
npx tsc --noEmit

# Lint
npx eslint . --fix
```

## Current Implementation Details

### Implemented Features

#### Redux State Management
- **AuthSlice**: Connection config, authentication status, loading states
- **SessionSlice**: Session list, current session, terminal output, error handling
- **Store**: Configured with TypeScript support and proper typing

#### Screen Components
- **ServerConnectionScreen**: SSH credential input form with validation
- **SessionScreen**: Session list with creation FAB and session selection
- **TerminalScreen**: Terminal interface with command input and special key buttons
- **SettingsScreen**: Connection status and app configuration options

#### Navigation Structure
- **Expo Router**: File-based routing with TypeScript support
- **Tab Layout**: Material Design tabs for main navigation
- **Stack Navigation**: Modal screens for connection and settings

#### UI/UX Implementation
- **Material Design**: React Native Paper components throughout
- **Theme Configuration**: Centralized color scheme and typography
- **Responsive Layout**: Proper spacing and mobile-optimized interface

### Implemented SSH Integration
- **WebSocket SSH:** The client uses `src/api/websocket-ssh.ts` to establish a WebSocket connection to a backend server.
- **Backend Manages SSH:** The backend server is responsible for managing the actual SSH connections to target hosts and handling Tmux sessions.
- **Client-Server Protocol:** The client sends commands (e.g., connect, send command, create session) and receives responses/output over the WebSocket.
- **Error Handling:** Connection and command errors from the WebSocket/SSH process are relayed to the client and displayed.

#### Tmux Session Management (via WebSocket)
- Tmux session operations (create, list, attach, kill) are requested by the client via WebSocket messages.
- The backend server executes these Tmux commands on the target host.

#### Terminal I/O Streaming (via WebSocket)
- Real-time stdout/stdin is relayed between the client and the server over the WebSocket connection.
- The `websocket-ssh.ts` module handles sending input and receiving output.
- Special key sequences (Ctrl+C, Tab, arrows) are translated by the client and sent as appropriate commands or sequences via the WebSocket.

#### Security & Storage
- Expo Secure Store integration for credentials
- SSH private key secure generation and storage
- Connection credential encryption
- Biometric authentication for app access

#### Push Notifications
- Server-side monitoring script for terminal bell (`\x07`)
- FCM/APNS token registration and management
- Background notification handling
- Deep linking to specific sessions

## State Management

### Auth Slice
- SSH connection credentials
- Authentication status
- Server configuration

### Session Slice  
- Active tmux sessions list
- Current session state
- Session history and metadata

## Security Considerations
- All connection credentials stored in Expo Secure Store
- SSH key pair generation and management within app
- No hardcoded server URLs or authentication data
- Secure push notification token handling

# Steps for resolving an issue

1. Create a branch without checking it out
2. Create a worktree with the same name as the branch under ./workspace/
3. Move to that worktree
4. Resolve the issue
5. Verify that the issue is actually resolved (for bug fixes, implement and run reproduction tests)
6. Run all tests
7. Run lint/format checks
8. Update documentation
9. Push to remote
10. Create a Pull Request
11. Return to the original directory
12. Delete the worktree