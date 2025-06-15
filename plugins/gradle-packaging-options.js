const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

const withGradlePackagingOptions = (config) => {
  return withAppBuildGradle(config, (config) => {
    let gradleContent = config.modResults.contents;
    
    // Find existing packagingOptions block and add our options to it
    const packagingOptionsRegex = /(packagingOptions\s*\{[^}]*)(.*?)(\s*\})/s;
    
    if (packagingOptionsRegex.test(gradleContent)) {
      // Add our options to existing packagingOptions block  
      const additionalOptions = `
        // SSH library duplicate file resolution
        pickFirst 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'
        pickFirst 'META-INF/DEPENDENCIES'
        pickFirst 'META-INF/INDEX.LIST'
        pickFirst 'META-INF/LICENSE'
        pickFirst 'META-INF/LICENSE.txt'
        pickFirst 'META-INF/NOTICE'
        pickFirst 'META-INF/NOTICE.txt'
        pickFirst 'META-INF/ASL2.0'
        exclude 'META-INF/LGPL2.1'
        exclude 'META-INF/AL2.0'
        exclude 'META-INF/*.kotlin_module'
        exclude 'META-INF/versions/9/**'
        exclude 'kotlin/**'
        exclude 'kotlin-tooling-metadata.json'
        `;
      
      config.modResults.contents = gradleContent.replace(
        packagingOptionsRegex,
        `$1$2${additionalOptions}$3`
      );
    } else {
      // If no packagingOptions block exists, add one
      const packagingOptions = `
    packagingOptions {
        // SSH library duplicate file resolution
        pickFirst 'META-INF/versions/9/OSGI-INF/MANIFEST.MF'
        pickFirst 'META-INF/DEPENDENCIES'
        pickFirst 'META-INF/INDEX.LIST'
        pickFirst 'META-INF/LICENSE'
        pickFirst 'META-INF/LICENSE.txt'
        pickFirst 'META-INF/NOTICE'
        pickFirst 'META-INF/NOTICE.txt'
        pickFirst 'META-INF/ASL2.0'
        exclude 'META-INF/LGPL2.1'
        exclude 'META-INF/AL2.0'
        exclude 'META-INF/*.kotlin_module'
        exclude 'META-INF/versions/9/**'
        exclude 'kotlin/**'
        exclude 'kotlin-tooling-metadata.json'
        jniLibs {
            useLegacyPackaging (findProperty('expo.useLegacyPackaging')?.toBoolean() ?: false)
        }
    }`;
      
      // Find the android block and add packagingOptions
      const androidBlockRegex = /(android\s*\{[\s\S]*?)(\s*\}[\s\S]*dependencies)/;
      
      if (androidBlockRegex.test(gradleContent)) {
        config.modResults.contents = gradleContent.replace(
          androidBlockRegex,
          `$1${packagingOptions}$2`
        );
      }
    }
    
    return config;
  });
};

module.exports = withGradlePackagingOptions;