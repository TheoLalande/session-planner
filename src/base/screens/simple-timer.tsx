import React, { useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { useTrainingStore } from '../store/trainingStore'
import { ExerciseTimer, ExerciseTimerHandle } from '../components/ExerciseTimer'
import { LightColors } from '../constants/theme'
import { haptic } from '../utils/haptics'

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
  const { trainingId, exerciseIndex } = useLocalSearchParams<{ trainingId?: string; exerciseIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)
  const timerRef = useRef<ExerciseTimerHandle | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isTransition, setIsTransition] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const { initialDurationSeconds, hasNextExercise, nextIndex, exerciseTitle, exerciseImage, autoStart, isReps, repetitions } =
    useMemo((): TimerConfig => {
      const trainingIdNum = trainingId ? Number(trainingId) : NaN
      const indexNum = exerciseIndex ? Number(exerciseIndex) : 0

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

      const exercises = training.blocs.flatMap((bloc) => bloc.exercises)

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

      const hasNext = indexNum + 1 < exercises.length
      const nextIndex = hasNext ? indexNum + 1 : null

      // Si on arrive ici avec un type non géré par cet écran, on garde quand même
      // l'enchaînement global (index+1) pour pouvoir passer au suivant.
      if (currentExercise.type === 'hangboard' || currentExercise.type === 'climbing') {
        return {
          initialDurationSeconds: 60,
          hasNextExercise: hasNext,
          nextIndex,
          exerciseTitle: 'Exercice',
          exerciseImage: null,
          autoStart: false,
          isReps: false,
          repetitions: 0,
        }
      }

      const isReps = 'mode' in data && data.mode === 'reps'
      const repetitions = isReps && typeof data.repetitions === 'number' ? data.repetitions : 0

      // Gestion de la durée selon l'unité choisie (minutes ou secondes)
      let durationValue = 'duration' in data ? data.duration : 1
      let durationUnit = 'durationUnit' in data && data.durationUnit ? data.durationUnit : 'seconds'

      if (Number.isNaN(durationValue) || durationValue <= 0) {
        durationValue = 1
      }

      const durationInSeconds = durationUnit === 'minutes' ? durationValue * 60 : durationValue

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
        nextIndex,
        exerciseTitle: title,
        exerciseImage: image,
        autoStart,
        isReps,
        repetitions,
      }
    }, [trainingId, exerciseIndex, trainings])

  const goToNextExercise = () => {
    if (nextIndex === null || !trainingId) {
      return
    }
    router.replace({
      pathname: '/run-exercise',
      params: {
        trainingId,
        exerciseIndex: String(nextIndex),
      },
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{exerciseTitle}</Text>
        <View style={styles.imageContainer}>
          {exerciseImage ? (
            <Image
              source={{ uri: exerciseImage }}
              style={[styles.image, { borderRadius: 12, borderWidth: 1, borderColor: LightColors.primary }]}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {isReps ? (
          <View style={{ alignItems: 'center', marginTop: 16 }}>
            <Text style={{ fontSize: 50, fontWeight: '700', color: LightColors.primary }}>{repetitions}</Text>
            <Text style={{ marginTop: 4, fontSize: 16, color: LightColors.grey }}>répétition(s)</Text>
          </View>
        ) : (
          <ExerciseTimer
            ref={timerRef}
            initialSeconds={initialDurationSeconds}
            autoStart={autoStart}
            hasNextExercise={hasNextExercise}
            onStatusChange={({ isRunning: running, isTransition: transition, remainingSeconds: seconds }) => {
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
              onPress={async () => {
                await haptic('tap')
                timerRef.current?.reset()
              }}
              style={[styles.button, styles.secondaryButton]}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Réinitialiser</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              goToNextExercise()
            }}
            disabled={nextIndex === null}
            style={[
              styles.button,
              {
                backgroundColor: nextIndex === null ? LightColors.lightGrey : LightColors.primary,
              },
            ]}
          >
            <Text style={[styles.buttonText]}>Suivant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LightColors.primary,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    flex: 1,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  imageContainer: {
    width: '100%',
    flex: 1,
    marginVertical: 12,
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
