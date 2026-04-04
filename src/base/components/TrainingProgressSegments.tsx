import React, { useMemo } from 'react'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useAppTheme } from '../providers/themeProvider'

type TrainingProgressSegmentsProps = {
  totalSegments: number
  completedSegments: number
  style?: StyleProp<ViewStyle>
}

export default function TrainingProgressSegments({ totalSegments, completedSegments, style }: TrainingProgressSegmentsProps) {
  const { colors } = useAppTheme()
  const safeTotal = Math.max(0, Math.floor(totalSegments))
  const safeCompleted = Math.max(0, Math.min(Math.floor(completedSegments), safeTotal))

  const segments = useMemo(
    () => Array.from({ length: safeTotal }, (_, index) => ({ key: `segment-${index}`, isCompleted: index < safeCompleted })),
    [safeCompleted, safeTotal],
  )

  if (safeTotal === 0) {
    return null
  }

  return (
    <View style={[styles.container, style]}>
      {segments.map((segment) => (
        <View
          key={segment.key}
          style={[styles.segment, { backgroundColor: segment.isCompleted ? colors.primary : colors.lightGrey }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 999,
    marginHorizontal: 3,
  },
})
