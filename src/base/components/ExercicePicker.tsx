import React, { useEffect } from 'react'
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { ExerciceTypes } from '../types/trainingTypes'
import { useAppTheme } from '../providers/themeProvider'

type Props = {
  selectedType: ExerciceTypes | null
  onSelect: (type: ExerciceTypes) => void
}

const EXERCICE_TYPES: ExerciceTypes[] = ['hangboard', 'climbing', 'warmup', 'cooldown', 'stretching']

export const ExercicePicker: React.FC<Props> = ({ selectedType, onSelect }) => {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
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

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  typesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    margin: 4,
    backgroundColor: colors.white,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeText: {
    color: colors.black,
  },
  typeTextSelected: {
    color: colors.white,
  },
  hintText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 12,
    color: colors.grey,
  },
})

