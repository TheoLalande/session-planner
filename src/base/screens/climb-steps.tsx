import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'
import { TrainingExercise } from '../types/trainingTypes'
import { ExerciseTimer, ExerciseTimerHandle } from '../components/ExerciseTimer'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { haptic } from '../utils/haptics'
import { useAppTheme } from '../providers/themeProvider'
import { getTransitionSecondsBeforeNextExercise } from '../utils/trainingTransitions'

export default function ClimbSteps() {
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

  const timerRef = useRef<ExerciseTimerHandle | null>(null)

  const initialAttempts = exercise && exercise.type === 'climbing' ? exercise.data.attempts : 0
  const [attemptResults, setAttemptResults] = useState<('pending' | 'success' | 'fail')[]>(() =>
    Array.from({ length: Math.max(0, initialAttempts) }, () => 'pending'),
  )

  const nextAttemptIndex = attemptResults.findIndex((s) => s === 'pending')
  const isAttemptsDone = nextAttemptIndex === -1

  const addAttempt = useClimbingAttemptsStore((state) => state.addAttempt)
  const [isSavingAttempt, setIsSavingAttempt] = useState(false)

  if (!exercise || exercise.type !== 'climbing') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Exercice climbing introuvable.</Text>
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

  const markAttempt = async (status: 'success' | 'fail') => {
    if (nextAttemptIndex === -1 || isSavingAttempt) {
      return
    }

    const climbingTypeLabel = (exercise.data.climbingType || 'bloc').trim()
    const routeNameLabel = (exercise.data.title || 'Climbing').trim()
    const routeLabel = `${climbingTypeLabel} - ${routeNameLabel} · ${exercise.data.grade}`
    try {
      setIsSavingAttempt(true)
      await addAttempt({ routeLabel, status, createdAt: Date.now() })
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Impossible d'enregistrer la voie en base")
      return
    } finally {
      setIsSavingAttempt(false)
    }

    setAttemptResults((prev) => {
      const next = [...prev]
      next[nextAttemptIndex] = status
      return next
    })

    timerRef.current?.reset()
    setTimeout(() => {
      timerRef.current?.startPause()
    }, 0)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{exercise.data.title || 'Climbing'}</Text>
        <Text style={styles.subtitle}>Difficulté: {exercise.data.grade}</Text>
        <View style={styles.attemptsRow}>
          {attemptResults.map((status, idx) => (
            <View
              key={idx}
              style={[styles.attemptSquare, status === 'success' && styles.attemptSquareSuccess, status === 'fail' && styles.attemptSquareFail]}
            />
          ))}
        </View>

        <View style={styles.attemptButtonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              await markAttempt('success')
            }}
            disabled={isAttemptsDone || isSavingAttempt}
            style={[styles.attemptButton, { backgroundColor: isAttemptsDone || isSavingAttempt ? colors.lightGrey : colors.primary }]}
          >
            <MaterialCommunityIcons name="check" size={22} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              await markAttempt('fail')
            }}
            disabled={isAttemptsDone || isSavingAttempt}
            style={[styles.attemptButton, { backgroundColor: isAttemptsDone || isSavingAttempt ? colors.lightGrey : colors.danger }]}
          >
            <MaterialCommunityIcons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Repos</Text>
        <ExerciseTimer
          ref={timerRef}
          initialSeconds={exercise.data.restingTime}
          autoStart={false}
          hasNextExercise={false}
          onStatusChange={() => {}}
        />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.nextButton}
          disabled={hasNext && nextIndex !== null ? !isAttemptsDone : false}
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
    flex: 1,
    flexGrow: 1,
    justifyContent: 'space-between',
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
  attemptsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  attemptSquare: {
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.grey,
    backgroundColor: 'transparent',
  },
  attemptSquareSuccess: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  attemptSquareFail: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  attemptButtonsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 12,
  },
  attemptButton: {
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    color: colors.white,
    fontWeight: '600',
  },
})
