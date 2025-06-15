const { withAppBuildGradle } = require('@expo/config-plugins');

const withGradlePackagingOptions = (config) => {
  return withAppBuildGradle(config, (config) => {
    let gradleContent = config.modResults.contents;
    
    // Check if packagingOptions already exists
    if (gradleContent.includes('packagingOptions')) {
      return config;
    }
    
    // Add comprehensive packagingOptions to android block
    const packagingOptions = `
    packagingOptions {
        pickFirst 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'
        pickFirst 'META-INF/DEPENDENCIES'
        pickFirst 'META-INF/LICENSE'
        pickFirst 'META-INF/LICENSE.txt'
        pickFirst 'META-INF/NOTICE'
        pickFirst 'META-INF/NOTICE.txt'
        exclude 'META-INF/LGPL2.1'
        exclude 'META-INF/AL2.0'
    }`;
    
    // Find the android block and add packagingOptions before the closing brace
    const androidBlockRegex = /(android\s*\{[\s\S]*?)(\s*\})/;
    
    if (androidBlockRegex.test(gradleContent)) {
      config.modResults.contents = gradleContent.replace(
        androidBlockRegex,
        `$1${packagingOptions}$2`
      );
    }
    
    return config;
  });
};

module.exports = withGradlePackagingOptions;