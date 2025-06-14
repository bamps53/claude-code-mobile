# Claude Code Mobile 📱

[![CI/CD Pipeline](https://github.com/bamps53/claude-code-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/bamps53/claude-code-mobile/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)

Secure mobile access to remote development environments through SSH connections and tmux session management. Built with React Native and Expo for developers who need on-the-go access to their `claude code` sessions.

## ✨ Features

- 🔐 **Secure SSH Connections** - Password and SSH key authentication
- 🖥️ **Full Terminal Emulation** - Complete xterm.js integration with tmux support
- 📱 **Mobile Optimized** - Designed for touch interfaces and mobile networks
- 🔒 **Multi-layer Security** - SSH + biometric/PIN authentication
- 🎨 **Material Design** - Beautiful, accessible UI with dark mode support
- ⚡ **Real-time Sessions** - Live tmux session management and monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio or Xcode for development

### Installation
```bash
# Clone the repository
git clone https://github.com/bamps53/claude-code-mobile.git
cd claude-code-mobile

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm start
```

### Development Builds (Required for SSH)
Standard Expo Go cannot run this app due to native SSH dependencies. You need EAS development builds:

```bash
# Create development build for Android
eas build --profile development --platform android

# Create development build for iOS (macOS only)
eas build --profile development --platform ios

# Start development server for dev client
npx expo start --dev-client
```

## 🧪 Testing

### Unit Tests
```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

### E2E Tests (Maestro)
```bash
npm run test:e2e:smoke      # Quick validation
npm run test:e2e:welcome    # Authentication flow
npm run test:e2e:navigation # Tab navigation
npm run test:e2e:connection # SSH connections
```

### Code Quality
```bash
npm run lint        # ESLint check and fix
npm run format      # Prettier formatting
npm run typecheck   # TypeScript validation
```

## 📖 Documentation

- [Development Guide](./CLAUDE.md) - Complete development instructions
- [Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md) - Feature implementation phases and development process
- [E2E Testing Guide](./docs/E2E_TESTING.md) - Maestro testing documentation
- [Design Document](./docs/DESIGN_DOC.md) - Architecture and technical decisions
- [Debugging Guide](./docs/DEBUGGING.md) - Development debugging setup

## 🏗️ Architecture

### Core Technologies
- **React Native 0.79.3** + **React 19** with Expo SDK 53
- **Zustand** for lightweight state management
- **React Native Paper** for Material Design components
- **React Navigation** for navigation
- **xterm.js** in WebView for terminal emulation
- **Expo SecureStore** for credential storage

### Security
- **Multi-layer authentication**: SSH + biometrics/PIN
- **Secure storage**: Native OS secure enclaves
- **In-memory sessions**: No terminal data persistence
- **Auto-timeout**: Configurable session locking

## 🔧 CI/CD

### Automated Workflows
- **Quality Checks**: TypeScript, ESLint, Prettier, Jest tests
- **Security Analysis**: Dependency auditing and vulnerability scanning
- **Development Builds**: Automatic EAS builds on main branch
- **Production Builds**: Automatic builds and store submission on releases

### Required Secrets
Configure these in GitHub repository settings:
- `EXPO_TOKEN` - Expo authentication token for EAS builds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow conventional commit format
- Maintain test coverage above 80%
- Run `npm run lint` and `npm run typecheck` before committing
- Add E2E tests for new user flows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📚 [Documentation](./CLAUDE.md)
- 🐛 [Report Issues](https://github.com/bamps53/claude-code-mobile/issues)
- 💬 [Discussions](https://github.com/bamps53/claude-code-mobile/discussions)

---

Built with ❤️ for developers who code on the go