import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { TrainingExercise } from '../types/trainingTypes'
import { haptic } from '../utils/haptics'

export default function Hangboard() {
  const { trainingId, exerciseIndex } = useLocalSearchParams<{ trainingId?: string; exerciseIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)

  const { exercise, hasNext, nextIndex } = useMemo((): { exercise: TrainingExercise | null; hasNext: boolean; nextIndex: number | null } => {
    const trainingIdNum = trainingId ? Number(trainingId) : NaN
    const indexNum = exerciseIndex ? Number(exerciseIndex) : 0
    const training = trainings.find((t) => t.id === trainingIdNum)
    if (!training || Number.isNaN(trainingIdNum) || Number.isNaN(indexNum)) {
      return { exercise: null, hasNext: false, nextIndex: null }
    }
    const exercises = training.blocs.flatMap((b) => b.exercises)
    if (indexNum < 0 || indexNum >= exercises.length) {
      return { exercise: null, hasNext: false, nextIndex: null }
    }
    const hasNext = indexNum + 1 < exercises.length
    return { exercise: exercises[indexNum], hasNext, nextIndex: hasNext ? indexNum + 1 : null }
  }, [exerciseIndex, trainingId, trainings])

  if (!exercise || exercise.type !== 'hangboard') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Exercice hangboard introuvable.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{exercise.data.title || 'Hangboard'}</Text>
        <Text style={styles.subtitle}>Séries: {exercise.data.sets}</Text>
        <Text style={styles.subtitle}>Tenue: {exercise.data.holdTime}s</Text>
        <Text style={styles.subtitle}>Repos: {exercise.data.restingTime}s</Text>

        {hasNext && nextIndex !== null ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.nextButton}
            onPress={async () => {
              await haptic('tap')
              router.replace({
                pathname: '/run-exercise',
                params: { trainingId: String(trainingId), exerciseIndex: String(nextIndex) },
              })
            }}
          >
            <Text style={styles.nextText}>Suivant</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LightColors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: LightColors.grey,
  },
  muted: {
    color: LightColors.grey,
  },
  nextButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: LightColors.primary,
  },
  nextText: {
    color: LightColors.white,
    fontWeight: '600',
  },
})
