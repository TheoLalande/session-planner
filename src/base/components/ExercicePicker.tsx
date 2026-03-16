import React, { useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { LightColors } from '../constants/theme'
import { ExerciceTypes } from '../types/trainingTypes'

type Props = {
  selectedType: ExerciceTypes | null
  onSelect: (type: ExerciceTypes) => void
}

const EXERCICE_TYPES: ExerciceTypes[] = ['hangboard', 'climbing', 'warmup', 'cooldown', 'stretching']

export const ExercicePicker: React.FC<Props> = ({ selectedType, onSelect }) => {
  useEffect(() => {
    if (!selectedType) {
      onSelect(EXERCICE_TYPES[0])
    }
  }, [selectedType, onSelect])

  return (
    <View
      style={{
        width: '100%',
        paddingBottom: 30,
      }}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typesContainer}>
        {EXERCICE_TYPES.map((type, index) => {
          const isSelected = selectedType ? type === selectedType : index === 0
          return (
            <TouchableOpacity
              key={type}
              onPress={() => onSelect(type)}
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

