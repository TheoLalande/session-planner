import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useAppTheme } from '../providers/themeProvider'

const GRADE_OPTIONS = ['4', '5a', '5a+', '5b', '5b+', '5c', '5c+', '6a', '6a+', '6b', '6+b', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a'] as const

const normalizeGrade = (value: string) => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '')
  if (normalized === '6b+') {
    return '6+b'
  }
  return normalized
}

const toDisplayGrade = (value: string) => (value === '6+b' ? '6b+' : value)

type GradeStepperProps = {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function GradeStepper({ value, onChange, label = 'Cotation' }: GradeStepperProps) {
  const { colors } = useAppTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const currentIndex = useMemo(() => {
    const normalized = normalizeGrade(value)
    const index = GRADE_OPTIONS.findIndex((grade) => normalizeGrade(grade) === normalized)
    return index >= 0 ? index : GRADE_OPTIONS.findIndex((grade) => grade === '6a')
  }, [value])

  const currentGrade = GRADE_OPTIONS[Math.max(0, currentIndex)]
  const canDecrease = currentIndex > 0
  const canIncrease = currentIndex < GRADE_OPTIONS.length - 1

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canDecrease}
          onPress={() => {
            if (!canDecrease) return
            onChange(GRADE_OPTIONS[currentIndex - 1])
          }}
          style={[styles.button, !canDecrease && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, !canDecrease && styles.buttonTextDisabled]}>-</Text>
        </TouchableOpacity>

        <View style={styles.valueBox}>
          <Text style={styles.valueText}>{toDisplayGrade(currentGrade)}</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={!canIncrease}
          onPress={() => {
            if (!canIncrease) return
            onChange(GRADE_OPTIONS[currentIndex + 1])
          }}
          style={[styles.button, !canIncrease && styles.buttonDisabled]}
        >
          <Text style={[styles.buttonText, !canIncrease && styles.buttonTextDisabled]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      width: '100%',
      marginBottom: 10,
    },
    label: {
      marginBottom: 6,
      fontSize: 13,
      fontWeight: '700',
      color: colors.grey,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    button: {
      width: 42,
      height: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.badgeBackground,
      borderColor: colors.cardBorderMuted,
    },
    buttonText: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primary,
      lineHeight: 24,
    },
    buttonTextDisabled: {
      color: colors.mutedText,
    },
    valueBox: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    valueText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.black,
    },
  })
