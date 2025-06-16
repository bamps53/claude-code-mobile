# Tests Temporarily Disabled

Due to compatibility issues between Expo SDK 53 and Jest configuration, unit tests are temporarily disabled.

## Issue
- ReferenceError: You are trying to `import` a file outside of the scope of the test code
- This is related to Expo's new architecture in SDK 53

## TODO
- Update Jest configuration for Expo SDK 53 compatibility
- Consider migrating to Expo's recommended testing setup
- Fix module resolution issues

## Workaround
For now, rely on:
- TypeScript type checking (`npm run typecheck`)
- ESLint (`npm run lint`)
- E2E tests with Maestro (`npm run test:e2e`)