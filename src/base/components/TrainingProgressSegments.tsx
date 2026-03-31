import React, { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { LightColors } from '../constants/theme'

type TrainingProgressSegmentsProps = {
  totalSegments: number
  completedSegments: number
}

export default function TrainingProgressSegments({ totalSegments, completedSegments }: TrainingProgressSegmentsProps) {
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
    <View style={styles.container}>
      {segments.map((segment) => (
        <View key={segment.key} style={[styles.segment, segment.isCompleted ? styles.segmentCompleted : styles.segmentPending]} />
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
    height: 6,
    borderRadius: 999,
    marginHorizontal: 2,
  },
  segmentCompleted: {
    backgroundColor: LightColors.primary,
  },
  segmentPending: {
    backgroundColor: LightColors.lightGrey,
  },
})
