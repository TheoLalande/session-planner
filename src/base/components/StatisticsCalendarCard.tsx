import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import LoadingIndicator from './LoadingIndicator'
import { ExerciseType } from '../types/trainingTypes'

type CalendarCell = {
  day: number | null
  key: string
  blockTypes: ExerciseType[]
}

type Props = {
  mode: string
  colors: any
  monthTitle: string
  isLoading: boolean
  calendarCells: CalendarCell[]
  onPrevMonth: () => void
  onNextMonth: () => void
  getTypeColor: (type: ExerciseType) => string
}

export default function StatisticsCalendarCard({
  mode,
  colors,
  monthTitle,
  isLoading,
  calendarCells,
  onPrevMonth,
  onNextMonth,
  getTypeColor,
}: Props) {
  return (
    <View style={[styles.card, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.black }]}>Calendrier des blocs réalisés</Text>
        <View style={styles.monthActions}>
          <TouchableOpacity
            style={[styles.monthButton, { borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder, backgroundColor: colors.lightGrey }]}
            activeOpacity={0.75}
            onPress={onPrevMonth}
          >
            <Text style={[styles.monthButtonText, { color: colors.black }]}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.primary }]}>{monthTitle}</Text>
          <TouchableOpacity
            style={[styles.monthButton, { borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder, backgroundColor: colors.lightGrey }]}
            activeOpacity={0.75}
            onPress={onNextMonth}
          >
            <Text style={[styles.monthButtonText, { color: colors.black }]}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekDaysRow}>
        {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map((dayLabel, index) => (
          <Text key={`${dayLabel}-${index}`} style={[styles.weekDayText, { color: colors.grey }]}>
            {dayLabel}
          </Text>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <LoadingIndicator />
        </View>
      ) : (
        <View style={styles.grid}>
          {calendarCells.map((cell) => (
            <View
              key={cell.key}
              style={[
                styles.cellWrapper,
                {
                  backgroundColor: cell.day ? 'transparent' : colors.background,
                },
              ]}
            >
              <View
                style={[
                  styles.cell,
                  {
                    borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder,
                    backgroundColor: cell.day ? colors.white : colors.background,
                  },
                ]}
              >
                {cell.day ? (
                  <>
                    <Text style={[styles.dayNumber, { color: colors.black }]}>{cell.day}</Text>
                    <View style={styles.dotsRow}>
                      {cell.blockTypes.slice(0, 4).map((type) => (
                        <View key={`${cell.key}-${type}`} style={[styles.dot, { backgroundColor: getTypeColor(type) }]} />
                      ))}
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.typesLegend}>
        {(['warmup', 'climbing', 'stretching', 'cooldown', 'hangboard'] as ExerciseType[]).map((type) => (
          <View key={type} style={styles.typeLegendItem}>
            <View style={[styles.typeLegendDot, { backgroundColor: getTypeColor(type) }]} />
            <Text style={[styles.typeLegendText, { color: colors.grey }]}>{type}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  headerRow: {
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  weekDaysRow: {
    marginTop: 12,
    flexDirection: 'row',
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  loader: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  cellWrapper: {
    width: '14.2857%',
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  cell: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
    justifyContent: 'space-between',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    minHeight: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typesLegend: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typeLegendText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
})
