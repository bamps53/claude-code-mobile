# [TEST] Unit Tests - SSH API Layer

## Description
Implement comprehensive unit tests for the SSH API layer that handles all SSH communication with remote servers.

## Acceptance Criteria

### SSH Connection Management
- [ ] Test SSH connection establishment with valid credentials
- [ ] Test SSH connection failure handling (invalid host, port, credentials)
- [ ] Test SSH connection timeout scenarios
- [ ] Test SSH connection cleanup and disposal
- [ ] Mock SSH library responses for consistent testing

### tmux Command Execution
- [ ] Test `tmux new -s <session_name> -d` command execution
- [ ] Test `tmux ls` command parsing and session list extraction
- [ ] Test `tmux attach -t <session_name>` command execution
- [ ] Test error handling for malformed tmux commands
- [ ] Test session name validation and sanitization

### SSH Stream Handling
- [ ] Test stdin/stdout stream management
- [ ] Test real-time data streaming
- [ ] Test stream error handling and recovery
- [ ] Test stream cleanup on connection termination
- [ ] Mock stream events for testing

### SSH Key Management
- [ ] Test SSH key pair generation
- [ ] Test public key extraction
- [ ] Test key validation
- [ ] Test secure key storage integration

## Implementation Requirements
- Use Jest as testing framework
- Mock `react-native-ssh-sftp` library
- Achieve >90% code coverage
- Include error boundary testing
- Test both success and failure scenarios

## Files to Test
- `src/api/ssh-client.ts`
- `src/api/tmux-commands.ts`
- `src/api/ssh-key-manager.ts`

## Dependencies
- Jest
- React Native Testing Library
- Mock implementations for SSH library

## Estimated Effort
**Medium** - 2-3 days

## Labels
`testing`, `unit-tests`, `ssh`, `api`