import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View } from 'react-native'
import { router } from 'expo-router'
import { ExerciceTypes } from '../types/trainingTypes'
import { PrimaryButton } from '../components/PrimaryButton'
import { ExercicePicker } from '../components/ExercicePicker'

export default function index() {
  const [selectedType, setSelectedType] = useState<ExerciceTypes | null>(null)
  const handleNext = () => {
    // tu pourras utiliser selectedType ici pour construire ton exercice
    router.back()
  }
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 30,
        }}
      >
        <ExercicePicker selectedType={selectedType} onSelect={setSelectedType} />
        <View style={{ width: '100%', paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' }}>
          <PrimaryButton title="Valider" onPress={handleNext} />
        </View>
      </View>
    </SafeAreaView>
  )
}
