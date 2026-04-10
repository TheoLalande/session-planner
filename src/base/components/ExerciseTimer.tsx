import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Audio } from 'expo-av'
import { useAppTheme } from '../providers/themeProvider'

type ExerciseTimerProps = {
  initialSeconds: number
  autoStart?: boolean
  hasNextExercise?: boolean
  transitionSecondsBetweenTimers?: number
  initialTransitionSeconds?: number
  transparentBackground?: boolean
  onNextExercise?: () => void
  onStatusChange?: (status: { isRunning: boolean; isTransition: boolean; remainingSeconds: number }) => void
}

export type ExerciseTimerHandle = {
  startPause: () => void
  reset: () => void
}

export const ExerciseTimer = forwardRef<ExerciseTimerHandle, ExerciseTimerProps>(
  (
    {
      initialSeconds,
      autoStart = false,
      hasNextExercise = false,
      transitionSecondsBetweenTimers = 5,
      initialTransitionSeconds = 0,
      transparentBackground = false,
      onNextExercise,
      onStatusChange,
    },
    ref
  ) => {
    const { colors } = useAppTheme()
    const styles = createStyles(colors)
    const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
    const [isRunning, setIsRunning] = useState(autoStart && initialTransitionSeconds <= 0)
    const [isTransition, setIsTransition] = useState(initialTransitionSeconds > 0)
    const [transitionSeconds, setTransitionSeconds] = useState(initialTransitionSeconds > 0 ? initialTransitionSeconds : transitionSecondsBetweenTimers)
    const [shouldGoToNext, setShouldGoToNext] = useState(false)

    const elapsedSecondsRef = useRef(0)
    const minutesBuzzedRef = useRef(0)
    const finishedBuzzRef = useRef(false)
    const preEndBellPlayedRef = useRef(false)
    const hapticsSeqRef = useRef(0)
    const nextExerciseCalledRef = useRef(false)
    const initialTransitionActiveRef = useRef(initialTransitionSeconds > 0)
    const bellSoundRef = useRef<Audio.Sound | null>(null)
    const tictacSoundRef = useRef<Audio.Sound | null>(null)
    const startSoundPlayedRef = useRef(false)

    const playBellSound = async () => {
      try {
        if (bellSoundRef.current) {
          await bellSoundRef.current.replayAsync()
          return
        }
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/bell-sound.mp3'))
        bellSoundRef.current = sound
        await sound.playAsync()
      } catch {
        return
      }
    }

    const playStartExerciseSound = async () => {
      try {
        if (tictacSoundRef.current) {
          await tictacSoundRef.current.replayAsync()
          return
        }
        const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/tictac.mp3'))
        tictacSoundRef.current = sound
        await sound.playAsync()
      } catch {
        return
      }
    }

    useEffect(() => {
      return () => {
        if (bellSoundRef.current) {
          void bellSoundRef.current.unloadAsync()
        }
        if (tictacSoundRef.current) {
          void tictacSoundRef.current.unloadAsync()
        }
      }
    }, [])

    useEffect(() => {
      setRemainingSeconds(initialSeconds)
      const hasInitialTransition = initialTransitionSeconds > 0
      setIsTransition(hasInitialTransition)
      setTransitionSeconds(hasInitialTransition ? initialTransitionSeconds : transitionSecondsBetweenTimers)
      setIsRunning(autoStart && !hasInitialTransition)
      setShouldGoToNext(false)
      elapsedSecondsRef.current = 0
      minutesBuzzedRef.current = 0
      finishedBuzzRef.current = false
      preEndBellPlayedRef.current = false
      nextExerciseCalledRef.current = false
      initialTransitionActiveRef.current = hasInitialTransition
      startSoundPlayedRef.current = false
    }, [initialSeconds, autoStart, transitionSecondsBetweenTimers, initialTransitionSeconds])

    useEffect(() => {
      if (!isRunning || isTransition || remainingSeconds !== initialSeconds) {
        if (!isRunning || isTransition) {
          startSoundPlayedRef.current = false
        }
        return
      }
      if (startSoundPlayedRef.current) {
        return
      }
      startSoundPlayedRef.current = true
      void playStartExerciseSound()
    }, [isRunning, isTransition, remainingSeconds, initialSeconds])

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
          if (prev === 2 && !preEndBellPlayedRef.current) {
            preEndBellPlayedRef.current = true
            void playBellSound()
          }

          if (prev <= 1) {
            clearInterval(interval)
            setIsRunning(false)

            if (!finishedBuzzRef.current) {
              finishedBuzzRef.current = true
              runHapticsSequence(5, 'finish')
            }

            if (hasNextExercise && onNextExercise) {
              setShouldGoToNext(true)
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

    useEffect(() => {
      if (shouldGoToNext && onNextExercise && !nextExerciseCalledRef.current) {
        nextExerciseCalledRef.current = true
        setShouldGoToNext(false)
        onNextExercise()
      }
    }, [shouldGoToNext, onNextExercise])

    useEffect(() => {
      if (!isTransition) return
      if (transitionSeconds !== 0) return
      setIsTransition(false)
      if (initialTransitionActiveRef.current) {
        initialTransitionActiveRef.current = false
        if (autoStart) {
          setIsRunning(true)
        }
      }
    }, [isTransition, transitionSeconds, autoStart])

    const handleStartPause = () => {
      if (isTransition) {
        return
      }

      if (remainingSeconds === 0) {
        setRemainingSeconds(initialSeconds)
        elapsedSecondsRef.current = 0
        minutesBuzzedRef.current = 0
        finishedBuzzRef.current = false
        preEndBellPlayedRef.current = false
        startSoundPlayedRef.current = false
      }

      setIsRunning((prev) => !prev)
    }

    const handleReset = () => {
      setIsRunning(false)
      setIsTransition(false)
      setRemainingSeconds(initialSeconds)
      setTransitionSeconds(transitionSecondsBetweenTimers)
      setShouldGoToNext(false)
      elapsedSecondsRef.current = 0
      minutesBuzzedRef.current = 0
      finishedBuzzRef.current = false
      preEndBellPlayedRef.current = false
      nextExerciseCalledRef.current = false
      initialTransitionActiveRef.current = false
      // Stoppe toute séquence haptics en cours
      hapticsSeqRef.current += 1
      if (bellSoundRef.current) {
        void bellSoundRef.current.stopAsync()
      }
      if (tictacSoundRef.current) {
        void tictacSoundRef.current.stopAsync()
      }
    }

    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    const formattedTime = remainingSeconds < 60 ? String(remainingSeconds) : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

    const transitionFormattedTime = transitionSeconds < 60 ? String(transitionSeconds) : `00:${String(transitionSeconds).padStart(2, '0')}`

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
    const textColor = isTransition ? colors.danger : colors.primary

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={handleStartPause}>
        <View style={styles.container}>
          {isTransition ? (
            <View style={[styles.timerContainer, { backgroundColor: transparentBackground ? 'transparent' : colors.white }]}>
              <Text style={[styles.timerText, { color: textColor }]}>{transitionFormattedTime}</Text>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={24} color={textColor} />
              </View>
            </View>
          ) : (
            <View style={[styles.timerContainer, { backgroundColor: transparentBackground ? 'transparent' : colors.white }]}>
              <Text style={[styles.timerText, { color: textColor }]}>{formattedTime}</Text>
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name={isActive ? 'pause' : 'play'} size={24} color={textColor} />
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  }
)

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerContainer: {
    minHeight: 100,
    minWidth: '100%',
    paddingVertical: 24,
    paddingHorizontal: 40,

    backgroundColor: colors.white,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  finishedText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    color: colors.grey,
  },
  iconWrapper: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
})
