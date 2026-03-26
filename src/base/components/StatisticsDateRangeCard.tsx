import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  mode: string
  colors: any
  startDateLabel: string
  endDateLabel: string
  onPressStartDate: () => void
  onPressEndDate: () => void
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  )
}

export default function StatisticsDateRangeCard({ mode, colors, startDateLabel, endDateLabel, onPressStartDate, onPressEndDate }: Props) {
  return (
    <View style={[styles.topCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
      <View style={styles.dateRangeRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.dateButton, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}
          onPress={onPressStartDate}
        >
          <Text style={[styles.dateLabel, { color: colors.primary }]}>Du</Text>
          <Text style={[styles.dateValue, { color: colors.black }]}>{startDateLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.dateButton, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}
          onPress={onPressEndDate}
        >
          <Text style={[styles.dateLabel, { color: colors.primary }]}>Au</Text>
          <Text style={[styles.dateValue, { color: colors.black }]}>{endDateLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  topCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  legendItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
})
