const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for react-native-gesture-handler compatibility
config.resolver.resolveRequest = (context, realModuleName, platform) => {
  // Fix for RNText import issue
  if (realModuleName === 'RNText') {
    return {
      filePath: require.resolve('react-native/Libraries/Text/Text'),
      type: 'sourceFile',
    };
  }
  
  return context.resolveRequest(context, realModuleName, platform);
};

module.exports = config;