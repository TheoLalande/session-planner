import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LightColors } from '../constants/theme'

type ExerciseTimerProps = {
  initialSeconds: number
  autoStart?: boolean
  hasNextExercise?: boolean
  onNextExercise?: () => void
  onStatusChange?: (status: { isRunning: boolean; isTransition: boolean; remainingSeconds: number }) => void
}

export type ExerciseTimerHandle = {
  startPause: () => void
  reset: () => void
}

export const ExerciseTimer = forwardRef<ExerciseTimerHandle, ExerciseTimerProps>(
  ({ initialSeconds, autoStart = false, hasNextExercise = false, onNextExercise, onStatusChange }, ref) => {
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

  useImperativeHandle(ref, () => ({
    startPause: handleStartPause,
    reset: handleReset,
  }))

  useEffect(() => {
    if (onStatusChange) {
      onStatusChange({ isRunning, isTransition, remainingSeconds })
    }
  }, [isRunning, isTransition, remainingSeconds, onStatusChange])

  const isActive = isRunning && !isTransition
  const borderColor = isActive ? '#008000' : '#ff3b30'
  const textColor = borderColor

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handleStartPause}>
      <View style={styles.container}>
        {isTransition ? (
          <View style={[styles.timerContainer, { borderColor }]}>
            <Text style={[styles.timerText, { color: textColor }]}>
              00:{String(transitionSeconds).padStart(2, '0')}
            </Text>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name={isActive ? 'pause' : 'play'}
                size={24}
                color={textColor}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.timerContainer, { borderColor }]}>
            <Text style={[styles.timerText, { color: textColor }]}>{formattedTime}</Text>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name={isActive ? 'pause' : 'play'}
                size={24}
                color={textColor}
              />
            </View>
          </View>
        )}

        {!isTransition && remainingSeconds === 0 && (
          <Text style={styles.finishedText}>Exercice terminé</Text>
        )}

        {isTransition && hasNextExercise && (
          <Text style={styles.finishedText}>
            Prochain exercice dans {transitionSeconds} seconde(s)
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: LightColors.primary,
    backgroundColor: LightColors.white,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  iconWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
})

