# [TEST] Integration Tests - SSH Connection Flow

## Description
Implement integration tests for the complete SSH connection and session management workflow.

## Acceptance Criteria

### End-to-End SSH Connection
- [ ] Test complete connection flow from UI to SSH establishment
- [ ] Test connection with real SSH server (test environment)
- [ ] Test connection state propagation through Redux store
- [ ] Test UI updates reflecting connection status
- [ ] Test connection persistence across app restarts

### Session Management Integration
- [ ] Test session creation via SSH and UI updates
- [ ] Test session listing synchronization between server and app
- [ ] Test session switching and terminal view updates
- [ ] Test concurrent session handling
- [ ] Test session cleanup on disconnection

### Real-time Terminal Integration
- [ ] Test command execution through SSH to terminal display
- [ ] Test bidirectional communication (input/output)
- [ ] Test special character handling (Ctrl+C, etc.)
- [ ] Test long-running command handling
- [ ] Test terminal history persistence

### Error Recovery Integration
- [ ] Test network disconnection and reconnection handling
- [ ] Test SSH timeout recovery
- [ ] Test session recovery after connection loss
- [ ] Test error state propagation through app layers
- [ ] Test user notification of connection issues

### Push Notification Integration
- [ ] Test notification setup on successful connection
- [ ] Test device token registration with server monitoring
- [ ] Test notification trigger from Claude Code bell character
- [ ] Test notification handling in foreground/background states
- [ ] Test notification-to-session navigation

## Implementation Requirements
- Use real SSH test server or Docker container
- Test with actual tmux sessions
- Include network condition simulation
- Test state persistence across app lifecycle
- Achieve integration coverage >80%
- Include performance benchmarks

## Test Environment Setup
- Docker container with SSH server and tmux
- Mock FCM/APNS services for notifications
- Network simulation tools (slow, disconnected, etc.)
- Test user accounts and SSH keys

## Files Involved
- `src/api/` (SSH layer)
- `src/store/` (State management)
- `src/hooks/` (Connection hooks)
- `app/` (Screen components)

## Dependencies
- Docker for test SSH server
- Jest with integration test utilities
- React Native Testing Library
- Network simulation tools
- Mock notification services

## Estimated Effort
**Large** - 5-6 days

## Labels
`testing`, `integration-tests`, `ssh`, `session-management`