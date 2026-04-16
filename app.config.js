export default ({ config }) => ({
  ...config,
  name: 'SessionPlanner',
  slug: 'SessionPlanner',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'SessionPlanner',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.gaston.sessionplanner',
    adaptiveIcon: {
      backgroundColor: '#F0F8FF',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  androidNavigationBar: {
    visible: 'immersive',
    barStyle: 'dark-content',
    backgroundColor: '#00000000',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    name: 'run4life',
    shortName: 'run4life',
    backgroundColor: '#FFFFFF',
    themeColor: '#F0F8FF',
    display: 'standalone',
    pwa: {
      enabled: true,
    },
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
        },
      },
    ],
    [
      'expo-router',
      {
        root: './src/base/screens',
      },
    ],
    [
      'expo-splash-screen',
      {
        image: './src/base/assets/png/logo-full.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
        dark: {
          backgroundColor: '#000000',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
