import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LightColors } from '../constants/theme'
import { TrainingExercise } from '../types/trainingTypes'

type Props = {
  exercise: TrainingExercise
}

export const TrainingBlocItem = ({ exercise }: Props) => {
  const { type, data } = exercise

  let label = ''
  if (type === 'hangboard') {
    label = `${data.title || 'Hangboard'} · ${data.sets} séries`
  } else if (type === 'climbing') {
    label = `${data.title || 'Climbing'} · ${data.grade}`
  } else if (type === 'warmup') {
    const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
    label = `${data.title || 'Échauffement'} · ${data.duration} ${unit}`
  } else if (type === 'cooldown') {
    const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
    label = `${data.title || 'Retour au calme'} · ${data.duration} ${unit}`
  } else if (type === 'stretching') {
    const unit = data.durationUnit === 'minutes' ? 'min' : 'sec'
    label = `${data.title || 'Étirement'} · ${data.duration} ${unit}`
  }

  return (
    <View style={styles.container}>
      <Text style={styles.type}>{type}</Text>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 6,
  },
  type: {
    fontSize: 11,
    color: LightColors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    color: LightColors.black,
  },
})
