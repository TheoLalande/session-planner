import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { LightColors } from '../constants/theme'
import { useTrainingStore } from '../store/trainingStore'

export default function SimpleTimer() {
  const { trainingId, timeIndex } = useLocalSearchParams<{ trainingId?: string; timeIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)

  const { initialDurationSeconds, hasNextExercise, nextIndex, exerciseTitle, exerciseImage } = useMemo(() => {
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
      }
    }

    const timeExercises = training.blocs
      .flatMap((bloc) => bloc.exercises)
      .filter((exercise) => exercise.type === 'warmup' || exercise.type === 'cooldown' || exercise.type === 'stretching')

    if (timeExercises.length === 0 || indexNum < 0 || indexNum >= timeExercises.length) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null,
        exerciseTitle: 'Exercice',
        exerciseImage: null,
      }
    }

    const currentExercise = timeExercises[indexNum]

    // Gestion de la durée selon l'unité choisie (minutes ou secondes)
    let durationValue = 'duration' in currentExercise.data ? currentExercise.data.duration : 1
    let durationUnit = 'durationUnit' in currentExercise.data && currentExercise.data.durationUnit ? currentExercise.data.durationUnit : 'seconds'

    if (Number.isNaN(durationValue) || durationValue <= 0) {
      durationValue = 1
    }

    const durationInSeconds = durationUnit === 'minutes' ? durationValue * 60 : durationValue

    const hasNext = indexNum + 1 < timeExercises.length

    let title = currentExercise.data && 'title' in currentExercise.data ? currentExercise.data.title : ''
    if (!title) {
      if (currentExercise.type === 'warmup') title = 'Échauffement'
      else if (currentExercise.type === 'cooldown') title = 'Retour au calme'
      else if (currentExercise.type === 'stretching') title = 'Étirement'
      else title = 'Exercice'
    }

    const image = currentExercise.data && 'picture' in currentExercise.data && currentExercise.data.picture ? currentExercise.data.picture : null

    return {
      initialDurationSeconds: durationInSeconds,
      hasNextExercise: hasNext,
      nextIndex: hasNext ? indexNum + 1 : null,
      exerciseTitle: title,
      exerciseImage: image,
    }
  }, [trainingId, timeIndex, trainings])

  const [remainingSeconds, setRemainingSeconds] = useState(initialDurationSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isTransition, setIsTransition] = useState(false)
  const [transitionSeconds, setTransitionSeconds] = useState(5)

  useEffect(() => {
    // Si la durée change (nouveaux params / nouvel exercice), on réinitialise le timer principal
    setRemainingSeconds(initialDurationSeconds)
    setIsTransition(false)
    setTransitionSeconds(5)

    // À partir du deuxième exercice, on démarre automatiquement le timer
    const indexNum = timeIndex ? Number(timeIndex) : 0
    if (indexNum > 0) {
      setIsRunning(true)
    } else {
      setIsRunning(false)
    }
  }, [initialDurationSeconds, timeIndex])

  useEffect(() => {
    if (!isRunning || isTransition) {
      return
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)

          // Si un prochain exercice existe, on lance le timer de transition
          if (hasNextExercise) {
            setIsTransition(true)
            setTransitionSeconds(5)
          }

          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isTransition, hasNextExercise])

  // Gestion du mini-timer de transition (5 secondes) entre deux exercices
  useEffect(() => {
    if (!isTransition) {
      return
    }

    const interval = setInterval(() => {
      setTransitionSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTransition])

  // Quand le mini-timer atteint 0, on déclenche la navigation vers l'exercice suivant
  useEffect(() => {
    if (!isTransition || transitionSeconds > 0) {
      return
    }

    if (hasNextExercise && nextIndex !== null && trainingId) {
      router.replace({
        pathname: '/simple-timer',
        params: {
          trainingId,
          timeIndex: String(nextIndex),
        },
      })
    } else {
      setIsTransition(false)
    }
  }, [hasNextExercise, isTransition, nextIndex, router, trainingId, transitionSeconds])

  const handleStartPause = () => {
    if (isTransition) {
      return
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(initialDurationSeconds)
    }

    setIsRunning((prev) => !prev)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsTransition(false)
    setRemainingSeconds(initialDurationSeconds)
    setTransitionSeconds(5)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{exerciseTitle}</Text>
        {exerciseImage ? <Image source={{ uri: exerciseImage }} style={styles.image} resizeMode="cover" /> : null}

        {isTransition ? (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>00:{String(transitionSeconds).padStart(2, '0')}</Text>
          </View>
        ) : (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formattedTime}</Text>
          </View>
        )}

        {!isTransition && remainingSeconds === 0 && <Text style={styles.finishedText}>Exercice terminé</Text>}

        {isTransition && hasNextExercise && <Text style={styles.finishedText}>Prochain exercice dans {transitionSeconds} seconde(s)</Text>}

        <View style={styles.buttonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleStartPause}
            disabled={isTransition}
            style={[
              styles.button,
              {
                backgroundColor: isTransition ? LightColors.lightGrey : isRunning ? LightColors.grey : LightColors.primary,
              },
            ]}
          >
            <Text style={styles.buttonText}>{isRunning ? 'Pause' : 'Démarrer'}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} onPress={handleReset} style={[styles.button, styles.secondaryButton]}>
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Réinitialiser</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: LightColors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: LightColors.grey,
    marginBottom: 24,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    maxWidth: 320,
    height: 160,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: LightColors.primary,
    backgroundColor: LightColors.white,
    marginBottom: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: LightColors.primary,
  },
  finishedText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    color: LightColors.grey,
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
