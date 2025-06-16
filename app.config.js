module.exports = {
  expo: {
    name: 'claude-code-mobile',
    slug: 'claude-code-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: false,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.bamps53.claudecodemobile',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      package: 'com.bamps53.claudecodemobile',
      compileSdkVersion: 34,
      targetSdkVersion: 34,
      minSdkVersion: 24,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'dba59e03-d27f-47b4-8a72-a911f5083db1',
      },
    },
    plugins: ['expo-dev-client', 'expo-secure-store', 'expo-local-authentication'],
  },
};
