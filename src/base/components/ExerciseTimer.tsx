import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
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

    const elapsedSecondsRef = useRef(0)
    const minutesBuzzedRef = useRef(0)
    const finishedBuzzRef = useRef(false)
    const hapticsSeqRef = useRef(0)
    const nextExerciseCalledRef = useRef(false)

    // Réinitialise le timer quand la durée ou l'autoStart changent
    useEffect(() => {
      setRemainingSeconds(initialSeconds)
      setIsTransition(false)
      setTransitionSeconds(5)
      setIsRunning(autoStart)
      elapsedSecondsRef.current = 0
      minutesBuzzedRef.current = 0
      finishedBuzzRef.current = false
      nextExerciseCalledRef.current = false
    }, [initialSeconds, autoStart])

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const runHapticsSequence = (count: number, style: 'minute' | 'finish') => {
      if (count <= 0) {
        return
      }
      const seqId = ++hapticsSeqRef.current
      ;(async () => {
        for (let i = 0; i < count; i++) {
          if (seqId !== hapticsSeqRef.current) {
            return
          }
          try {
            if (style === 'finish') {
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            } else {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
            }
          } catch {
            // Ignore si haptics indisponibles
          }
          await sleep(style === 'finish' ? 220 : 140)
        }
      })()
    }

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

            if (!finishedBuzzRef.current) {
              finishedBuzzRef.current = true
              runHapticsSequence(5, 'finish')
            }

            if (hasNextExercise && onNextExercise) {
              // Lance le timer de transition avant de passer au suivant
              nextExerciseCalledRef.current = false
              setIsTransition(true)
              setTransitionSeconds(5)
            }

            return 0
          }

          // Tick -> on incrémente le temps écoulé.
          elapsedSecondsRef.current += 1

          // Haptics minute par minute:
          // 1 vibration à 1min, 2 vibrations à 2min, etc.
          const elapsedMinutes = Math.floor(elapsedSecondsRef.current / 60)
          if (elapsedSecondsRef.current % 60 === 0 && elapsedMinutes > minutesBuzzedRef.current) {
            minutesBuzzedRef.current = elapsedMinutes
            runHapticsSequence(elapsedMinutes, 'minute')
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
            return 0
          }

          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    }, [isTransition, onNextExercise])

    // L'appel `onNextExercise` doit se faire après le rendu (pas dans un setter),
    // sinon React peut remonter l'erreur "Cannot update a component while rendering...".
    useEffect(() => {
      if (!isTransition) return
      if (transitionSeconds !== 0) return
      if (nextExerciseCalledRef.current) return
      if (!onNextExercise) return

      nextExerciseCalledRef.current = true
      setIsTransition(false)
      onNextExercise()
    }, [isTransition, transitionSeconds, onNextExercise])

    const handleStartPause = () => {
      if (isTransition) {
        return
      }

      if (remainingSeconds === 0) {
        setRemainingSeconds(initialSeconds)
        elapsedSecondsRef.current = 0
        minutesBuzzedRef.current = 0
        finishedBuzzRef.current = false
      }

      setIsRunning((prev) => !prev)
    }

    const handleReset = () => {
      setIsRunning(false)
      setIsTransition(false)
      setRemainingSeconds(initialSeconds)
      setTransitionSeconds(5)
      elapsedSecondsRef.current = 0
      minutesBuzzedRef.current = 0
      finishedBuzzRef.current = false
      nextExerciseCalledRef.current = false
      // Stoppe toute séquence haptics en cours
      hapticsSeqRef.current += 1
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
              <Text style={[styles.timerText, { color: textColor }]}>00:{String(transitionSeconds).padStart(2, '0')}</Text>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={24} color={textColor} />
              </View>
            </View>
          ) : (
            <View style={[styles.timerContainer, { borderColor }]}>
              <Text style={[styles.timerText, { color: textColor }]}>{formattedTime}</Text>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={24} color={textColor} />
              </View>
            </View>
          )}

          {!isTransition && remainingSeconds === 0 && <Text style={styles.finishedText}>Exercice terminé</Text>}
        </View>
      </TouchableOpacity>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerContainer: {
    minHeight: 100,
    minWidth: '100%',
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
