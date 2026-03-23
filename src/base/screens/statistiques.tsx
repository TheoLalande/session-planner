import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { router } from 'expo-router'
import { BottomNavBar } from '../components'
import { LightColors } from '../constants/theme'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'
import { BarChart, LineChart } from 'react-native-gifted-charts'

const extractGradeFromRouteLabel = (routeLabel: string) => {
  const parts = routeLabel.split(' · ')
  return (parts[parts.length - 1] ?? '').trim()
}

const normalizeGradeLabel = (grade: string) => {
  let g = grade.trim().replace(/\s+/g, '').toLowerCase()
  const mMidPlus = g.match(/^(\d+)\+([abc])$/)
  if (mMidPlus) {
    const [, num, letter] = mMidPlus
    g = `${num}${letter}+`
  }
  return g
}

const gradeSortKey = (grade: string) => {
  const m = grade.match(/^(\d+)([abc])(\+)?$/)
  if (!m) {
    return Number.POSITIVE_INFINITY
  }
  const [, num, letter, plus] = m
  const numN = Number(num)
  const letterIndex = letter === 'a' ? 0 : letter === 'b' ? 1 : 2
  const plusIndex = plus ? 1 : 0
  return numN * 100 + letterIndex * 2 + plusIndex
}

function StatusLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  )
}

const toStartOfDay = (d: Date) => {
  const next = new Date(d)
  next.setHours(0, 0, 0, 0)
  return next.getTime()
}

const toEndOfDay = (d: Date) => {
  const next = new Date(d)
  next.setHours(23, 59, 59, 999)
  return next.getTime()
}

const formatDate = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function Statistiques() {
  const attempts = useClimbingAttemptsStore((state) => state.attempts)
  const isLoadingAttempts = useClimbingAttemptsStore((state) => state.isLoadingAttempts)
  const loadAttempts = useClimbingAttemptsStore((state) => state.loadAttempts)
  const { width: windowWidth } = useWindowDimensions()
  const [hiddenGrades, setHiddenGrades] = useState<Record<string, boolean>>({ '5c': true })

  const [startDate, setStartDate] = useState<Date>(() => {
    const next = new Date()
    next.setDate(next.getDate() - 7)
    return next
  })
  const [endDate, setEndDate] = useState<Date>(() => new Date())

  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  useEffect(() => {
    loadAttempts()
  }, [loadAttempts])

  const attemptsInRange = useMemo(() => {
    const start = toStartOfDay(startDate)
    const end = toEndOfDay(endDate)
    return attempts.filter((a) => a.createdAt >= start && a.createdAt <= end)
  }, [attempts, startDate, endDate])

  const gradeCounts = useMemo(() => {
    const map = new Map<
      string,
      {
        grade: string
        success: number
        fail: number
      }
    >()

    for (const attempt of attemptsInRange) {
      const rawGrade = extractGradeFromRouteLabel(attempt.routeLabel)
      const grade = normalizeGradeLabel(rawGrade)
      if (!grade) continue

      const current = map.get(grade) ?? { grade, success: 0, fail: 0 }
      if (attempt.status === 'success') current.success += 1
      if (attempt.status === 'fail') current.fail += 1
      map.set(grade, current)
    }

    const presentGrades = Array.from(map.keys())
    const gradesToDisplay = [...presentGrades].sort((a, b) => gradeSortKey(a) - gradeSortKey(b))

    return { map, gradesToDisplay }
  }, [attemptsInRange])

  const gradeData = useMemo(() => {
    return gradeCounts.gradesToDisplay
      .filter((grade) => !hiddenGrades[grade])
      .map((grade) => {
        const current = gradeCounts.map.get(grade)
        return {
          grade,
          success: current?.success ?? 0,
          fail: current?.fail ?? 0,
        }
      })
  }, [gradeCounts, hiddenGrades])

  const visibleGradesSet = useMemo(() => new Set(gradeData.map((d) => d.grade)), [gradeData])

  const dailySuccessRate = useMemo(() => {
    if (attemptsInRange.length === 0 || visibleGradesSet.size === 0) {
      return []
    }

    const map = new Map<number, { success: number; fail: number }>()

    for (const attempt of attemptsInRange) {
      const rawGrade = extractGradeFromRouteLabel(attempt.routeLabel)
      const grade = normalizeGradeLabel(rawGrade)
      if (!visibleGradesSet.has(grade)) continue

      const dayKey = toStartOfDay(new Date(attempt.createdAt))
      const current = map.get(dayKey) ?? { success: 0, fail: 0 }
      if (attempt.status === 'success') current.success += 1
      if (attempt.status === 'fail') current.fail += 1
      map.set(dayKey, current)
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayKey, counts]) => {
        const total = counts.success + counts.fail
        const rate = total > 0 ? (counts.success / total) * 100 : 0
        const d = new Date(dayKey)
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
        return { value: Math.round(rate * 10) / 10, label }
      })
  }, [attemptsInRange, visibleGradesSet])

  const maxCount = useMemo(() => {
    const values = gradeData.flatMap((d) => [d.success, d.fail])
    return Math.max(1, ...values)
  }, [gradeData])

  const availableChartWidth = useMemo(() => {
    // main a `paddingHorizontal: 30`, donc on retire 60 à la largeur de l'écran
    return Math.max(240, Math.floor(windowWidth - 60))
  }, [windowWidth])

  const stackData = useMemo(() => {
    const smallGap = 4
    const bigGap = 14

    return gradeData.flatMap((d) => {
      const hasSuccess = d.success > 0
      const hasFail = d.fail > 0

      if (!hasSuccess && !hasFail) {
        return []
      }

      const items: Array<{
        label: string
        spacing?: number
        stacks: Array<{ value: number; color: string }>
      }> = []

      if (hasSuccess) {
        items.push({
          label: d.grade,
          spacing: hasFail ? smallGap : bigGap,
          stacks: [{ value: d.success, color: LightColors.primary }],
        })
      }

      if (hasFail) {
        items.push({
          label: hasSuccess ? '' : d.grade,
          spacing: bigGap,
          stacks: [{ value: d.fail, color: '#ff3b30' }],
        })
      }

      return items
    })
  }, [gradeData])

  const noOfSections = 4
  const stepValue = Math.ceil(maxCount / noOfSections)

  const chartHeight = 260

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.main}>
        <Text style={styles.title}>statistique</Text>

        <View style={styles.dateRangeRow}>
          <TouchableOpacity activeOpacity={0.7} style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateLabel}>Du</Text>
            <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.7} style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateLabel}>Au</Text>
            <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.legendRow}>
          <StatusLegendItem color={LightColors.primary} label="Succès" />
          <StatusLegendItem color="#ff3b30" label="Échecs" />
        </View>

        {isLoadingAttempts ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Chargement...</Text>
          </View>
        ) : attemptsInRange.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Aucune voie testée sur cette période.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.filtersSection}>
              <Text style={styles.filtersTitle}>Cotation</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersScroll}
                keyboardShouldPersistTaps="handled"
              >
                {gradeCounts.gradesToDisplay.map((grade) => {
                  const counts = gradeCounts.map.get(grade)
                  const total = (counts?.success ?? 0) + (counts?.fail ?? 0)
                  const isHidden = !!hiddenGrades[grade]

                  return (
                    <TouchableOpacity
                      key={grade}
                      activeOpacity={0.7}
                      onPress={() => setHiddenGrades((prev) => ({ ...prev, [grade]: !prev[grade] }))}
                      style={[styles.gradeChip, isHidden ? styles.gradeChipHidden : styles.gradeChipVisible]}
                    >
                      <Text style={[styles.gradeChipText, isHidden ? styles.gradeChipTextHidden : styles.gradeChipTextVisible]}>
                        {grade} ({total})
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            {gradeData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Aucune cotation sélectionnée.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.chartScrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.chartContainer}>
                  <BarChart
                    width={availableChartWidth}
                    height={chartHeight}
                    stackData={stackData}
                    maxValue={maxCount}
                    noOfSections={noOfSections}
                    stepValue={stepValue}
                    adjustToWidth
                    parentWidth={availableChartWidth}
                    disableScroll
                    rotateLabel
                    xAxisLabelsAtBottom
                    yAxisTextStyle={styles.yAxisTextStyle}
                    xAxisTextNumberOfLines={2}
                  />

                  <Text style={styles.lineChartTitle}>Taux de réussite (par jour)</Text>

                  {dailySuccessRate.length === 0 ? (
                    <View style={styles.lineChartEmptyBox}>
                      <Text style={styles.emptyText}>Pas assez de données pour la courbe.</Text>
                    </View>
                  ) : (
                    <View style={styles.lineChartContainer}>
                      {(() => {
                        const xAxisLabelTexts = dailySuccessRate.map((d) => d.label)
                        const data = dailySuccessRate.map((d) => ({ value: d.value }))
                        return (
                          <LineChart
                            height={220}
                            data={data}
                            xAxisLabelTexts={xAxisLabelTexts}
                            maxValue={100}
                            noOfSections={4}
                            stepValue={25}
                            adjustToWidth
                            parentWidth={availableChartWidth}
                            rotateLabel
                            xAxisLabelsAtBottom
                            color={LightColors.primary}
                            thickness={2}
                            dataPointsRadius={4}
                            dataPointsColor={LightColors.primary}
                            lineGradient={false}
                            xAxisTextNumberOfLines={2}
                            yAxisTextStyle={styles.yAxisTextStyle}
                            disableScroll
                          />
                        )
                      })()}
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {showStartPicker ? (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={endDate}
          onChange={(_, date) => {
            if (!date) return
            setShowStartPicker(false)
            setStartDate(date)
            setEndDate((prevEnd) => (prevEnd.getTime() < date.getTime() ? date : prevEnd))
          }}
        />
      ) : null}

      {showEndPicker ? (
        <DateTimePicker
          value={endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(_, date) => {
            if (!date) return
            setShowEndPicker(false)
            setEndDate(date)
            setStartDate((prevStart) => (prevStart.getTime() > date.getTime() ? date : prevStart))
          }}
        />
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 50,
    fontWeight: '700',
    color: LightColors.primary,
    textAlign: 'center',
  },
  main: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  dateRangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: LightColors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: LightColors.white,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: LightColors.primary,
  },
  dateValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: LightColors.black,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: LightColors.black,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: LightColors.grey,
    fontSize: 14,
    fontWeight: '600',
  },
  chartScrollContent: {
    paddingBottom: 20,
  },
  filtersSection: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: LightColors.black,
    marginBottom: 10,
  },
  filtersScroll: {
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 10,
  },
  gradeChip: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  gradeChipVisible: {
    backgroundColor: LightColors.primary,
    borderColor: LightColors.primary,
  },
  gradeChipHidden: {
    backgroundColor: LightColors.white,
    borderColor: LightColors.lightGrey,
  },
  gradeChipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  gradeChipTextVisible: {
    color: LightColors.white,
  },
  gradeChipTextHidden: {
    color: LightColors.grey,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  lineChartTitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
    color: LightColors.black,
    alignSelf: 'flex-start',
  },
  lineChartContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
  },
  lineChartEmptyBox: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  chartHorizontalScroll: {
    paddingBottom: 10,
  },
  yAxisTextStyle: {
    fontSize: 12,
    fontWeight: '700',
    color: LightColors.grey,
  },
  graphRow: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'flex-start',
  },
  yAxis: {
    width: 44,
    alignItems: 'flex-end',
    paddingRight: 8,
    justifyContent: 'space-between',
  },
  yTickText: {
    fontSize: 12,
    fontWeight: '700',
    color: LightColors.grey,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  xAxisLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: LightColors.grey,
    opacity: 0.4,
  },
  barsRow: {
    alignItems: 'flex-end',
    gap: 18,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  gradeColumn: {
    width: 62,
    alignItems: 'center',
  },
  barArea: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'flex-end',
  },
  barCol: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 16,
    borderRadius: 8,
  },
  gradeLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: LightColors.black,
    textAlign: 'center',
  },
})
