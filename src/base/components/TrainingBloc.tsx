import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { LightColors } from '../constants/theme'
import { SecondaryRoundButton } from './SecondaryRoundButton'
import { TrainingBlocItem } from './TrainingBlocItem'
import { useTrainingStore } from '../store/trainingStore'

type TrainingBlocProps = {
  blocId: number
  title: string
  onPressAddExercise: () => void
}

export const TrainingBloc = ({ blocId, title, onPressAddExercise }: TrainingBlocProps) => {
  const exercises = useTrainingStore((state) => state.blocs.find((b) => b.id === blocId)?.exercises || [])

  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <View style={styles.square}>
        <View style={styles.exercisesContainer}>
          {exercises.map((exercise, index) => (
            <TrainingBlocItem key={index} exercise={exercise} />
          ))}
        </View>
        <SecondaryRoundButton blocId={blocId} onPress={onPressAddExercise} color={LightColors.primary} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
  },
  square: {
    width: '100%',
    backgroundColor: LightColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LightColors.primary,
    padding: 12,
    minHeight: 50,
    justifyContent: 'space-between',
  },
  title: {
    color: LightColors.black,
    fontSize: 16,
    paddingLeft: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  exercisesContainer: {
    width: '100%',
  },
})
