# Claude Code Mobile Client

A React Native mobile application for remote access to Claude Code sessions running on servers. Enable asynchronous development workflows with push notifications and seamless session management.

## 🎯 Project Status

**Phase 1: Foundation (✅ Complete)**
- Basic project structure and navigation
- UI components and state management 
- Core screens implementation

**Phase 2: Integration (🚧 Next)**
- SSH connectivity and authentication
- Tmux session management
- Push notifications

## 🚀 Features

### Current Implementation
- 📱 **Cross-platform**: iOS, Android, and Web support via Expo
- 🎨 **Material Design**: Clean, consistent UI with React Native Paper
- 🔄 **State Management**: Redux Toolkit for predictable state updates
- 🧭 **Navigation**: File-based routing with Expo Router
- 🔒 **TypeScript**: Full type safety throughout the application

### Planned Features
- 🌐 **SSH Connectivity**: Secure connections to remote servers
- ⚡ **Session Management**: Create, list, and manage tmux sessions
- 💬 **Terminal Interface**: Real-time command execution and output
- 🔔 **Push Notifications**: Get notified when Claude Code needs input
- 🔑 **Secure Storage**: Encrypted credential management

## 🛠️ Tech Stack

- **Framework**: React Native + Expo (SDK 53)
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: Expo Router
- **UI Library**: React Native Paper (Material Design)
- **Future**: SSH connectivity, Push notifications, Secure storage

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (optional, for easier development)

### Setup
```bash
# Clone the repository
git clone https://github.com/bamps53/claude-code-mobile.git
cd claude-code-mobile

# Install dependencies
npm install

# Start the development server
npm start
```

### Platform-specific Setup
```bash
# iOS (requires macOS and Xcode)
npm run ios

# Android (requires Android Studio or emulator)
npm run android

# Web development
npm run web
```

## 🏗️ Project Structure

```
├── app/                     # Expo Router screens
│   ├── (tabs)/             # Main tab navigation
│   │   ├── _layout.tsx     # Tab layout configuration
│   │   ├── session.tsx     # Session management screen
│   │   └── terminal.tsx    # Terminal interface screen
│   ├── _layout.tsx         # Root layout with providers
│   ├── server-connection.tsx # SSH connection setup
│   └── settings.tsx        # App settings and preferences
├── src/
│   ├── api/               # SSH/API communication (planned)
│   ├── components/        # Reusable UI components (planned)
│   ├── hooks/             # Custom React hooks (planned)
│   ├── store/             # Redux Toolkit configuration
│   │   ├── index.ts       # Store setup
│   │   ├── authSlice.ts   # Authentication state
│   │   └── sessionSlice.ts # Session management state
│   ├── theme/             # App theming
│   │   └── index.ts       # Material Design theme
│   └── utils/             # Utility functions (planned)
├── assets/                # Static assets (icons, images)
├── docs/                  # Documentation
│   └── design_doc.md      # Original design specification
└── CLAUDE.md              # Claude Code specific guidance
```

## 🧑‍💻 Development

### Available Scripts
```bash
# Development
npm start              # Start Expo development server
npm run android        # Run on Android device/emulator
npm run ios           # Run on iOS device/simulator
npm run web           # Run in web browser

# Quality checks
npx tsc --noEmit      # TypeScript type checking
npx eslint . --fix    # Linting and auto-fix
npm test              # Run tests (when implemented)

# Production builds
eas build --platform all  # Build for iOS and Android (requires EAS)
```

### Development Workflow
1. **Start Development Server**: `npm start`
2. **Open on Device**: Scan QR code with Expo Go app
3. **Make Changes**: Edit files and see live reload
4. **Test**: Verify on multiple platforms
5. **Commit**: Use conventional commits for changes

## 📱 Screen Overview

### Server Connection (`/server-connection`)
- SSH credential input form (hostname, port, username)
- Connection validation and error handling
- Secure credential storage (planned)

### Session Management (`/(tabs)/session`)
- List of active and inactive tmux sessions
- Create new sessions with FAB
- Session selection and navigation to terminal

### Terminal Interface (`/(tabs)/terminal`)
- Command input with send button
- Terminal output display with monospace font
- Special key buttons (Ctrl+C, Tab, arrows)
- Real-time SSH I/O (planned)

### Settings (`/settings`)
- Connection status and server information
- Disconnect functionality
- App preferences (notifications, theme)

## 🔮 Next Development Phase

### SSH Integration
```bash
# Install SSH library
npm install react-native-ssh-sftp
# or alternative SSH solution
```

**Implementation priorities:**
1. SSH connection establishment
2. Credential secure storage with Expo Secure Store
3. SSH key pair generation and management
4. Connection error handling and retry logic

### Tmux Commands Implementation
```typescript
// Core tmux operations to implement
interface TmuxAPI {
  createSession(name: string): Promise<Session>;
  listSessions(): Promise<Session[]>;
  attachSession(id: string): Promise<void>;
  killSession(id: string): Promise<void>;
  sendCommand(sessionId: string, command: string): Promise<void>;
}
```

### Push Notifications
1. Configure Expo Notifications
2. Implement server-side monitoring script
3. Set up FCM/APNS integration
4. Handle background notification processing

## 🤝 Contributing

### Development Standards
- Use TypeScript for all new code
- Follow Material Design principles
- Write unit tests for utilities and hooks
- Use conventional commits
- Test on both iOS and Android

### Code Quality
- Run `npx tsc --noEmit` before committing
- Use `npx eslint . --fix` for code formatting
- Follow existing patterns in Redux slices
- Document complex functions with JSDoc

## 📄 License

This project is private and proprietary.

## 🔗 Related Documentation

- [Design Document](./docs/design_doc.md) - Original Japanese specification
- [CLAUDE.md](./CLAUDE.md) - Claude Code specific guidance
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

Built with ❤️ for seamless Claude Code mobile access