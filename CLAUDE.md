# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Code Mobile is a React Native application that provides secure mobile access to remote development environments through SSH connections and tmux session management. Built with Expo and designed for developers who need on-the-go access to their `claude code` sessions running on remote servers.

## Development Commands

### Essential Development Commands

```bash
# Start development server
npm start

# Platform-specific development
npm run android          # Launch on Android device/emulator
npm run ios             # Launch on iOS simulator (macOS only)

# Code Quality
npm run lint            # ESLint check and auto-fix
npm run format          # Format code with Prettier
npm run typecheck       # TypeScript type checking

# Testing
npm test                # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
npm run test:e2e        # Run all Maestro E2E tests
npm run test:e2e:smoke  # Run smoke tests only
npm run test:e2e:welcome # Run welcome screen tests
npm run test:e2e:navigation # Run navigation tests
npm run test:e2e:connection # Run connection tests
```

### Build Commands (EAS Build Required)

```bash
# Development builds (for on-device debugging)
eas build --profile development --platform ios
eas build --profile development --platform android

# Development builds (local)
eas build --profile development --platform ios --local
eas build --profile development --platform android --local

# Production builds
eas build --profile production --platform ios
eas build --profile production --platform android

# Start development client
npx expo start --dev-client
```

## Architecture Overview

### Core Technology Stack

- **React Native 0.79.3 + React 19** - Latest versions with Expo SDK 53
- **Zustand** - Lightweight state management with secure persistence
- **React Native Paper** - Material Design UI components with theming
- **React Navigation** - Stack and tab navigation
- **WebView + xterm.js** - Full-featured terminal emulation
- **@dylankenneally/react-native-ssh-sftp** - SSH connectivity (requires EAS Build)

### Testing Infrastructure

- **Unit Testing**: Jest with React Native Testing Library for component and logic tests
- **E2E Testing**: Maestro with YAML-based test flows for UI automation
- **Test Structure**:
  - `src/__tests__/` - Unit and integration tests
  - `tests/e2e/` - Maestro E2E test flows
  - `.maestro/config.yaml` - Maestro configuration

### State Management Architecture

The app uses a single Zustand store (`src/store/index.ts`) with:

- **Secure persistence** via Expo SecureStore for credentials and settings
- **In-memory session data** for security (no terminal output persistence)
- **Action-based mutations** with TypeScript interfaces
- **Multiple state slices**: connections, sessions, authentication, settings

Key state management patterns:

- Connection profiles stored securely with encrypted credentials
- Session states managed in memory with real-time updates
- Authentication state separate from persistent data
- Settings persisted with theme and security preferences

### Navigation Structure

```
App (Root with theme providers)
├── WelcomeScreen (Biometric authentication)
└── AuthenticatedTabs
    ├── ConnectionScreen (SSH profile management)
    ├── SessionsScreen (tmux session list)
    ├── SettingsScreen (app preferences)
    └── TerminalScreen (modal with xterm.js)
```

### Security Architecture

- **Multi-layer authentication**: SSH (primary) + biometrics/PIN (secondary)
- **Secure credential storage**: Expo SecureStore with native OS secure enclaves
- **Session timeout**: Configurable auto-lock functionality
- **No data persistence**: Terminal sessions kept in memory only for security

## Key Implementation Details

### SSH Connection Management

- Located in `src/store/index.ts` with mock implementations marked `TODO`
- Connection profiles support both password and SSH key authentication
- Auto-reconnection and connection monitoring capabilities
- Secure storage of credentials using Expo SecureStore

### Terminal Interface

- WebView-based terminal using xterm.js 5.3.0 in `src/screens/TerminalScreen.tsx`
- Full terminal emulation with escape sequences, colors, cursor movement
- Dynamic theming based on app theme settings
- Optimized for mobile with configurable font sizes and responsive design
- Real-time command input/output via WebView messaging

### tmux Session Management

- Session lifecycle operations: create, attach, detach, kill
- Real-time metadata tracking: creation time, last activity, window count
- Mock data currently in place (marked with `TODO` for real implementation)

## Development Workflow

### Required Setup for Native Features

EAS Build is **mandatory** due to the SSH library's native dependencies. Standard Expo Go cannot run this app.

1. **Development builds** for on-device debugging
2. **Install development build** on physical device
3. **Start development server** with `npx expo start --dev-client`
4. **Connect device** to development server via QR code

### Debugging

- React Native debugger tools (Flipper compatibility issues with React 19)
- WebView debugging for terminal interface
- Zustand DevTools for state inspection
- Detox for E2E testing with device synchronization

### Code Quality Enforcement

- **Husky pre-commit hooks** automatically run linting and formatting
- **TypeScript strict mode** enforces type safety
- **ESLint + Prettier** with comprehensive rule sets
- **lint-staged** for efficient pre-commit processing

## Current Implementation Status

### Completed Infrastructure

- Complete navigation and authentication flow
- Zustand store with secure persistence layer
- All major screen components with TypeScript interfaces
- Terminal interface with xterm.js integration
- Testing infrastructure (Jest, Detox, React Native Testing Library)
- Build configuration and development tooling

### Implementation TODOs

- **SSH connection implementation** - Replace mock connection logic with real SSH client
- **tmux session management** - Implement actual tmux command execution
- **Push notification system** - Server-side listener for task completion alerts
- **Connection profile CRUD** - Add/edit/delete functionality for SSH profiles
- **Settings screen completion** - Full implementation of preference management

## Development Workflow

For detailed development procedures, feature implementation phases, and quality assurance guidelines, see:

📖 **[Development Workflow Guide](./docs/DEVELOPMENT_WORKFLOW.md)**

### Quick Development Start

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Develop with continuous testing
npm test:watch
npm run typecheck
npm run lint

# Commit (Husky auto-runs quality checks)
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

## Important Notes

- **EAS Build dependency**: Cannot use standard Expo Go due to native SSH library
- **Security-first design**: Credentials encrypted, session data in-memory only
- **Mobile-optimized**: Designed for potentially unstable network conditions
- **TypeScript strict**: All new code must maintain strict type safety
- **Material Design**: UI follows Material Design 3 principles via React Native Paper
