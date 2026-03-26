export default ({ config }) => ({
  ...config,
  name: 'SessionPlanner',
  slug: 'SessionPlanner',
  version: '1.0.0',
  orientation: 'default',
  scheme: 'SessionPlanner',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    package: 'com.gaston.sessionplanner',
    adaptiveIcon: {
      backgroundColor: 'aliceblue',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  androidNavigationBar: {
    visible: 'immersive',
    barStyle: 'dark-content',
    backgroundColor: 'transparent',
  },
  plugins: [
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
        backgroundColor: 'white',
        dark: {
          backgroundColor: 'black',
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
})
