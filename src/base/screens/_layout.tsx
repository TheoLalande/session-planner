import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

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

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <PaperProvider>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="home" options={{ headerShown: false, animation: 'none' }} />
              <Stack.Screen
                name="training-detail"
                options={{ headerShown: true, title: 'Détail de l\'entrainement', headerBackTitle: 'Retour' }}
              />
              <Stack.Screen
                name="create-training"
                options={{ headerShown: true, title: 'Créer un entrainement', headerBackTitle: 'Retour' }}
              />
              <Stack.Screen
                name="create-exercice"
                options={{ headerShown: true, title: 'Créer un exercice', headerBackTitle: 'Retour' }}
              />
              <Stack.Screen
                name="simple-timer"
                options={{ headerShown: true, title: 'Timer', headerBackTitle: 'Retour' }}
              />
            </Stack>
          </SafeAreaProvider>
        </PaperProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
