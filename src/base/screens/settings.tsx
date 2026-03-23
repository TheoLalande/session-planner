import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { BottomNavBar, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { getSession, logout } from '../api/authService'

export default function settings() {
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      try {
        const session = await getSession()
        if (!isMounted) return
        if (!session.accessToken) router.replace('/login')
      } catch {
        if (!isMounted) return
        router.replace('/login')
      } finally {
        if (!isMounted) return
        setIsCheckingSession(false)
      }
    }
    check()
    return () => {
      isMounted = false
    }
  }, [])

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>settings</Text>
        <View style={{ width: '100%', marginTop: 20 }}>
          <PrimaryButton
            title="Se déconnecter"
            onPress={async () => {
              await logout()
              router.replace('/login')
            }}
          />
        </View>
      </View>
      <BottomNavBar onHomePress={() => router.push('/home')} onCalendarPress={() => {}} onSettingsPress={() => {}} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 50,
    fontWeight: '700',
    color: LightColors.primary,
    textAlign: 'center',
  },
})
