# Debugging Guide for Claude Code Mobile

## React Native Debugger Setup

Since Flipper has compatibility issues with React 19, we recommend using React Native Debugger or Chrome DevTools for debugging.

### Option 1: React Native Debugger (Recommended)

1. **Install React Native Debugger**:

   ```bash
   # macOS
   brew install --cask react-native-debugger

   # Windows/Linux
   # Download from: https://github.com/jhen0409/react-native-debugger/releases
   ```

2. **Start debugging**:
   ```bash
   npm start
   # In Expo DevTools, enable "Debug Remote JS"
   ```

### Option 2: Chrome DevTools

1. **Enable remote debugging**:

   ```bash
   npm start
   # Press 'd' in terminal or enable "Debug Remote JS" in Expo DevTools
   ```

2. **Open Chrome DevTools**:
   - Open Chrome and go to `chrome://inspect`
   - Click "Configure" and add `localhost:19001`
   - Click "Inspect" next to your app

### Option 3: Expo DevTools

For development builds:

```bash
# Start with dev client
npx expo start --dev-client

# Use Expo DevTools for debugging
# - Element inspector
# - Network requests
- Performance monitoring
```

## Development Build Debugging

For EAS development builds (required for SSH library):

1. **Create development build**:

   ```bash
   eas build --profile development --platform android
   # or
   eas build --profile development --platform ios
   ```

2. **Install on device and start development server**:

   ```bash
   npx expo start --dev-client
   ```

3. **Open development app on device** and scan QR code

## Debugging Features

### State Management (Zustand)

- Use Redux DevTools extension with Zustand devtools middleware
- View state changes in real-time

### Network Debugging

- Monitor SSH connections and API calls
- Use React Native Network Inspector

### Performance

- Use React Native Performance Monitor
- Profile component renders with React DevTools Profiler
