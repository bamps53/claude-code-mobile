module.exports = {
  dependencies: {
    '@dylankenneally/react-native-ssh-sftp': {
      platforms: {
        android: {
          sourceDir: './node_modules/@dylankenneally/react-native-ssh-sftp/android',
          packageImportPath: 'import me.dylankenneally.rnssh.RNSshClientPackage;',
        },
      },
    },
  },
};
