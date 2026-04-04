import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { TrainingExercise } from '../types/trainingTypes'
import { useAppTheme } from '../providers/themeProvider'

type Props = {
  exercise: TrainingExercise
}

export const TrainingBlocItem = ({ exercise }: Props) => {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const { type, data } = exercise

  let label = ''
  let typeLabel = ''
  if (type === 'hangboard') {
    label = `${data.title || 'Hangboard'} · ${data.sets} séries`
    typeLabel = 'Hangboard'
  } else if (type === 'climbing') {
    label = `${data.title || 'Climbing'} · ${data.grade}`
    typeLabel = 'Escalade'
  } else if (type === 'warmup') {
    if (data.mode === 'reps') {
      label = `${data.title || 'Échauffement'} · ${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      label = `${data.title || 'Échauffement'} · ${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Échauffement'
  } else if (type === 'renforcement') {
    if (data.mode === 'reps') {
      label = `${data.title || 'Renforcement'} · ${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      label = `${data.title || 'Renforcement'} · ${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Renforcement'
  } else if (type === 'stretching') {
    if (data.mode === 'reps') {
      label = `${data.title || 'Étirement'} · ${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      label = `${data.title || 'Étirement'} · ${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Étirement'
  }

  return (
    <View style={styles.container}>
      <Text style={styles.type}>{typeLabel}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 6,
  },
  type: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    color: colors.black,
  },
})
