import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as NavigationBar from 'expo-navigation-bar'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { LightColors } from '../constants/theme'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
    'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Saira_Condensed-Bold': require('../assets/fonts/Saira_Condensed-Bold.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return
    }

    const setupNavigationBar = async () => {
      await SystemUI.setBackgroundColorAsync('transparent')
      await NavigationBar.setPositionAsync('absolute')
      await NavigationBar.setBehaviorAsync('overlay-swipe')
      await NavigationBar.setBackgroundColorAsync('#00000000')
      await NavigationBar.setBorderColorAsync('#00000000')
      await NavigationBar.setVisibilityAsync('hidden')
    }

    setupNavigationBar()

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setupNavigationBar()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: LightColors.white }}>
      <ThemeProvider value={DefaultTheme}>
        <PaperProvider>
          <SafeAreaProvider>
            <StatusBar hidden translucent backgroundColor="transparent" />
            <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen name="login" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen name="register" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen name="forgot-password" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen name="verify-email" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen
                name="training-detail"
                options={{
                  headerShown: true,
                  title: "Détail de l'entrainement",
                  headerBackTitle: 'Retour',
                  headerTitleStyle: { fontSize: 15, fontWeight: '600' },
                }}
              />
              <Stack.Screen name="create-training" options={{ headerShown: true, title: 'Créer un entrainement', headerBackTitle: 'Retour' }} />
              <Stack.Screen name="create-exercice" options={{ headerShown: true, title: 'Créer un exercice', headerBackTitle: 'Retour' }} />
              <Stack.Screen name="simple-timer" options={{ headerShown: false }} />
              <Stack.Screen name="run-exercise" options={{ headerShown: false }} />
              <Stack.Screen
                name="statistiques"
                options={{
                  headerShown: true,
                  title: "Détail de l'entrainement",
                  headerBackTitle: 'Retour',
                  headerTitleStyle: { fontSize: 15, fontWeight: '600' },
                }}
              />
              <Stack.Screen name="climb-steps" options={{ headerShown: true, title: 'Climbing', headerBackTitle: 'Retour' }} />
              <Stack.Screen name="hangboard" options={{ headerShown: true, title: 'Hangboard', headerBackTitle: 'Retour' }} />
              <Stack.Screen name="test" options={{ headerShown: true, title: 'Test Timer', headerBackTitle: 'Retour' }} />
            </Stack>
          </SafeAreaProvider>
        </PaperProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
