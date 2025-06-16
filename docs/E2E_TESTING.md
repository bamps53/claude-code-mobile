# E2E Testing with Maestro

## Overview

Claude Code Mobile uses **Maestro** for End-to-End testing. Maestro is a modern, declarative mobile UI testing framework that uses YAML-based test flows.

## Why Maestro?

- **Declarative YAML syntax** - Easy to write and maintain
- **Excellent React Native support** - Native integration with Expo
- **Cross-platform** - Same tests work on iOS and Android
- **Fast execution** - Optimized for mobile UI testing
- **Visual debugging** - Built-in screenshot capabilities

## Setup Requirements

### Prerequisites

1. **Java JDK 11+** - Required for Maestro CLI
2. **Maestro CLI** - Installed globally
3. **Device/Emulator** - Android emulator or iOS simulator
4. **App running** - Development build on device

### Installation

```bash
# Install Maestro CLI (already done)
curl -Ls "https://get.maestro.mobile.dev" | bash
export PATH="$PATH":"$HOME/.maestro/bin"

# Verify installation
maestro --version
```

## Test Structure

### Directory Layout

```
tests/e2e/
├── smoke-test.yaml          # Quick validation tests
├── welcome-flow.yaml        # Authentication flow tests
├── navigation-flow.yaml     # Tab navigation tests
└── connection-flow.yaml     # SSH connection tests

.maestro/
└── config.yaml             # Maestro configuration
```

### Configuration

- **App ID**: `host.exp.exponent` (Expo Go)
- **Timeout**: 120s per flow, 15s per element
- **Screenshots**: Automatic on flow start/complete
- **Platform support**: iOS and Android

## Running Tests

### All Tests

```bash
npm run test:e2e
# or
maestro test tests/e2e/
```

### Specific Test Suites

```bash
npm run test:e2e:smoke      # Critical functionality
npm run test:e2e:welcome    # Authentication flow
npm run test:e2e:navigation # Tab navigation
npm run test:e2e:connection # SSH connections
```

### Individual Tests

```bash
maestro test tests/e2e/smoke-test.yaml
```

## Test Flows

### 1. Smoke Test (`smoke-test.yaml`)

**Purpose**: Validate core app functionality

- App launch verification
- Authentication flow
- Basic navigation
- Settings interaction

### 2. Welcome Flow (`welcome-flow.yaml`)

**Purpose**: Test authentication and onboarding

- Welcome screen display
- "Get Started" button
- Biometric authentication (if available)
- Navigation to main app

### 3. Navigation Flow (`navigation-flow.yaml`)

**Purpose**: Test tab navigation and screen transitions

- All tab navigation (Connections, Sessions, Settings)
- Theme switching
- Screen state persistence

### 4. Connection Flow (`connection-flow.yaml`)

**Purpose**: Test SSH connection management

- Connection list display
- Add connection FAB
- Connection state changes
- Session navigation

## Writing New Tests

### Basic Test Structure

```yaml
# Test metadata
appId: host.exp.exponent
name: 'Test Name'
tags:
  - tag1
  - tag2

---
# Test steps
- launchApp
- assertVisible: 'Expected Text'
- tapOn: 'Button Text'
- takeScreenshot: 'screenshot_name.png'
```

### Common Commands

```yaml
# App lifecycle
- launchApp
- stopApp

# UI interactions
- tapOn: 'text or id'
- assertVisible: 'text or element'
- assertNotVisible: 'text or element'
- scrollUntilVisible:
    element:
      text: 'target text'
    direction: DOWN

# Input and navigation
- inputText: 'text to type'
- pressKey: Back
- pressKey: Enter

# Wait and timing
- wait: 2000 # milliseconds

# Screenshots and debugging
- takeScreenshot: 'filename.png'

# Conditional flows
- runFlow:
    when:
      visible: 'condition'
    then:
      - tapOn: 'action'
```

## Device Setup

### Android

1. **Start Android emulator**
2. **Install development build** via EAS
3. **Launch app** in emulator
4. **Run tests**

### iOS (macOS only)

1. **Start iOS simulator**
2. **Install development build** via EAS
3. **Launch app** in simulator
4. **Run tests**

### Physical Devices

1. **Install development build** from EAS
2. **Connect device** via USB
3. **Enable USB debugging** (Android) or **Developer Mode** (iOS)
4. **Run tests**

## Best Practices

### Test Design

- **Start simple** - Basic smoke tests first
- **Use descriptive names** - Clear test and screenshot names
- **Add screenshots** - Visual verification points
- **Test real user flows** - End-to-end scenarios

### Element Selection

- **Prefer text** over IDs when possible
- **Use stable selectors** - Avoid implementation details
- **Add test IDs** for complex elements
- **Consider accessibility** - Screen reader compatibility

### Error Handling

- **Use timeouts** - Allow for slow operations
- **Add wait conditions** - Let UI settle
- **Test error states** - Network failures, etc.
- **Use conditional flows** - Handle optional dialogs

### Maintenance

- **Keep tests focused** - One feature per test
- **Update regularly** - Match UI changes
- **Review screenshots** - Visual regression detection
- **Tag appropriately** - Enable selective running

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          export PATH="$PATH":"$HOME/.maestro/bin"
      - name: Run E2E Tests
        run: npm run test:e2e:smoke
```

## Troubleshooting

### Common Issues

1. **App not found** - Check app ID and device connection
2. **Element not found** - Verify selectors and add waits
3. **Timeout errors** - Increase timeout or add wait conditions
4. **Screenshot failures** - Check device storage and permissions

### Debug Commands

```bash
# Check connected devices
maestro devices

# Run with verbose output
maestro test --verbose tests/e2e/smoke-test.yaml

# Interactive mode
maestro studio
```

## Reporting

- **Screenshots** saved in test output directory
- **Test results** in console output
- **Failed tests** include error details and screenshots
- **HTML reports** available with `--format html`
