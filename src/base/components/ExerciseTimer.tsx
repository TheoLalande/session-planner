import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LightColors } from '../constants/theme'

type ExerciseTimerProps = {
  title: string
  imageUri?: string | null
  initialSeconds: number
  autoStart?: boolean
  hasNextExercise?: boolean
  onNextExercise?: () => void
}

export function ExerciseTimer({
  title,
  imageUri,
  initialSeconds,
  autoStart = false,
  hasNextExercise = false,
  onNextExercise,
}: ExerciseTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [isTransition, setIsTransition] = useState(false)
  const [transitionSeconds, setTransitionSeconds] = useState(5)

  // Réinitialise le timer quand la durée ou l'autoStart changent
  useEffect(() => {
    setRemainingSeconds(initialSeconds)
    setIsTransition(false)
    setTransitionSeconds(5)
    setIsRunning(autoStart)
  }, [initialSeconds, autoStart])

  // Timer principal (compte à rebours de l'exercice)
  useEffect(() => {
    if (!isRunning || isTransition) {
      return
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setIsRunning(false)

          if (hasNextExercise && onNextExercise) {
            // Lance le timer de transition avant de passer au suivant
            setIsTransition(true)
            setTransitionSeconds(5)
          }

          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, isTransition, hasNextExercise, onNextExercise])

  // Timer de transition (5 secondes entre deux exercices)
  useEffect(() => {
    if (!isTransition) {
      return
    }

    const interval = setInterval(() => {
      setTransitionSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (onNextExercise) {
            onNextExercise()
          }
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTransition, onNextExercise])

  const handleStartPause = () => {
    if (isTransition) {
      return
    }

    if (remainingSeconds === 0) {
      setRemainingSeconds(initialSeconds)
    }

    setIsRunning((prev) => !prev)
  }

  const handleReset = () => {
    setIsRunning(false)
    setIsTransition(false)
    setRemainingSeconds(initialSeconds)
    setTransitionSeconds(5)
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" /> : null}

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

        {isTransition && hasNextExercise && (
          <Text style={styles.finishedText}>Prochain exercice dans {transitionSeconds} seconde(s)</Text>
        )}

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

