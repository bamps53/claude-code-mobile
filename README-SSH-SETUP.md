# SSH Native Module Setup Guide

## Issue Summary

The SSH native module (`@dylankenneally/react-native-ssh-sftp`) returns null because it requires native code that is not available in Expo Go. This library contains native Android and iOS code that must be compiled into the app.

## Root Cause

1. **Native Module Requirement**: The SSH library uses native Android/iOS code for SSH connections
2. **Expo Go Limitation**: Expo Go only includes a predefined set of native modules
3. **Package Structure Issue**: The library had a package name mismatch that we've fixed with patch-package

## Solution

### Step 1: Patches Applied

We've already applied the following fixes:

1. **Fixed package structure**: The Android Java files were in the wrong directory (`me/keeex/rnssh` instead of `me/dylankenneally/rnssh`). This has been fixed and saved as a patch.

2. **Added patch-package**: Patches are automatically applied during `npm install` via the `postinstall` script.

### Step 2: Build with EAS

You **MUST** create a development build with EAS. The standard Expo Go app will not work.

```bash
# For local development build (if you have Android Studio/Xcode)
eas build --profile development --platform android --local
eas build --profile development --platform ios --local

# For cloud build
eas build --profile development --platform android
eas build --profile development --platform ios
```

### Step 3: Install and Run

1. **Install the development build** on your device:

   - Download the APK/IPA from the EAS build page
   - Or use the QR code provided by EAS

2. **Start the development server**:

   ```bash
   npx expo start --dev-client
   ```

3. **Connect your device** to the development server using the QR code

## Important Notes

- **Do NOT use** `expo start` without `--dev-client`
- **Do NOT use** Expo Go app from the app store
- **Always use** the custom development build created with EAS

## Verification

The SSH module will be properly loaded when:

- `NativeModules.RNSSHClient` is not null/undefined
- `SSHClient.connectWithPassword` is a function
- No "SSH native module not loaded" errors appear

## Troubleshooting

If you still see "SSH native module not loaded" errors:

1. **Clear cache and rebuild**:

   ```bash
   npx expo prebuild --clear
   eas build --profile development --platform android --clear-cache
   ```

2. **Verify patch was applied**:

   ```bash
   npm run postinstall
   # Should show: @dylankenneally/react-native-ssh-sftp@1.5.20 ✔
   ```

3. **Check native module loading**:
   - Open the app with the development build
   - Check console logs for `NativeModules.RNSSHClient`
   - It should show an object, not null/undefined

## Additional Configuration

The app is configured to work with the SSH library:

- Minimum Android SDK: 24 (required by SSH library)
- Package naming issues fixed via patch-package
- Autolinking enabled through Expo's build system
