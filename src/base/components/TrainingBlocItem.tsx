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
    label = `${data.title || 'Échauffement'} · ${data.duration} min`
  } else if (type === 'cooldown') {
    label = `${data.title || 'Retour au calme'} · ${data.duration} min`
  } else if (type === 'stretching') {
    label = `${data.title || 'Étirement'} · ${data.duration} min`
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
    color: LightColors.grey,
    textTransform: 'uppercase',
  },
  label: {
    fontSize: 13,
    color: LightColors.black,
  },
})
