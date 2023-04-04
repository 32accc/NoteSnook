
const isGithubRelease = false;
const config = {
  commands: require('@callstack/repack/commands'),
  project: {
    android: {
      sourceDir: './android'
    }
  }
};

if (!config.dependencies) config.dependencies = {};
config.dependencies['react-native-vector-icons'] = {
  platforms: {
    ios: null,
  },
}

if (isGithubRelease) {
  config.dependencies["react-native-iap"] = {
    platforms: {
      android:null
    }
  }
}

module.exports = config;
