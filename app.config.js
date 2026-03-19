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
      backgroundColor: '#E6F4FE',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
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
        backgroundColor: '#ffffff',
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
