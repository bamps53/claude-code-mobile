# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile client application for Claude Code, designed to provide remote access to Claude Code sessions running on servers. The app enables asynchronous workflows through push notifications and management of multiple concurrent sessions.

**Tech Stack:** TypeScript + React Native + Expo (EAS Build)

## Implementation Status

### ✅ Completed
- Basic Expo + React Native + TypeScript project setup
- Redux Toolkit store configuration with auth and session slices
- Expo Router navigation with tab-based layout
- React Native Paper Material Design integration
- Core screens: server connection, session management, terminal interface, settings
- Project structure following design document specifications

### 🚧 In Progress / TODO
- SSH connectivity integration (requires `react-native-ssh-sftp` or similar)
- Tmux session management commands implementation
- Expo Secure Store credential persistence
- Push notification setup and server monitoring
- Real terminal I/O streaming
- SSH key pair generation and management

## Architecture

### Core Technologies
- **Framework:** React Native with Expo (EAS Build for native features) ✅
- **Language:** TypeScript for type safety ✅
- **State Management:** Redux Toolkit for complex app state ✅
- **Navigation:** Expo Router (file-based routing) ✅
- **UI Components:** React Native Paper (Material Design) ✅
- **Communication:** SSH via `react-native-ssh-sftp` for Claude Code sessions 🚧
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

### Planned Implementation

#### SSH Integration (Next Phase)
- Integration with `react-native-ssh-sftp` or similar library
- SSH key pair generation and secure storage
- Real SSH connection establishment and management
- Error handling for connection failures

#### Tmux Session Management
```bash
# Commands to implement:
tmux new -s <session_name> -d     # Create detached session
tmux ls                           # List all sessions  
tmux attach -t <session_name>     # Attach to session
tmux kill-session -t <session_name> # Delete session
```

#### Terminal I/O Streaming
- Real-time stdout/stdin relay over SSH
- Terminal escape sequence handling
- Command history and autocompletion
- Special key sequence transmission (Ctrl+C, Tab, arrows)

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