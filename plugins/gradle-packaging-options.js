const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

const withGradlePackagingOptions = (config) => {
  return withAppBuildGradle(config, (config) => {
    const gradleContent = config.modResults.contents;
    
    // Check if packagingOptions already exists
    if (gradleContent.includes('packagingOptions')) {
      return config;
    }
    
    // Add packagingOptions to android block
    const androidBlockRegex = /(android\s*{[^}]*)/;
    const packagingOptions = `
    packagingOptions {
        pickFirst 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'
    }`;
    
    config.modResults.contents = gradleContent.replace(
      androidBlockRegex,
      `$1${packagingOptions}`
    );
    
    return config;
  });
};

module.exports = withGradlePackagingOptions;