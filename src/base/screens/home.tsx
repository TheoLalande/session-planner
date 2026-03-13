import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomNavBar, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { View } from 'react-native'
import { router } from 'expo-router'

export default function index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingTop: 30,
          paddingBottom: 30,
        }}
      >
        <PrimaryButton
          title="Créer un entrainement"
          onPress={() => {
            router.push('/create-training')
          }}
        />
      </View>
      <BottomNavBar onHomePress={() => {}} onCalendarPress={() => {}} onSettingsPress={() => {}} />
    </SafeAreaView>
  )
}
