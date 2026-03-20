import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { BottomNavBar } from '../components'
import { LightColors } from '../constants/theme'

export default function settings() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>settings</Text>
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
