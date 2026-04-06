import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions, Platform, Alert, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Surface, IconButton, Button, Text as PaperText } from 'react-native-paper'
import { useTrainingStore } from '../store/trainingStore'
import { ExerciseTimer, ExerciseTimerHandle } from '../components/ExerciseTimer'
import TrainingProgressSegments from '../components/TrainingProgressSegments'
import { haptic } from '../utils/haptics'
import { useAppTheme } from '../providers/themeProvider'
import { getTransitionSecondsBeforeNextExercise } from '../utils/trainingTransitions'
import { Fonts } from '../constants/theme'
import type { IPlannedTraining } from '../types/trainingTypes'

type TimerConfig = {
  initialDurationSeconds: number
  hasNextExercise: boolean
  nextIndex: number | null
  currentIndex: number
  totalExercises: number
  totalBlocs: number
  blocIndex: number
  blocTitle: string
  exerciseTitle: string
  exerciseImage: string | null
  autoStart: boolean
  isReps: boolean
  repetitions: number
  transitionSecondsForNextStep: number
}

function getBlocProgressContext(training: IPlannedTraining, exerciseFlatIndex: number) {
  const totalBlocs = training.blocs.length
  let blocTitle = 'Bloc'
  let blocIndex = 0
  let flat = 0
  for (let b = 0; b < training.blocs.length; b++) {
    const bloc = training.blocs[b]
    const count = bloc.exercises.length
    if (exerciseFlatIndex >= flat && exerciseFlatIndex < flat + count) {
      blocIndex = b
      blocTitle = bloc.title || 'Bloc'
      break
    }
    flat += count
  }
  return { blocTitle, blocIndex, totalBlocs }
}

const { height: WINDOW_H } = Dimensions.get('window')

const NAV_ROW_BTN_HEIGHT = 46

export default function SimpleTimer() {
  const { trainingId, exerciseIndex, pendingTransitionSeconds } = useLocalSearchParams<{
    trainingId?: string
    exerciseIndex?: string
    pendingTransitionSeconds?: string
  }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const trainings = useTrainingStore((state) => state.trainings)
  const { colors, mode } = useAppTheme()
  const timerRef = useRef<ExerciseTimerHandle | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isTransition, setIsTransition] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const progressAnimRef = useRef(new Animated.Value(0))
  const hasTimerStatusRef = useRef(false)
  const [contentWidth, setContentWidth] = useState(0)
  const isFirstProgressUpdateRef = useRef<boolean>(true)
  const pendingTransitionSecondsValue = useMemo(() => {
    const rawValue = Array.isArray(pendingTransitionSeconds) ? pendingTransitionSeconds[0] : pendingTransitionSeconds
    const parsed = Number(rawValue ?? 0)
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 0
    }
    return parsed
  }, [pendingTransitionSeconds])

  useEffect(() => {
    progressAnimRef.current.stopAnimation()
    progressAnimRef.current.setValue(0)
    hasTimerStatusRef.current = false
    isFirstProgressUpdateRef.current = true
  }, [exerciseIndex])

  const {
    initialDurationSeconds,
    hasNextExercise,
    nextIndex,
    currentIndex,
    totalExercises,
    totalBlocs,
    blocIndex,
    exerciseTitle,
    blocTitle,
    exerciseImage,
    autoStart,
    isReps,
    repetitions,
    transitionSecondsForNextStep,
  } = useMemo((): TimerConfig => {
    const trainingIdValue = trainingId ?? ''
    const indexNum = exerciseIndex ? Number(exerciseIndex) : 0

    const training = trainings.find((t) => t.id === trainingIdValue)
    if (!training || !trainingIdValue) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null as number | null,
        currentIndex: 0,
        totalExercises: 0,
        totalBlocs: 0,
        blocIndex: 0,
        blocTitle: 'Bloc',
        exerciseTitle: 'Exercice',
        exerciseImage: null as string | null,
        autoStart: false,
        isReps: false,
        repetitions: 0,
        transitionSecondsForNextStep: 5,
      }
    }

    const exercises = training.blocs.flatMap((bloc) => bloc.exercises)

    if (exercises.length === 0 || indexNum < 0 || indexNum >= exercises.length) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null,
        currentIndex: 0,
        totalExercises: 0,
        totalBlocs: training.blocs.length,
        blocIndex: 0,
        blocTitle: 'Bloc',
        exerciseTitle: 'Exercice',
        exerciseImage: null,
        autoStart: false,
        isReps: false,
        repetitions: 0,
        transitionSecondsForNextStep: 5,
      }
    }

    const currentExercise = exercises[indexNum]
    const transitionSecondsForNextStep = getTransitionSecondsBeforeNextExercise(training, indexNum)
    const data: any = currentExercise.data
    const { blocTitle, blocIndex, totalBlocs } = getBlocProgressContext(training, indexNum)

    const hasNext = indexNum + 1 < exercises.length
    const nextIndex = hasNext ? indexNum + 1 : null

    if (currentExercise.type === 'hangboard' || currentExercise.type === 'climbing') {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: hasNext,
        nextIndex,
        currentIndex: indexNum,
        totalExercises: exercises.length,
        totalBlocs,
        blocIndex,
        blocTitle,
        exerciseTitle: 'Exercice',
        exerciseImage: null,
        autoStart: false,
        isReps: false,
        repetitions: 0,
        transitionSecondsForNextStep,
      }
    }

    const isReps = 'mode' in data && data.mode === 'reps'
    const repetitions = isReps && typeof data.repetitions === 'number' ? data.repetitions : 0

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
      else if (currentExercise.type === 'renforcement') title = 'Renforcement'
      else if (currentExercise.type === 'stretching') title = 'Étirement'
      else title = 'Exercice'
    }

    const image = data && 'picture' in data && data.picture ? data.picture : null

    const autoStart = !isReps

    return {
      initialDurationSeconds: durationInSeconds,
      hasNextExercise: hasNext,
      nextIndex,
      currentIndex: indexNum,
      totalExercises: exercises.length,
      totalBlocs,
      blocIndex,
      blocTitle,
      exerciseTitle: title,
      exerciseImage: image,
      autoStart,
      isReps,
      repetitions,
      transitionSecondsForNextStep,
    }
  }, [trainingId, exerciseIndex, trainings])

  useEffect(() => {
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

  const goToNextExercise = useCallback(
    (withTransition: boolean) => {
      if (nextIndex === null || !trainingId) {
        return
      }
      const trainingIdValue = trainingId ?? ''
      const indexNum = exerciseIndex ? Number(exerciseIndex) : 0
      const training = trainings.find((t) => t.id === trainingIdValue)
      const secs = training && withTransition ? getTransitionSecondsBeforeNextExercise(training, indexNum) : 0

      router.replace({
        pathname: '/run-exercise',
        params: {
          trainingId,
          exerciseIndex: String(nextIndex),
          pendingTransitionSeconds: withTransition && secs > 0 ? String(secs) : undefined,
        },
      })
    },
    [nextIndex, trainingId, exerciseIndex, trainings, router]
  )

  const goToPreviousExercise = useCallback(() => {
    if (currentIndex <= 0 || !trainingId) {
      return
    }
    router.replace({
      pathname: '/run-exercise',
      params: {
        trainingId,
        exerciseIndex: String(currentIndex - 1),
      },
    })
  }, [currentIndex, trainingId, router])

  const finishTraining = () => {
    if (!trainingId) {
      router.replace('/home')
      return
    }

    router.replace({
      pathname: '/session-complete',
      params: { trainingId: String(trainingId) },
    })
  }

  const quitTrainingWithConfirm = useCallback(() => {
    Alert.alert("Quitter l'entraînement ?", 'Tu pourras relancer cette séance depuis l’accueil.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: () => {
          void haptic('tap')
          router.replace('/home')
        },
      },
    ])
  }, [router])

  const progressFillWidth =
    contentWidth > 0
      ? progressAnimRef.current.interpolate({
          inputRange: [0, 1],
          outputRange: [0, contentWidth],
        })
      : 0

  const heroImageHeight = Math.min(WINDOW_H * 0.4, 300)
  const sheetBg = colors.white
  const timerWellBg = mode === 'dark' ? colors.lightGrey : colors.background
  const backFabBg = mode === 'dark' ? colors.darkBadgeBackground : colors.white
  const backFabBorder = mode === 'dark' ? colors.darkBorder : colors.cardBorder

  const hasPreviousExercise = currentIndex > 0
  const scrollPaddingTop = 16
  const segmentDoneOnImage = colors.white
  const segmentTodoOnImage = 'rgba(255,255,255,0.32)'

  const progressSegmentsBlock = (
    <>
      {totalBlocs > 1 ? (
        <>
          <TrainingProgressSegments
            totalSegments={totalBlocs}
            completedSegments={blocIndex}
            completedColor={exerciseImage ? segmentDoneOnImage : undefined}
            pendingColor={exerciseImage ? segmentTodoOnImage : undefined}
            style={styles.segmentsRowLast}
          />
        </>
      ) : null}
      <TrainingProgressSegments
        totalSegments={totalExercises}
        completedSegments={currentIndex}
        completedColor={exerciseImage ? segmentDoneOnImage : undefined}
        pendingColor={exerciseImage ? segmentTodoOnImage : undefined}
        style={styles.segmentsRowTight}
      />
    </>
  )

  return (
    <SafeAreaView edges={['bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
      <IconButton
        icon="arrow-left"
        iconColor={colors.primary}
        onPress={() => router.back()}
        style={[
          styles.backFab,
          {
            top: insets.top + 6,
            backgroundColor: backFabBg,
            borderColor: backFabBorder,
          },
        ]}
        accessibilityLabel="Retour"
      />

      {exerciseImage ? (
        <View
          style={[
            styles.heroImageWrap,
            {
              height: heroImageHeight,
              borderBottomColor: colors.cardBorderMuted,
            },
          ]}
        >
          <Image source={{ uri: exerciseImage }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.12)', colors.background]} locations={[0.2, 1]} style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.4)', 'transparent']}
            locations={[0, 0.55, 1]}
            style={styles.heroSegmentsBackdrop}
          />
          <View style={[styles.heroSegmentsOverlay, { paddingTop: insets.top + 5, paddingHorizontal: 16 }]}>{progressSegmentsBlock}</View>
        </View>
      ) : (
        <View
          style={[
            styles.segmentsTopStrip,
            {
              paddingTop: insets.top + 50,
              backgroundColor: colors.background,
              borderBottomColor: colors.cardBorderMuted,
            },
          ]}
        >
          <View style={styles.segmentsTopStripInner}>{progressSegmentsBlock}</View>
        </View>
      )}

      <Surface
        style={[
          styles.sheet,
          {
            backgroundColor: sheetBg,
            marginTop: exerciseImage ? -26 : 0,
            borderColor: colors.cardBorderMuted,
            ...Platform.select({
              ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.08,
                shadowRadius: 16,
              },
              android: { elevation: 6 },
            }),
          },
        ]}
        elevation={0}
      >
        <View style={styles.sheetInner}>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={[styles.sheetScrollContent, { paddingTop: scrollPaddingTop }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}
          >
            <View style={[styles.progressTrack, { backgroundColor: colors.lightGrey }]}>
              {!isTransition && !isReps ? (
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressFillWidth,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              ) : null}
            </View>

            <View
              style={[
                styles.blocHighlight,
                {
                  backgroundColor: colors.badgeBackground,
                  borderLeftColor: colors.primary,
                },
              ]}
            >
              <MaterialCommunityIcons name="view-dashboard-outline" size={22} color={colors.primary} />
              <Text style={[styles.blocTitleText, { color: colors.black }]} numberOfLines={2}>
                {blocTitle}
              </Text>
            </View>

            <Text style={[styles.exerciseTitle, { color: colors.black }]} numberOfLines={3}>
              {exerciseTitle}
            </Text>

            {isReps ? (
              <Surface style={[styles.repsCard, { backgroundColor: timerWellBg, borderColor: colors.cardBorder }]} elevation={0}>
                <PaperText variant="headlineMedium" style={{ color: colors.mutedText, textAlign: 'center' }}>
                  Répétitions
                </PaperText>
                <Text style={[styles.repsNumber, { color: colors.primary }]}>{repetitions}</Text>
              </Surface>
            ) : (
              <View style={[styles.timerWell, { backgroundColor: timerWellBg, borderColor: colors.cardBorder }]}>
                <ExerciseTimer
                  ref={timerRef}
                  initialSeconds={initialDurationSeconds}
                  autoStart={autoStart}
                  hasNextExercise={hasNextExercise}
                  transitionSecondsBetweenTimers={transitionSecondsForNextStep}
                  transparentBackground
                  onStatusChange={({ isRunning: running, isTransition: transition, remainingSeconds: seconds }) => {
                    hasTimerStatusRef.current = true
                    setIsRunning(running)
                    setIsTransition(transition)
                    setRemainingSeconds(seconds)
                  }}
                  initialTransitionSeconds={pendingTransitionSecondsValue}
                  onNextExercise={hasNextExercise ? () => goToNextExercise(true) : undefined}
                />
                <PaperText variant="bodySmall" style={[styles.timerHint, { color: colors.mutedText }]}>
                  Appuie sur le chrono pour lancer ou mettre en pause
                </PaperText>
              </View>
            )}

            <View style={styles.secondaryActionsScrollable}>
              {!isReps ? (
                <Button
                  mode="text"
                  icon="backup-restore"
                  onPress={async () => {
                    await haptic('tap')
                    timerRef.current?.reset()
                  }}
                  textColor={colors.primary}
                  style={styles.resetBtn}
                  labelStyle={styles.resetBtnLabel}
                  compact
                >
                  Réinitialiser le chrono
                </Button>
              ) : null}

              <Button
                mode="text"
                onPress={() => {
                  void haptic('tap')
                  quitTrainingWithConfirm()
                }}
                textColor={colors.mutedText}
                style={styles.quitBtn}
                labelStyle={styles.quitBtnLabel}
                compact
              >
                {"Quitter l'entraînement"}
              </Button>
            </View>
          </ScrollView>

          <View style={[styles.bottomActions, { borderTopColor: colors.cardBorderMuted }]}>
            <View style={styles.actionsBlock}>
              <View style={styles.navSection}>
                <View style={styles.navRow}>
                  {hasPreviousExercise ? (
                    <Button
                      mode="outlined"
                      compact
                      icon="chevron-left"
                      onPress={async () => {
                        await haptic('tap')
                        goToPreviousExercise()
                      }}
                      style={[
                        styles.navBtn,
                        styles.navBtnHalf,
                        { borderColor: colors.primary, minHeight: NAV_ROW_BTN_HEIGHT, maxHeight: NAV_ROW_BTN_HEIGHT },
                      ]}
                      contentStyle={styles.navBtnContent}
                      labelStyle={styles.navBtnLabel}
                      textColor={colors.primary}
                    >
                      Précédent
                    </Button>
                  ) : null}
                  <Button
                    mode="contained"
                    compact
                    onPress={async () => {
                      await haptic('tap')
                      if (nextIndex === null) {
                        finishTraining()
                        return
                      }
                      goToNextExercise(false)
                    }}
                    style={[
                      styles.navBtn,
                      hasPreviousExercise ? styles.navBtnHalf : styles.navBtnFull,
                      { minHeight: NAV_ROW_BTN_HEIGHT, maxHeight: NAV_ROW_BTN_HEIGHT },
                    ]}
                    contentStyle={[styles.navBtnContent, styles.navBtnPrimaryContent]}
                    buttonColor={colors.primary}
                  >
                    <View style={styles.navPrimaryInner}>
                      <Text style={[styles.navBtnLabelContained, { color: colors.white }]}>{nextIndex === null ? 'Terminer' : 'Suivant'}</Text>
                      <MaterialCommunityIcons name={nextIndex === null ? 'check' : 'chevron-right'} size={18} color={colors.white} />
                    </View>
                  </Button>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Surface>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backFab: {
    position: 'absolute',
    left: 16,
    zIndex: 20,
    margin: 0,
    borderWidth: 1,
    borderRadius: 22,
  },
  heroImageWrap: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  heroSegmentsBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 124,
    zIndex: 3,
  },
  heroSegmentsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 4,
    paddingBottom: 8,
  },
  segmentsTopStrip: {
    width: '100%',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentsTopStripInner: {
    paddingHorizontal: 22,
    paddingBottom: 10,
  },
  segmentsRowTight: {
    marginBottom: 0,
  },
  segmentsRowLast: {
    marginBottom: 4,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },
  sheetScroll: {
    flex: 1,
    minHeight: 0,
  },
  sheetScrollContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  segmentsLabel: {
    marginBottom: 4,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  blocHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 5,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginBottom: 14,
  },
  blocTitleText: {
    flex: 1,
    fontFamily: Fonts.poppins.bold,
    fontSize: 17,
    lineHeight: 22,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  exerciseTitle: {
    fontFamily: Fonts.poppins.bold,
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 20,
  },
  repsCard: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  repsNumber: {
    fontFamily: Fonts.poppins.bold,
    fontSize: 48,
    lineHeight: 54,
    textAlign: 'center',
    marginTop: 8,
  },
  timerWell: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
  },
  timerHint: {
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 0,
  },
  bottomActions: {
    flexShrink: 0,
    gap: 0,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionsBlock: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  navSection: {
    marginBottom: 3,
  },
  secondaryActionsScrollable: {
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
    marginBottom: 10,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    gap: 12,
  },
  navBtnPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navPrimaryInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  navBtnLabelContained: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  navBtn: {
    borderRadius: 12,
    justifyContent: 'center',
  },
  navBtnHalf: {
    flex: 1,
    minWidth: 0,
  },
  navBtnFull: {
    flex: 1,
    width: '100%',
  },
  navBtnContent: {
    paddingVertical: 0,
    paddingHorizontal: 10,
    minHeight: NAV_ROW_BTN_HEIGHT - 2,
    justifyContent: 'center',
  },
  navBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.15,
    marginVertical: 0,
  },
  resetBtn: {
    alignSelf: 'center',
    marginTop: 0,
    minHeight: 36,
  },
  resetBtnLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginVertical: 0,
  },
  quitBtn: {
    alignSelf: 'center',
    marginTop: 0,
    minHeight: 34,
  },
  quitBtnLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginVertical: 0,
  },
})
