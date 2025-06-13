# [TEST] E2E Tests - Complete User Workflows

## Description
Implement end-to-end tests covering complete user workflows from app launch to Claude Code interaction.

## Acceptance Criteria

### First-Time User Setup
- [ ] Test initial app launch and onboarding flow
- [ ] Test server connection setup screen
- [ ] Test SSH key generation and display
- [ ] Test connection validation and success feedback
- [ ] Test error handling for invalid server details

### Session Management Workflow
- [ ] Test new session creation from session list
- [ ] Test session naming and metadata
- [ ] Test session selection and terminal navigation
- [ ] Test multiple session switching
- [ ] Test session deletion and confirmation

### Claude Code Interaction
- [ ] Test command input and execution
- [ ] Test Claude Code response handling
- [ ] Test file operations through Claude Code
- [ ] Test code generation and editing workflows
- [ ] Test long-running task management

### Push Notification Workflow
- [ ] Test notification setup during session creation
- [ ] Test app backgrounding and notification reception
- [ ] Test notification tap and session restoration
- [ ] Test notification content and actions
- [ ] Test multiple session notifications

### Settings and Configuration
- [ ] Test theme switching (light/dark mode)
- [ ] Test connection settings modification
- [ ] Test notification preferences
- [ ] Test data export/import functionality
- [ ] Test app reset and cleanup

### Error Scenarios
- [ ] Test network connectivity loss during session
- [ ] Test server unavailability handling
- [ ] Test invalid command error handling
- [ ] Test app crash recovery
- [ ] Test corrupt data recovery

## Cross-Platform Testing
- [ ] Test iOS-specific behaviors and UI
- [ ] Test Android-specific behaviors and UI
- [ ] Test platform-specific notification handling
- [ ] Test device orientation changes
- [ ] Test different screen sizes and densities

## Performance Testing
- [ ] Test app startup time
- [ ] Test large terminal output handling
- [ ] Test memory usage during long sessions
- [ ] Test battery usage optimization
- [ ] Test concurrent session performance

## Implementation Requirements
- Use Detox for React Native E2E testing
- Test on real devices (iOS/Android)
- Include accessibility testing
- Test different network conditions
- Record test execution videos
- Include performance benchmarks

## Test Environment
- Real iOS/Android devices or simulators
- Test SSH server with Claude Code installed
- Mock notification servers
- Network condition simulation
- Performance monitoring tools

## Dependencies
- Detox E2E testing framework
- Real device testing infrastructure
- Claude Code test environment
- Performance monitoring tools
- Video recording capabilities

## Estimated Effort
**Extra Large** - 8-10 days

## Labels
`testing`, `e2e-tests`, `user-workflows`, `cross-platform`