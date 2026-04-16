import { ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as NavigationBar from 'expo-navigation-bar'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { useEffect, useRef, useState } from 'react'
import { AppState, Keyboard, Platform, View } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppThemeProvider, useAppTheme } from '../providers/themeProvider'
import { initSupabaseSchemaPreference } from '../api/supabaseClient'

SplashScreen.preventAutoHideAsync()

function AppNavigator() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
    'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Saira_Condensed-Bold': require('../assets/fonts/Saira_Condensed-Bold.ttf'),
  })
  const { isReady, navigationTheme, paperTheme, colors } = useAppTheme()
  const wakeLockSentinelRef = useRef<any>(null)
  const [isWebLandscape, setIsWebLandscape] = useState(false)

  useEffect(() => {
    void initSupabaseSchemaPreference()
  }, [])

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
      await NavigationBar.setBackgroundColorAsync('transparent')
      await NavigationBar.setBorderColorAsync('transparent')
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

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return
    }

    let isMounted = true

    const syncOrientation = () => {
      if (typeof window === 'undefined') {
        return
      }
      setIsWebLandscape(window.innerWidth > window.innerHeight)
    }

    const lockPortrait = async () => {
      const orientationApi = typeof screen !== 'undefined' ? (screen as any).orientation : undefined
      if (!orientationApi?.lock) {
        return
      }
      try {
        await orientationApi.lock('portrait')
      } catch {}
    }

    const releaseWakeLock = async () => {
      const sentinel = wakeLockSentinelRef.current
      wakeLockSentinelRef.current = null
      if (!sentinel) {
        return
      }
      try {
        await sentinel.release()
      } catch {}
    }

    const requestWakeLock = async () => {
      if (!isMounted || typeof document === 'undefined' || document.visibilityState !== 'visible') {
        return
      }
      const wakeLockApi = typeof navigator !== 'undefined' ? (navigator as any).wakeLock : undefined
      if (!wakeLockApi?.request) {
        return
      }
      try {
        if (wakeLockSentinelRef.current) {
          return
        }
        const sentinel = await wakeLockApi.request('screen')
        wakeLockSentinelRef.current = sentinel
        sentinel?.addEventListener?.('release', () => {
          if (wakeLockSentinelRef.current === sentinel) {
            wakeLockSentinelRef.current = null
          }
        })
      } catch {}
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock()
        return
      }
      void releaseWakeLock()
    }

    const handleUserInteraction = () => {
      void lockPortrait()
      void requestWakeLock()
    }

    syncOrientation()
    void lockPortrait()
    void requestWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('resize', syncOrientation)
    window.addEventListener('orientationchange', syncOrientation)
    window.addEventListener('focus', handleUserInteraction)
    window.addEventListener('pointerdown', handleUserInteraction)
    window.addEventListener('touchstart', handleUserInteraction)

    return () => {
      isMounted = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('resize', syncOrientation)
      window.removeEventListener('orientationchange', syncOrientation)
      window.removeEventListener('focus', handleUserInteraction)
      window.removeEventListener('pointerdown', handleUserInteraction)
      window.removeEventListener('touchstart', handleUserInteraction)
      void releaseWakeLock()
    }
  }, [])

  if ((!fontsLoaded && !fontError) || !isReady) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.white }}>
      <ThemeProvider value={navigationTheme}>
        <PaperProvider theme={paperTheme}>
          <SafeAreaProvider>
            <StatusBar hidden translucent backgroundColor="transparent" />
            <View style={{ flex: 1 }} onTouchMove={() => Keyboard.dismiss()}>
              {Platform.OS === 'web' && isWebLandscape ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    backgroundColor: colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      borderRadius: 18,
                      paddingHorizontal: 20,
                      paddingVertical: 18,
                      width: '100%',
                      maxWidth: 360,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>Mode portrait requis</Text>
                    <Text style={{ color: colors.black, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                      Tourne ton appareil en portrait pour continuer.
                    </Text>
                  </View>
                </View>
              ) : null}
              <Stack
                screenOptions={{
                  contentStyle: { backgroundColor: 'transparent' },
                  animation: 'none',
                }}
              >
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
                <Stack.Screen name="create-options" options={{ headerShown: true, title: 'Créer', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="create-training" options={{ headerShown: true, title: 'Créer un entrainement', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="create-exercice" options={{ headerShown: true, title: 'Créer un exercice', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="add-exercise-choice" options={{ headerShown: true, title: 'Ajouter un exercice', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="exercise-library" options={{ headerShown: true, title: 'Mes exercices', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="exercise-categories" options={{ headerShown: true, title: "Types d'exercices", headerBackTitle: 'Retour' }} />
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
                <Stack.Screen name="session-complete" options={{ headerShown: true, title: 'Fin de session', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="tools" options={{ headerShown: true, title: 'Outils', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="media-library" options={{ headerShown: true, title: 'Galerie de photos', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="tool2" options={{ headerShown: true, title: 'Tool 2', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="tool3" options={{ headerShown: true, title: 'Tool 3', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="confetti-tool" options={{ headerShown: true, title: 'Confettis', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="settings" options={{ headerShown: true, title: 'Paramètres', headerBackTitle: 'Retour' }} />
                <Stack.Screen name="add-cust" options={{ headerShown: true, title: 'Ajouter une voie', headerBackTitle: 'Retour' }} />
                <Stack.Screen
                  name="edit-ad-hoc-list"
                  options={{ headerShown: true, title: 'Modifier une voie', headerBackTitle: 'Retour' }}
                />
                <Stack.Screen
                  name="edit-ad-hoc-detail"
                  options={{ headerShown: true, title: 'Détail', headerBackTitle: 'Retour' }}
                />
              </Stack>
            </View>
          </SafeAreaProvider>
        </PaperProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <AppNavigator />
    </AppThemeProvider>
  )
}
