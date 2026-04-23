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

  let coloredLabel = ''
  let blackLabel = ''
  let typeLabel = ''
  const categoryName = String((data as any).exerciseCategoryName ?? '').trim()
  if (type === 'hangboard') {
    coloredLabel = `${data.title || 'Hangboard'}`
    blackLabel = `${data.sets} séries`
    typeLabel = 'Hangboard'
  } else if (type === 'climbing') {
    const attempts = Math.max(1, Number(data.attempts ?? 1))
    coloredLabel = `${data.title || 'Climbing'}`
    blackLabel = `${data.grade} · ${attempts} tentative${attempts > 1 ? 's' : ''}`
    typeLabel = 'Escalade'
  } else if (type === 'warmup') {
    if (data.mode === 'reps') {
      coloredLabel = `${data.title || 'Échauffement'}`
      blackLabel = `${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      coloredLabel = `${data.title || 'Échauffement'}`
      blackLabel = `${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Échauffement'
  } else if (type === 'renforcement') {
    if (data.mode === 'reps') {
      coloredLabel = `${data.title || 'Renforcement'}`
      blackLabel = `${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      coloredLabel = `${data.title || 'Renforcement'}`
      blackLabel = `${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Renforcement'
  } else if (type === 'stretching') {
    if (data.mode === 'reps') {
      coloredLabel = `${data.title || 'Étirement'}`
      blackLabel = `${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      coloredLabel = `${data.title || 'Étirement'}`
      blackLabel = `${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Étirement'
  } else if (type === 'gainage') {
    if (data.mode === 'reps') {
      coloredLabel = `${data.title || 'Gainage'}`
      blackLabel = `${data.repetitions} reps`
    } else {
      const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
      coloredLabel = `${data.title || 'Gainage'}`
      blackLabel = `${data.duration} ${unit}`
    }
    typeLabel = data.exerciceType || 'Gainage'
  }

  return (
    <View style={styles.container}>
      <Text style={styles.type} numberOfLines={1}>
        <Text style={styles.type}>{coloredLabel}</Text>
        {blackLabel ? <Text style={styles.typeSecondary}> {`· ${blackLabel}`}</Text> : null}
      </Text>
      <Text style={styles.label} numberOfLines={1}>
        {categoryName || typeLabel}
      </Text>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
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
    typeSecondary: {
      fontSize: 11,
      color: colors.black,
      fontWeight: '600',
      textTransform: 'none',
    },
    label: {
      fontSize: 13,
      color: colors.black,
    },
  })
