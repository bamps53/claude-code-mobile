# Claude Code Mobile Client: DESIGN_DOC.md

- **Version**: 1.0
- **Last Updated**: June 15, 2025

## 1. Overview

### 1.1. Objective

To develop a secure and robust mobile application for iOS and Android that provides developers with on-the-go access to `claude code` sessions running on a remote server.

### 1.2. Key Value Propositions

- **Anywhere Access**: Connect to a remote development environment directly from a smartphone.
- **Asynchronous Workflows**: Receive real-time push notifications upon task completion within `claude code`.
- **Multi-Session Management**: Efficiently manage multiple parallel development tasks and `tmux` sessions.

## 2. Technical Requirements & Constraints

### 2.1. Core Requirements

- **Platform**: iOS & Android, built with React Native.
- **Connection Protocol**: Direct SSH connection.
- **Session Management**: The application will interface with `tmux` sessions on the remote server.
- **Security**: Mandates end-to-end encryption for data in transit and strong local encryption for credentials at rest.

### 2.2. Technical Constraints

- **Native Module Requirement**: EAS Build is mandatory due to the native dependencies of the core SSH library.
- **Offline Functionality**: Limited to managing local profiles. Core features require an active internet connection.
- **Performance**: Must be optimized for potentially unstable and low-bandwidth mobile network conditions.

## 3. System Architecture & Technology Stack

This section outlines the selected technologies for building, testing, and deploying the application.

### 3.1. Application Architecture

| Category               | Technology                                  | Why?                                                                                                                                                           |
| :--------------------- | :------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UI Components**      | **React Native Paper**                      | Material Design compliance ensures an intuitive UI. Provides a rich set of components and powerful theming (e.g., dark mode).                                  |
| **State Management**   | **Zustand**                                 | A simple, scalable, and performant state management solution. Ideal for managing multiple session states without boilerplate.                                  |
| **Navigation**         | **React Navigation**                        | The de-facto standard for navigation in React Native. Well-documented, feature-rich, and integrates seamlessly with Expo.                                      |
| **SSH Connection**     | **`@dylankenneally/react-native-ssh-sftp`** | A robust library to handle the core SSH and command execution functionalities required for this project.                                                       |
| **Terminal UI**        | **WebView + xterm.js**                      | The most powerful method to render a full-featured terminal. `xterm.js` is a battle-tested emulator (used in VS Code) capable of handling `tmux`.              |
| **Secure Storage**     | **Expo SecureStore**                        | For storing sensitive credentials. It uses the native OS secure enclaves (iOS Keychain, Android Keystore) for maximum security.                                |
| **Local Auth**         | **Expo Local Authentication**               | To implement secondary, app-level security (PIN/Biometrics) as per the security design.                                                                        |
| **Push Notifications** | **Expo Notifications** & **FCM/APNS**       | `Expo Notifications` for handling incoming notifications on the client. Requires integration with FCM/APNS for real-time delivery from a server-side listener. |

### 3.2. Testing Strategy

| Category             | Technology                              | Why?                                                                                                                                |
| :------------------- | :-------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Unit/Integration** | **Jest + React Native Testing Library** | The industry standard for testing React Native components and logic. Promotes user-centric tests that are resilient to refactoring. |
| **End-to-End (E2E)** | **Maestro**                             | A modern, declarative mobile UI testing framework. YAML-based test flows that are easy to write and maintain, with excellent React Native support. |

### 3.3. Developer Experience (DX) & Tooling

| Category               | Technology                     | Why?                                                                                                                                                  |
| :--------------------- | :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Linting/Formatting** | **ESLint & Prettier**          | To enforce consistent code style and catch potential errors early. Automated with Husky on pre-commit hooks.                                          |
| **CI/CD**              | **GitHub Actions + EAS Build** | To automate testing and building. EAS Build is essential for creating builds with our custom native dependencies.                                     |
| **Debugging**          | **Flipper**                    | The recommended debugging platform. It enables live inspection of the UI layout, state, logs, and more, drastically improving the debugging workflow. |

## 4. Functional Design

### 4.1. SSH Connection Management

- **Objective**: To establish and manage secure connections to remote servers.
- **Functional Requirements**:
  - Support for both password and SSH key-based authentication.
  - Encrypted local storage for all connection credentials.
  - Monitor connection status and provide auto-reconnect capabilities.
  - Manage and store connection profiles for multiple servers.

### 4.2. `tmux` Session Management

- **Objective**: To manage `claude code` sessions running within `tmux` on the remote server.
- **Functional Requirements**:
  - List active `tmux` sessions with metadata (e.g., creation time, last activity).
  - Create new sessions.
  - Attach to and detach from existing sessions.
  - Terminate (kill) sessions.
  - Real-time updates of session states.

### 4.3. Terminal Interface

- **Objective**: To provide a direct, interactive terminal for `claude code`.
- **Functional Requirements**:
  - Real-time command input and output display.
  - Full support for standard terminal escape sequences (colors, cursor movement).
  - Command history functionality.
  - Support for special key inputs (e.g., `Ctrl+C`, `Tab`, Arrow Keys).
  - User-configurable text size and color themes.

### 4.4. Push Notification System

- **Objective**: To provide asynchronous notifications for task completion.
- **Technical Design**:
  - **Server-Side**: A listener process on the server will monitor `tmux` output. It will trigger a notification upon detecting a specific signal, such as the BEL character (`\x07`).
  - **Push Delivery**: The server-side listener will use Firebase Cloud Messaging (FCM) for Android and Apple Push Notification service (APNS) for iOS to deliver real-time push notifications.
  - **Client-Side**: The app will handle background notification reception and navigate the user to the relevant session upon opening (deep linking).

## 5. Security Design

### 5.1. Data Protection

- **Credentials**: All credentials (passwords, private keys) will be encrypted and stored locally using `Expo SecureStore`.
- **Data in Transit**: All communication will be encrypted using standard SSH cryptographic protocols.
- **Session Data**: Terminal output and session data will be held in-memory only and will not be persisted to disk on the mobile device.

### 5.2. Authentication Strategy

- **Primary Authentication**: SSH protocol (password or public key).
- **Secondary Authentication**: App-level security via PIN or Biometrics (`Face ID`/`Touch ID`) to unlock the application, implemented with `Expo Local Authentication`.
- **Session Inactivity**: The app will feature a configurable auto-timeout setting that locks the app after a period of inactivity.

## 6. Development & Debugging Workflow

To ensure an easy and effective debugging experience on real devices, we will use **Development Builds**.

1.  **Setup (One-time)**: Create a development-specific build of the app using the command `eas build --profile development` and install the resulting `.ipa`/`.apk` file on a physical device.
2.  **Daily Workflow**:
    - Run the development server on the local machine with `npx expo start --dev-client`.
    - Open the installed development app on the device. It will connect to the development server.
3.  **Debugging**: Use the **Flipper** desktop application. It will automatically connect to the running development build and provide powerful, out-of-the-box tools for inspecting the UI, logs, state, crashes, and more. **This is the recommended workflow for all debugging.**
