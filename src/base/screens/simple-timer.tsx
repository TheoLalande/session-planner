import React, { useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'
import { useTrainingStore } from '../store/trainingStore'
import { ExerciseTimer, ExerciseTimerHandle } from '../components/ExerciseTimer'
import { LightColors } from '../constants/theme'

type TimerConfig = {
  initialDurationSeconds: number
  hasNextExercise: boolean
  nextIndex: number | null
  exerciseTitle: string
  exerciseImage: string | null
  autoStart: boolean
  isReps: boolean
  repetitions: number
}

export default function SimpleTimer() {
  const { trainingId, timeIndex } = useLocalSearchParams<{ trainingId?: string; timeIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)
  const timerRef = useRef<ExerciseTimerHandle | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isTransition, setIsTransition] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const {
    initialDurationSeconds,
    hasNextExercise,
    nextIndex,
    exerciseTitle,
    exerciseImage,
    autoStart,
    isReps,
    repetitions,
  } = useMemo((): TimerConfig => {
    const trainingIdNum = trainingId ? Number(trainingId) : NaN
    const indexNum = timeIndex ? Number(timeIndex) : 0

    const training = trainings.find((t) => t.id === trainingIdNum)
    if (!training || Number.isNaN(trainingIdNum)) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null as number | null,
        exerciseTitle: 'Exercice',
        exerciseImage: null as string | null,
        autoStart: false,
        isReps: false,
        repetitions: 0,
      }
    }

    const exercises = training.blocs
      .flatMap((bloc) => bloc.exercises)
      .filter(
        (exercise) =>
          exercise.type === 'warmup' ||
          exercise.type === 'cooldown' ||
          exercise.type === 'stretching',
      )

    if (exercises.length === 0 || indexNum < 0 || indexNum >= exercises.length) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null,
        exerciseTitle: 'Exercice',
        exerciseImage: null,
        autoStart: false,
        isReps: false,
        repetitions: 0,
      }
    }

    const currentExercise = exercises[indexNum]
    const data: any = currentExercise.data

    const isReps = 'mode' in data && data.mode === 'reps'
    const repetitions = isReps && typeof data.repetitions === 'number' ? data.repetitions : 0

    // Gestion de la durée selon l'unité choisie (minutes ou secondes)
    let durationValue = 'duration' in data ? data.duration : 1
    let durationUnit =
      'durationUnit' in data && data.durationUnit ? data.durationUnit : 'seconds'

    if (Number.isNaN(durationValue) || durationValue <= 0) {
      durationValue = 1
    }

    const durationInSeconds = durationUnit === 'minutes' ? durationValue * 60 : durationValue

    const hasNext = indexNum + 1 < exercises.length

    let title = ''
    if ('exerciceType' in data && data.exerciceType) {
      title = data.exerciceType
    } else if ('title' in data && data.title) {
      title = data.title
    } else {
      if (currentExercise.type === 'warmup') title = 'Échauffement'
      else if (currentExercise.type === 'cooldown') title = 'Retour au calme'
      else if (currentExercise.type === 'stretching') title = 'Étirement'
      else title = 'Exercice'
    }

    const image = data && 'picture' in data && data.picture ? data.picture : null

    const autoStart = !isReps && indexNum > 0

    return {
      initialDurationSeconds: durationInSeconds,
      hasNextExercise: hasNext,
      nextIndex: hasNext ? indexNum + 1 : null,
      exerciseTitle: title,
      exerciseImage: image,
      autoStart,
      isReps,
      repetitions,
    }
  }, [trainingId, timeIndex, trainings])

  const goToNextExercise = () => {
    if (!hasNextExercise || nextIndex === null || !trainingId) {
      return
    }
    router.replace({
      pathname: '/simple-timer',
      params: {
        trainingId,
        timeIndex: String(nextIndex),
      },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{exerciseTitle}</Text>
        {exerciseImage ? <Image source={{ uri: exerciseImage }} style={styles.image} resizeMode="cover" /> : null}

        {isReps ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: LightColors.primary }}>
              {repetitions}
            </Text>
            <Text style={{ marginTop: 4, fontSize: 16, color: LightColors.grey }}>
              répétition(s)
            </Text>
          </View>
        ) : (
          <ExerciseTimer
            ref={timerRef}
            initialSeconds={initialDurationSeconds}
            autoStart={autoStart}
            hasNextExercise={hasNextExercise}
            onStatusChange={({
              isRunning: running,
              isTransition: transition,
              remainingSeconds: seconds,
            }) => {
              setIsRunning(running)
              setIsTransition(transition)
              setRemainingSeconds(seconds)
            }}
            onNextExercise={hasNextExercise ? goToNextExercise : undefined}
          />
        )}

        <View style={styles.buttonsRow}>
          {!isReps && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => timerRef.current?.reset()}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Réinitialiser</Text>
            </TouchableOpacity>
          )}

          {hasNextExercise && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={goToNextExercise}
              style={[styles.button, { backgroundColor: LightColors.primary }]}
            >
              <Text style={[styles.buttonText]}>Suivant</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LightColors.primary,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    maxWidth: 320,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: LightColors.white,
  },
  secondaryButton: {
    backgroundColor: LightColors.white,
    borderWidth: 1,
    borderColor: LightColors.primary,
  },
  secondaryButtonText: {
    color: LightColors.primary,
  },
})
