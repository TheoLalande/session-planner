import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { LightColors } from '../constants/theme'

type ExerciseTimerTestProps = {
  initialSeconds: number
  autoStart?: boolean
  hasNextExercise?: boolean
  onNextExercise?: () => void
  onStatusChange?: (status: { isRunning: boolean; isTransition: boolean; remainingSeconds: number }) => void
}

export type ExerciseTimerTestHandle = {
  startPause: () => void
  reset: () => void
}

export const ExerciseTimerTest = forwardRef<ExerciseTimerTestHandle, ExerciseTimerTestProps>(
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
    const progressAnimRef = useRef(new Animated.Value(0))

    useEffect(() => {
      setRemainingSeconds(initialSeconds)
      setIsTransition(false)
      setTransitionSeconds(5)
      setIsRunning(autoStart)
      elapsedSecondsRef.current = 0
      minutesBuzzedRef.current = 0
      finishedBuzzRef.current = false
      nextExerciseCalledRef.current = false
      progressAnimRef.current.setValue(0)
    }, [initialSeconds, autoStart])

    useEffect(() => {
      if (isTransition) {
        progressAnimRef.current.stopAnimation()
        return
      }

      const targetRatio = initialSeconds > 0 ? Math.min(1, Math.max(0, (initialSeconds - remainingSeconds) / initialSeconds)) : 0

      if (!isRunning || remainingSeconds === 0) {
        progressAnimRef.current.stopAnimation()
        progressAnimRef.current.setValue(targetRatio)
        return
      }

      Animated.timing(progressAnimRef.current, {
        toValue: targetRatio,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start()
    }, [remainingSeconds, isRunning, isTransition, initialSeconds])

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
      hapticsSeqRef.current += 1
      progressAnimRef.current.stopAnimation()
      progressAnimRef.current.setValue(0)
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
    const progressWidth = progressAnimRef.current.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    })

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handleStartPause}>
        <View style={styles.container}>
          {isTransition ? (
            <View style={[styles.timerContainer, { borderColor }]}>
              <View style={styles.timerContent}>
                <Text style={[styles.timerText, { color: textColor }]}>00:{String(transitionSeconds).padStart(2, '0')}</Text>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={24} color={textColor} />
                </View>
              </View>
            </View>
          ) : (
            <View style={[styles.timerContainer, { borderColor }]}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
              <View style={styles.timerContent}>
                <Text style={[styles.timerText, { color: textColor }]}>{formattedTime}</Text>
                <View style={styles.iconWrapper}>
                  <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={24} color={textColor} />
                </View>
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
    width: '100%',
    alignItems: 'center',
  },
  timerContainer: {
    minHeight: '100%',
    minWidth: '100%',

    backgroundColor: LightColors.white,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContent: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: LightColors.primary,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: LightColors.primary,
    zIndex: 1,
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
    zIndex: 1,
  },
})
