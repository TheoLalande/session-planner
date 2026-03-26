import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
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
  transitionSecondsBetweenTimers: number
}

export default function SimpleTimer() {
  const { trainingId, exerciseIndex } = useLocalSearchParams<{ trainingId?: string; exerciseIndex?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const trainings = useTrainingStore((state) => state.trainings)
  const timerRef = useRef<ExerciseTimerHandle | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isTransition, setIsTransition] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const progressAnimRef = useRef(new Animated.Value(0))
  const hasTimerStatusRef = useRef(false)
  const [bottomPanelWidth, setBottomPanelWidth] = useState(0)
  const isFirstProgressUpdateRef = useRef<boolean>(true)

  useEffect(() => {
    // Reset quand on change d'exercice (avant même le premier onStatusChange).
    progressAnimRef.current.stopAnimation()
    progressAnimRef.current.setValue(0)
    hasTimerStatusRef.current = false
    isFirstProgressUpdateRef.current = true
  }, [exerciseIndex])

  const {
    initialDurationSeconds,
    hasNextExercise,
    nextIndex,
    exerciseTitle,
    exerciseImage,
    autoStart,
    isReps,
    repetitions,
    transitionSecondsBetweenTimers,
  } = useMemo((): TimerConfig => {
    const trainingIdValue = trainingId ?? ''
    const indexNum = exerciseIndex ? Number(exerciseIndex) : 0

    const training = trainings.find((t) => t.id === trainingIdValue)
    if (!training || !trainingIdValue) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null as number | null,
        exerciseTitle: 'Exercice',
        exerciseImage: null as string | null,
        autoStart: false,
        isReps: false,
        repetitions: 0,
        transitionSecondsBetweenTimers: 5,
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
        transitionSecondsBetweenTimers: 5,
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
        transitionSecondsBetweenTimers: training.transitionSecondsBetweenTimers ?? 5,
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

    const autoStart = !isReps

    return {
      initialDurationSeconds: durationInSeconds,
      hasNextExercise: hasNext,
      nextIndex,
      exerciseTitle: title,
      exerciseImage: image,
      autoStart,
      isReps,
      repetitions,
      transitionSecondsBetweenTimers: training.transitionSecondsBetweenTimers ?? 5,
    }
  }, [trainingId, exerciseIndex, trainings])

  useEffect(() => {
    // Sécurité : quand la durée initiale change (nouvel exercice), on remet le fill à 0.
    progressAnimRef.current.stopAnimation()
    progressAnimRef.current.setValue(0)
    hasTimerStatusRef.current = false
    isFirstProgressUpdateRef.current = true
  }, [initialDurationSeconds])

  useEffect(() => {
    if (isReps || isTransition || !hasTimerStatusRef.current) {
      progressAnimRef.current.stopAnimation()
      progressAnimRef.current.setValue(0)
      return
    }

    const elapsedSeconds = Math.max(0, initialDurationSeconds - remainingSeconds)
    const ratio = initialDurationSeconds > 0 ? Math.min(1, elapsedSeconds / initialDurationSeconds) : 0

    if (isFirstProgressUpdateRef.current) {
      progressAnimRef.current.stopAnimation()
      progressAnimRef.current.setValue(ratio)
      isFirstProgressUpdateRef.current = false
      return
    }

    if (!isRunning) {
      progressAnimRef.current.stopAnimation()
      progressAnimRef.current.setValue(ratio)
      return
    }

    progressAnimRef.current.stopAnimation()
    Animated.timing(progressAnimRef.current, {
      toValue: ratio,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start()
  }, [remainingSeconds, isRunning, isTransition, initialDurationSeconds, isReps])

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

  const finishTraining = () => {
    if (!trainingId) {
      router.replace('/home')
      return
    }

    router.replace({
      pathname: '/training-detail',
      params: { id: String(trainingId) },
    })
  }

  const progressWidth = bottomPanelWidth > 0 ? progressAnimRef.current.interpolate({
    inputRange: [0, 1],
    outputRange: [0, bottomPanelWidth],
  }) : 0

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={[styles.backButton, { top: insets.top + 8 }]}>
        <MaterialCommunityIcons name="arrow-left" size={26} color={LightColors.primary} />
      </TouchableOpacity>

      <View style={styles.layout}>
        <View style={styles.imageContainer}>
          {exerciseImage ? <Image source={{ uri: exerciseImage }} style={styles.image} resizeMode="cover" /> : null}
        </View>

        <View style={styles.bottomPanel} onLayout={(e) => setBottomPanelWidth(e.nativeEvent.layout.width)}>
          {!isTransition && !isReps ? <Animated.View style={[styles.panelFill, { width: progressWidth }]} /> : null}
          <View style={styles.bottomPanelContent}>
            <Text style={styles.title}>{exerciseTitle}</Text>

            {isReps ? (
              <View style={styles.repsBlock}>
                <Text style={styles.repsNumber}>{repetitions}</Text>
                <Text style={styles.repsLabel}>répétition(s)</Text>
              </View>
            ) : (
              <ExerciseTimer
                ref={timerRef}
                initialSeconds={initialDurationSeconds}
                autoStart={autoStart}
                hasNextExercise={hasNextExercise}
                transitionSecondsBetweenTimers={transitionSecondsBetweenTimers}
                transparentBackground
                onStatusChange={({ isRunning: running, isTransition: transition, remainingSeconds: seconds }) => {
                  hasTimerStatusRef.current = true
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
                  if (nextIndex === null) {
                    finishTraining()
                    return
                  }

                  goToNextExercise()
                }}
                style={[
                  styles.button,
                  {
                    backgroundColor: LightColors.primary,
                  },
                ]}
              >
                <Text style={styles.buttonText}>{nextIndex === null ? 'Terminer' : 'Suivant'}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  layout: {
    flex: 1,
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LightColors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    flex: 1,
    borderRadius: 0,
  },
  imageContainer: {
    width: '100%',
    flex: 1,
    backgroundColor: LightColors.white,
  },
  bottomPanel: {
    position: 'relative',
    backgroundColor: LightColors.white,
    flexShrink: 0,
    overflow: 'hidden',
  },
  bottomPanelContent: {
    zIndex: 1,
    position: 'relative',
    paddingHorizontal: 30,
    paddingTop: 12,
    paddingBottom: 30,
  },
  panelFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: LightColors.secondary,
  },
  repsBlock: {
    alignItems: 'center',
    marginTop: 16,
  },
  repsNumber: {
    fontSize: 50,
    fontWeight: '700',
    color: LightColors.primary,
  },
  repsLabel: {
    marginTop: 4,
    fontSize: 16,
    color: LightColors.grey,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    position: 'absolute',
    left: 10,
    zIndex: 50,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightColors.overlayLightStrong,
    borderRadius: 22,
    elevation: 4,
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
