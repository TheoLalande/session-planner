import React, { useMemo, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Animated, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Button } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'

type PieceAnim = {
  progress: Animated.Value
}

export default function ConfettiTool() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const { width, height } = useWindowDimensions()
  const pieceCount = 34
  const buttonWrapRef = useRef<View | null>(null)

  const confettiColors = useMemo(
    () => [colors.primary, colors.secondary, colors.warmup, colors.renforcement, colors.strength, colors.gainage, colors.stretching, colors.climbing, colors.hangboard],
    [colors],
  )

  const pieces = useRef<PieceAnim[]>(
    Array.from({ length: pieceCount }, () => ({
      progress: new Animated.Value(0),
    })),
  ).current

  const origin = useRef({ x: width / 2, y: height / 2 }).current

  const layout = useMemo(
    () =>
      Array.from({ length: pieceCount }, (_, index) => {
        const angle = (Math.PI * 2 * index) / pieceCount + (Math.random() - 0.5) * 0.45
        const distance = 100 + Math.random() * 170
        const dx = Math.cos(angle) * distance
        const dy = Math.sin(angle) * distance - (40 + Math.random() * 120)
        const delay = Math.random() * 140
        const duration = 780 + Math.random() * 360
        const size = 7 + (index % 3) * 2
        const color = confettiColors[index % confettiColors.length]
        const spin = `${180 + Math.random() * 360}deg`
        return { dx, dy, delay, duration, size, color, spin }
      }),
    [confettiColors, pieceCount],
  )

  const playBurst = () => {
    const loops = pieces.map((piece, index) =>
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

    loops.forEach((anim) => anim.start())
  }

  const playConfetti = () => {
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

  return (
    <SafeAreaView style={styles.screen}>
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
            inputRange: [0, 0.85, 1],
            outputRange: [1, 1, 0],
          })
          const scale = piece.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.7],
          })
          return (
            <Animated.View
              key={`confetti-${index}`}
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

      <View style={styles.content}>
        <Text style={styles.title}>Mode célébration</Text>
        <Text style={styles.subtitle}>Appuie sur le bouton pour déclencher une explosion de confettis.</Text>
        <View ref={buttonWrapRef} collapsable={false}>
          <Button mode="contained" onPress={playConfetti} style={styles.button} buttonColor={colors.primary}>
            Confétie
          </Button>
        </View>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    confettiLayer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
    },
    piece: {
      position: 'absolute',
      top: 0,
      borderRadius: 2,
      opacity: 0.95,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    title: {
      fontSize: 30,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
    },
    subtitle: {
      marginTop: 10,
      fontSize: 15,
      fontWeight: '600',
      color: colors.grey,
      textAlign: 'center',
    },
    button: {
      marginTop: 16,
      minWidth: 140,
    },
  })
