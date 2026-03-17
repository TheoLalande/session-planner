import React, { useMemo, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { TrainingExercise } from '../types/trainingTypes'
import { ExerciseTimer, ExerciseTimerHandle } from '../components/ExerciseTimer'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { haptic } from '../utils/haptics'

export default function ClimbSteps() {
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

  if (!exercise || exercise.type !== 'climbing') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.muted}>Exercice climbing introuvable.</Text>
      </SafeAreaView>
    )
  }

  const timerRef = useRef<ExerciseTimerHandle | null>(null)
  const [timerRunning, setTimerRunning] = useState(false)

  const [attemptResults, setAttemptResults] = useState<Array<'pending' | 'success' | 'fail'>>(() =>
    Array.from({ length: Math.max(0, exercise.data.attempts) }, () => 'pending')
  )

  const nextAttemptIndex = attemptResults.findIndex((s) => s === 'pending')
  const isAttemptsDone = nextAttemptIndex === -1
  const hasSuccessAttempt = attemptResults.some((s) => s === 'success')

  const markAttempt = (status: 'success' | 'fail') => {
    if (nextAttemptIndex === -1) {
      return
    }
    setAttemptResults((prev) => {
      const next = [...prev]
      next[nextAttemptIndex] = status
      return next
    })

    // Démarre le timer de repos au clic (réussi/raté).
    // On reset d'abord pour repartir de la durée complète, puis on lance.
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
              markAttempt('success')
            }}
            disabled={isAttemptsDone}
            style={[styles.attemptButton, { backgroundColor: isAttemptsDone ? LightColors.lightGrey : LightColors.primary }]}
          >
            <MaterialCommunityIcons name="check" size={22} color={LightColors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              markAttempt('fail')
            }}
            disabled={isAttemptsDone}
            style={[styles.attemptButton, { backgroundColor: isAttemptsDone ? LightColors.lightGrey : '#ff3b30' }]}
          >
            <MaterialCommunityIcons name="close" size={22} color={LightColors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>Repos</Text>
        <ExerciseTimer
          ref={timerRef}
          initialSeconds={exercise.data.restingTime}
          autoStart={false}
          hasNextExercise={false}
          onStatusChange={({ isRunning }) => setTimerRunning(isRunning)}
        />

        {hasNext && nextIndex !== null ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.nextButton}
            disabled={!hasSuccessAttempt}
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
    color: LightColors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: LightColors.grey,
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
    borderColor: LightColors.grey,
    backgroundColor: 'transparent',
  },
  attemptSquareSuccess: {
    borderColor: LightColors.primary,
    backgroundColor: LightColors.primary,
  },
  attemptSquareFail: {
    borderColor: '#ff3b30',
    backgroundColor: '#ff3b30',
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
    color: LightColors.grey,
  },
  nextButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: LightColors.primary,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextText: {
    color: LightColors.white,
    fontWeight: '600',
  },
})
