import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { TrainingExercise } from '../types/trainingTypes'
import { haptic } from '../utils/haptics'
import { useAppTheme } from '../providers/themeProvider'
import { getTransitionSecondsBeforeNextExercise } from '../utils/trainingTransitions'

export default function Hangboard() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const { trainingId, exerciseIndex } = useLocalSearchParams<{ trainingId?: string; exerciseIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)


  const { exercise, hasNext, nextIndex, training, flatIndex } = useMemo((): {
    exercise: TrainingExercise | null
    hasNext: boolean
    nextIndex: number | null
    training: (typeof trainings)[0] | null
    flatIndex: number
  } => {
    const trainingIdValue = trainingId ?? ''
    const indexNum = exerciseIndex ? Number(exerciseIndex) : 0
    const trainingFound = trainings.find((t) => t.id === trainingIdValue)
    if (!trainingFound || !trainingIdValue || Number.isNaN(indexNum)) {
      return { exercise: null, hasNext: false, nextIndex: null, training: null, flatIndex: 0 }
    }
    const exercises = trainingFound.blocs.flatMap((b) => b.exercises)
    if (indexNum < 0 || indexNum >= exercises.length) {
      return { exercise: null, hasNext: false, nextIndex: null, training: null, flatIndex: 0 }
    }
    const hasNextEx = indexNum + 1 < exercises.length
    return {
      exercise: exercises[indexNum],
      hasNext: hasNextEx,
      nextIndex: hasNextEx ? indexNum + 1 : null,
      training: trainingFound,
      flatIndex: indexNum,
    }
  }, [exerciseIndex, trainingId, trainings])

  if (!exercise || exercise.type !== 'hangboard') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Exercice hangboard introuvable.</Text>
      </SafeAreaView>
    )
  }

  const finishTraining = async () => {
    if (!trainingId) {
      router.replace('/home')
      return
    }

    router.replace({
      pathname: '/session-complete',
      params: { trainingId: String(trainingId) },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{exercise.data.title || 'Hangboard'}</Text>
        <Text style={styles.subtitle}>Séries: {exercise.data.sets}</Text>
        <Text style={styles.subtitle}>Tenue: {exercise.data.holdTime}s</Text>
        <Text style={styles.subtitle}>Repos: {exercise.data.restingTime}s</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.nextButton}
          onPress={async () => {
            await haptic('tap')
            if (hasNext && nextIndex !== null && training) {
              const secs = getTransitionSecondsBeforeNextExercise(training, flatIndex)
              router.replace({
                pathname: '/run-exercise',
                params: {
                  trainingId: String(trainingId),
                  exerciseIndex: String(nextIndex),
                  ...(secs > 0 ? { pendingTransitionSeconds: String(secs) } : {}),
                },
              })
              return
            }

            await finishTraining()
          }}
        >
          <Text style={styles.nextText}>{hasNext && nextIndex !== null ? 'Suivant' : 'Terminer'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    color: colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.grey,
  },
  muted: {
    color: colors.grey,
  },
  nextButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  nextText: {
    color: colors.white,
    fontWeight: '600',
  },
})
