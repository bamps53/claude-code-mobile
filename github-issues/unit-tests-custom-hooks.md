# [TEST] Unit Tests - Custom Hooks

## Description
Implement comprehensive unit tests for all custom React hooks that manage component logic and state.

## Acceptance Criteria

### SSH Connection Hook (`useSSHConnection`)
- [ ] Test hook initialization and default state
- [ ] Test connection establishment flow
- [ ] Test connection error handling
- [ ] Test connection cleanup on unmount
- [ ] Test connection retry logic
- [ ] Mock SSH API dependencies

### Session Management Hook (`useSessionManager`)
- [ ] Test session list fetching and state updates
- [ ] Test session creation and state synchronization
- [ ] Test session switching logic
- [ ] Test session deletion and cleanup
- [ ] Test error handling for failed session operations
- [ ] Mock Redux store interactions

### Terminal Stream Hook (`useTerminalStream`)
- [ ] Test stream initialization and setup
- [ ] Test real-time data handling and state updates
- [ ] Test command input processing
- [ ] Test stream error recovery
- [ ] Test cleanup on component unmount
- [ ] Mock SSH stream events

### Push Notification Hook (`usePushNotifications`)
- [ ] Test notification permission handling
- [ ] Test device token registration
- [ ] Test notification event handling
- [ ] Test notification state management
- [ ] Test background/foreground notification behavior
- [ ] Mock Expo Notifications API

### Theme Hook (`useTheme`)
- [ ] Test theme initialization from storage
- [ ] Test theme switching (light/dark mode)
- [ ] Test theme persistence
- [ ] Test theme provider integration
- [ ] Mock theme storage dependencies

### Storage Hook (`useSecureStorage`)
- [ ] Test secure data storage operations
- [ ] Test data retrieval and decryption
- [ ] Test error handling for storage failures
- [ ] Test data cleanup operations
- [ ] Mock Expo Secure Store API

## Implementation Requirements
- Use React Hooks Testing Library
- Test hook lifecycle and cleanup
- Achieve >90% code coverage
- Include error boundary scenarios
- Test both sync and async operations
- Mock all external dependencies

## Files to Test
- `src/hooks/useSSHConnection.ts`
- `src/hooks/useSessionManager.ts`
- `src/hooks/useTerminalStream.ts`
- `src/hooks/usePushNotifications.ts`
- `src/hooks/useTheme.ts`
- `src/hooks/useSecureStorage.ts`

## Dependencies
- Jest
- React Hooks Testing Library
- Mock implementations for Expo APIs
- Redux mock store for testing

## Estimated Effort
**Large** - 4-5 days

## Labels
`testing`, `unit-tests`, `hooks`, `react`