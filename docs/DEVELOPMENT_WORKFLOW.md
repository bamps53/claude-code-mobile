# Development Workflow Guide

## 🚀 Development Phases & Implementation Plan

This document outlines the structured approach for implementing the remaining features of Claude Code Mobile.

## Phase 1: Core SSH Functionality (High Priority)

### 1. SSH Connection Implementation

**Branch**: `feature/ssh-connection-implementation`

**Files to modify:**
- `src/store/index.ts` - Replace mock `connectToServer` function
- `src/utils/ssh.ts` - Create SSH connection utilities (new file)
- `src/types/index.ts` - Add SSH connection types

**Implementation requirements:**
- Integrate `@dylankenneally/react-native-ssh-sftp` library
- Support password and SSH key authentication
- Implement connection error handling with user-friendly messages
- Add automatic reconnection functionality
- Secure credential validation

**Testing:**
```bash
npm test src/__tests__/ssh.test.ts        # Unit tests
npm run test:e2e:connection               # E2E connection tests
```

### 2. tmux Session Management

**Branch**: `feature/tmux-session-management`

**Files to modify:**
- `src/store/index.ts` - Implement session management functions
- `src/utils/tmux.ts` - tmux command execution utilities (new file)
- `src/screens/SessionsScreen.tsx` - Remove mock data integration

**Implementation requirements:**
- Real-time tmux session listing via SSH commands
- Session creation with custom names
- Session attach/detach operations
- Session termination (kill) with confirmation
- Live session metadata updates (last activity, window count)

**Testing:**
```bash
npm test src/__tests__/tmux.test.ts       # Unit tests
npm run test:e2e:navigation               # E2E session tests
```

## Phase 2: UI/UX Completion (Medium Priority)

### 3. Connection Profile Management

**Branch**: `feature/connection-profile-crud`

**Files to modify:**
- `src/screens/ConnectionScreen.tsx` - Add CRUD operations
- `src/components/ConnectionForm.tsx` - New connection form component
- `src/components/ConnectionEditModal.tsx` - Edit modal component
- `src/store/index.ts` - Profile management actions

**Implementation requirements:**
- Add connection profile form with validation
- Edit existing connection profiles
- Delete connections with confirmation dialog
- Import/export connection profiles
- Connection testing functionality

### 4. Settings Screen Completion

**Branch**: `feature/settings-completion`

**Files to modify:**
- `src/screens/SettingsScreen.tsx` - Complete all settings functionality
- `src/components/ThemeSelector.tsx` - Theme selection component
- `src/components/SecuritySettings.tsx` - Security preferences component

**Implementation requirements:**
- Complete theme switching implementation
- Font size adjustment with live preview
- Biometric authentication setup
- Auto-timeout configuration
- Data export/import functionality
- App version and build information

## Phase 3: Advanced Features (Lower Priority)

### 5. Push Notification System

**Branch**: `feature/push-notifications`

**New files:**
- `server/notification-listener.js` - Server-side tmux output monitoring
- `src/services/notifications.ts` - Client notification handling
- `src/utils/notificationSetup.ts` - Push notification configuration

**Implementation requirements:**
- Server-side listener for BEL character (`\x07`) detection
- Firebase Cloud Messaging (FCM) integration
- Apple Push Notification Service (APNS) setup
- Deep linking to relevant sessions
- Notification preferences management

## 🔄 Recommended Development Flow

### 1. Feature Development Cycle

```bash
# 1. Create GitHub Issue
# Use issue templates for bug reports or feature requests

# 2. Create feature branch
git checkout main
git pull origin main
git checkout -b feature/descriptive-name

# 3. Development with continuous testing
npm test                    # Run unit tests
npm run test:watch          # Watch mode during development
npm run typecheck          # TypeScript validation
npm run lint               # Code quality checks

# 4. Commit with quality gates
git add .
git commit -m "feat: implement feature description"
# Husky automatically runs:
# - ESLint with auto-fix
# - Prettier formatting
# - Pre-commit quality checks

# 5. Push and create Pull Request
git push origin feature/descriptive-name
# Create PR on GitHub using the provided template

# 6. Automated CI/CD pipeline
# - Code quality checks (TypeScript, ESLint, Prettier)
# - Unit test execution with coverage
# - Security analysis and dependency audit
# - E2E smoke tests (if applicable)

# 7. Code review and merge
# - Address review feedback
# - Ensure all CI checks pass
# - Squash and merge to main

# 8. Automatic development build
# - EAS build triggered on main branch
# - Development apps updated automatically
```

### 2. Quality Assurance Standards

#### Commit Level
- **Husky pre-commit hooks**: ESLint, Prettier, basic validation
- **TypeScript strict mode**: All new code must be type-safe
- **Conventional commits**: Use `feat:`, `fix:`, `docs:`, etc.

#### Push Level
- **Pre-push hooks**: TypeScript compilation check
- **CI/CD validation**: Complete quality pipeline
- **Test coverage**: Maintain >80% coverage

#### Release Level
- **Production builds**: Automated EAS builds on version tags
- **Store submission**: Automatic submission to app stores
- **Release notes**: Generated from conventional commits

### 3. Testing Strategy

#### Unit Tests (Jest)
```bash
# Run all unit tests
npm test

# Watch mode during development
npm run test:watch

# Coverage report
npm run test:coverage

# Test specific files
npm test src/store/index.test.ts
```

#### E2E Tests (Maestro)
```bash
# Smoke tests (core functionality)
npm run test:e2e:smoke

# Feature-specific tests
npm run test:e2e:welcome
npm run test:e2e:navigation
npm run test:e2e:connection

# All E2E tests
npm run test:e2e
```

#### Integration Testing
- Test SSH connections with real servers
- Validate tmux session operations
- Test biometric authentication flows
- Verify secure storage functionality

## 🛠️ Development Environment Setup

### For New Developers

```bash
# 1. Clone repository
git clone https://github.com/bamps53/claude-code-mobile.git
cd claude-code-mobile

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Set up development environment
# Install Android Studio or Xcode
# Configure device/emulator

# 4. Create EAS development build
eas login
eas build --profile development --platform android
# or
eas build --profile development --platform ios

# 5. Start development server
npm start

# 6. Verify setup
npm test && npm run typecheck && npm run lint
```

### Environment Variables

Create `.env.local` file:
```env
# Expo configuration
EXPO_PUBLIC_API_URL=your-api-url
EXPO_PUBLIC_ENVIRONMENT=development

# Optional: Analytics
EXPO_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## 🚀 Release Process

### Development Releases

Automatic on every push to main:
```bash
git checkout main
git pull origin main
# Development builds automatically triggered
```

### Production Releases

```bash
# 1. Prepare release
git checkout main
git pull origin main

# 2. Update version
npm version patch    # for bug fixes
npm version minor    # for new features
npm version major    # for breaking changes

# 3. Push release tag
git push origin main --tags

# 4. Automatic production build and store submission
# CI/CD pipeline handles:
# - Production EAS builds
# - App store submissions
# - Release note generation
```

## 📊 Monitoring and Maintenance

### Code Quality Metrics
- **TypeScript coverage**: 100% (strict mode)
- **Test coverage**: >80%
- **ESLint violations**: 0
- **Security vulnerabilities**: 0 high/critical

### Performance Monitoring
- App startup time
- Memory usage monitoring
- Network request performance
- Crash reporting (via Expo)

### Dependency Management
- **Dependabot**: Automatic weekly dependency updates
- **Security audits**: Automated vulnerability scanning
- **License compliance**: Regular license verification

## 🆘 Troubleshooting Common Issues

### Development Build Issues
```bash
# Clear cache and rebuild
expo r -c
eas build --profile development --platform android --clear-cache
```

### Testing Issues
```bash
# Reset Jest cache
npm test -- --clearCache

# Reset Maestro state
maestro studio  # Interactive debugging
```

### Type Errors
```bash
# Full TypeScript check
npm run typecheck

# Clear TypeScript cache
rm -rf node_modules/.cache
npm install
```

## 📚 Additional Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Maestro Testing Documentation](https://maestro.mobile.dev/)
- [Project Architecture Guide](./CLAUDE.md)

---

This workflow ensures consistent, high-quality development with automated quality gates and comprehensive testing coverage.