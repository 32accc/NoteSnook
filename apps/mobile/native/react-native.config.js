
const isGithubRelease =  process.env.GITHUB_RELEASE;
const config = {
  commands: require('@callstack/repack/commands'),
  project: {
    android: {
      sourceDir: './android'
    }
  }
};

if (isGithubRelease) {
  config.dependencies = {
    "react-native-iap": {
      platforms: {
        android:null
      }
    },
  }
}


module.exports = config;
