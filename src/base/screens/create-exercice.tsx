import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton } from '../components'
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { LightColors } from '../constants/theme'
import { ExerciceTypes } from '../types/trainingTypes'
const EXERCICE_TYPES: ExerciceTypes[] = ['hangboard', 'climbing', 'warmup', 'cooldown', 'stretching']

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
        <View
          style={{
            width: '100%',
            paddingBottom: 30,
          }}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typesContainer}>
            {EXERCICE_TYPES.map((type) => {
              const isSelected = type === selectedType
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[styles.typeButton, isSelected && styles.typeButtonSelected]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.typeText, isSelected && styles.typeTextSelected]}>{type}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
          <Text style={styles.hintText}>Faites glisser vers la droite pour voir plus →</Text>
        </View>
        <View style={{ width: '100%', paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' }}>
          <PrimaryButton title="Valider" onPress={handleNext} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  typesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LightColors.primary,
    margin: 4,
    backgroundColor: LightColors.white,
  },
  typeButtonSelected: {
    backgroundColor: LightColors.primary,
    borderColor: LightColors.primary,
  },
  typeText: {
    color: LightColors.black,
  },
  typeTextSelected: {
    color: LightColors.white,
  },
  hintText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: LightColors.grey,
  },
})
