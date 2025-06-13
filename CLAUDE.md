# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile client application for Claude Code, designed to provide remote access to Claude Code sessions running on servers. The app enables asynchronous workflows through push notifications and management of multiple concurrent sessions.

**Tech Stack:** TypeScript + React Native + Expo (EAS Build)

## Architecture

### Core Technologies
- **Framework:** React Native with Expo (EAS Build for native features)
- **Language:** TypeScript for type safety
- **State Management:** Redux Toolkit for complex app state
- **Navigation:** Expo Router (file-based routing)
- **UI Components:** React Native Paper (Material Design)
- **Communication:** SSH via `react-native-ssh-sftp` for Claude Code sessions
- **Secure Storage:** Expo Secure Store for connection credentials
- **Push Notifications:** Expo Notifications (FCM/APNS)

### Expected Directory Structure
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

## Key Implementation Details

### Session Management
- Uses `tmux` commands over SSH to manage Claude Code sessions
- `tmux new -s <session_name> -d` for creating sessions
- `tmux ls` for listing active sessions
- `tmux attach -t <session_name>` for connecting to sessions

### Push Notification System
- Server-side monitoring script watches for terminal bell character (`\x07`)
- Triggered by Claude Code's `terminal_bell` notification channel
- Uses `tmux pipe-pane` to monitor session output streams
- FCM/APNS integration through Expo Notifications

### SSH Authentication
- Public key authentication preferred
- App generates SSH key pairs internally
- Credentials stored securely with Expo Secure Store
- Connection details: hostname, port, username

### Terminal Interface
- Real-time SSH stdout/stdin streaming
- Special key combinations provided as buttons (Ctrl+C, etc.)
- Chat-like interface for Claude Code interaction
- Scrollable output view with command input field

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