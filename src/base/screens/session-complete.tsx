import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { PrimaryButton } from '../components'
import { useTrainingStore } from '../store/trainingStore'
import { createCompletedSession } from '../api/completedSessionsService'
import { useAppTheme } from '../providers/themeProvider'

export default function SessionComplete() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const { width, height } = useWindowDimensions()
  const { trainingId } = useLocalSearchParams<{ trainingId?: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const trainings = useTrainingStore((state) => state.trainings)
  const isLoadingTrainings = useTrainingStore((state) => state.isLoadingTrainings)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)
  const training = useMemo(() => trainings.find((item) => item.id === String(trainingId)), [trainingId, trainings])
  const buttonWrapRef = React.useRef<View | null>(null)
  const pieceCount = 30
  const confettiColors = useMemo(
    () => [colors.primary, colors.secondary, colors.warmup, colors.renforcement, colors.strength, colors.gainage, colors.stretching, colors.climbing, colors.hangboard],
    [colors],
  )
  const pieces = React.useRef(
    Array.from({ length: pieceCount }, () => ({
      progress: new Animated.Value(0),
    })),
  ).current
  const origin = React.useRef({ x: width / 2, y: height / 2 }).current

  const layout = useMemo(
    () =>
      Array.from({ length: pieceCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / pieceCount + (Math.random() - 0.5) * 0.45
        const distance = 90 + Math.random() * 170
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance - (40 + Math.random() * 120)
        const delay = Math.random() * 140
        const duration = 760 + Math.random() * 360
        const size = 7 + (index % 3) * 2
        const color = confettiColors[index % confettiColors.length]
        const spin = `${180 + Math.random() * 360}deg`
        return { dx, dy, delay, duration, size, color, spin }
      }),
    [confettiColors, pieceCount],
  )

  const playBurst = () => {
    const animations = pieces.map((piece, index) =>
      Animated.sequence([
        Animated.delay(layout[index].delay),
        Animated.timing(piece.progress, {
          toValue: 1,
          duration: layout[index].duration,
          useNativeDriver: true,
        }),
      ]),
    )

    pieces.forEach((piece) => {
      piece.progress.stopAnimation()
      piece.progress.setValue(0)
    })
    animations.forEach((animation) => animation.start())
  }

  const playConfettiFromButton = () => {
    if (!buttonWrapRef.current || typeof buttonWrapRef.current.measureInWindow !== 'function') {
      playBurst()
      return
    }
    buttonWrapRef.current.measureInWindow((x, y, w, h) => {
      origin.x = x + w / 2
      origin.y = y + h / 2
      playBurst()
    })
  }

  useEffect(() => {
    if (!trainingId) {
      return
    }
    if (training) {
      return
    }
    loadTrainings()
  }, [loadTrainings, training, trainingId])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View pointerEvents="none" style={styles.confettiLayer}>
          {pieces.map((piece, index) => {
            const translateY = piece.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, layout[index].dy],
            })
            const rotate = piece.progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', layout[index].spin],
            })
            const translateX = piece.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, layout[index].dx],
            })
            const opacity = piece.progress.interpolate({
              inputRange: [0, 0.01, 0.85, 1],
              outputRange: [0, 1, 1, 0],
            })
            const scale = piece.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.7],
            })
            return (
              <Animated.View
                key={`session-confetti-${index}`}
                style={[
                  styles.piece,
                  {
                    left: origin.x,
                    top: origin.y,
                    width: layout[index].size,
                    height: layout[index].size * 1.6,
                    backgroundColor: layout[index].color,
                    opacity,
                    transform: [{ translateY }, { translateX }, { rotate }, { scale }],
                  },
                ]}
              />
            )
          })}
        </View>
        <Text style={styles.title}>Session terminée ?</Text>
        <Text style={styles.subtitle}>Confirme que tu as bien réalisé toute la séance.</Text>

        <View style={styles.buttons}>
          <View ref={buttonWrapRef} collapsable={false} style={{ width: '100%', alignItems: 'center' }}>
            <PrimaryButton
              title="Oui, session terminée"
              isClickable={!isSaving && !isLoadingTrainings}
              onPress={async () => {
                playConfettiFromButton()
                if (!trainingId) {
                  router.replace('/home')
                  return
                }
                if (isLoadingTrainings) {
                  return
                }
                if (!training) {
                  Alert.alert('Info', "Chargement de l'entrainement en cours, réessaie dans quelques secondes.")
                  return
                }
                try {
                  setIsSaving(true)
                  await createCompletedSession({
                    trainingId: String(trainingId),
                    blocs: training.blocs,
                  })
                } catch (e) {
                  const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : "Erreur lors de l'enregistrement de la séance"
                  Alert.alert('Erreur', message)
                  return
                } finally {
                  setIsSaving(false)
                }
                router.replace({ pathname: '/training-detail', params: { id: String(trainingId) } })
              }}
            />
          </View>
          <PrimaryButton
            title="Pas encore"
            color={colors.white}
            borderColor={colors.primary}
            textColor={colors.primary}
            onPress={() => {
              if (!trainingId) {
                router.replace('/home')
                return
              }
              router.replace({ pathname: '/run-exercise', params: { trainingId: String(trainingId), exerciseIndex: '0' } })
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: colors.grey,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    marginTop: 22,
    gap: 10,
    alignItems: 'center',
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 999,
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
    opacity: 0.95,
    zIndex: 1000,
    elevation: 1000,
  },
})
