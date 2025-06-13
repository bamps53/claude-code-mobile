# [TEST] Unit Tests - Redux Store Slices

## Description
Implement comprehensive unit tests for all Redux store slices managing application state.

## Acceptance Criteria

### Auth Slice (`src/store/authSlice.ts`)
- [ ] Test initial state configuration
- [ ] Test `setConnectionInfo` action and state update
- [ ] Test `setAuthStatus` action (connected/disconnected/connecting)
- [ ] Test `clearCredentials` action
- [ ] Test `updateServerConfig` action
- [ ] Test state persistence integration
- [ ] Test reducer error handling for invalid payloads

### Session Slice (`src/store/sessionSlice.ts`)
- [ ] Test initial state with empty session list
- [ ] Test `addSession` action and state update
- [ ] Test `removeSession` action and state cleanup
- [ ] Test `setActiveSession` action
- [ ] Test `updateSessionStatus` action (active/inactive/error)
- [ ] Test `setSessionList` action for bulk updates
- [ ] Test session metadata handling (creation time, last activity)
- [ ] Test concurrent session management

### Selectors
- [ ] Test auth selectors (isConnected, getConnectionInfo)
- [ ] Test session selectors (getActiveSessions, getCurrentSession)
- [ ] Test derived state selectors
- [ ] Test memoization performance

### Store Configuration
- [ ] Test store initialization
- [ ] Test middleware configuration (persist, devtools)
- [ ] Test root reducer combination
- [ ] Test store hydration from persisted state

## Implementation Requirements
- Use Redux Toolkit testing utilities
- Test all action creators and reducers
- Achieve >95% code coverage
- Include edge cases and error scenarios
- Test async actions with proper mocking

## Files to Test
- `src/store/authSlice.ts`
- `src/store/sessionSlice.ts`
- `src/store/index.ts`
- `src/store/selectors.ts`

## Dependencies
- Jest
- Redux Toolkit testing utilities
- Mock implementations for async storage

## Estimated Effort
**Medium** - 2-3 days

## Labels
`testing`, `unit-tests`, `redux`, `state-management`