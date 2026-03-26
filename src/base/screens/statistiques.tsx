import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LightColors } from '../constants/theme'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'
import { BarChart, LineChart } from 'react-native-gifted-charts'
import LoadingIndicator from '../components/LoadingIndicator'
import { useAppTheme } from '../providers/themeProvider'

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
  const { mode, colors } = useAppTheme()
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
          stacks: [{ value: d.fail, color: LightColors.danger }],
        })
      }

      return items
    })
  }, [gradeData])

  const noOfSections = 4
  const stepValue = Math.ceil(maxCount / noOfSections)

  const chartHeight = 260

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={[styles.title, { color: colors.primary }]}>Statistiques</Text>
          <Text style={[styles.subtitle, { color: colors.grey }]}>Analyse tes tentatives de grimpe sur la période choisie.</Text>
        </View>

        <View style={[styles.topCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
          <View style={styles.dateRangeRow}>
            <TouchableOpacity activeOpacity={0.7} style={[styles.dateButton, { backgroundColor: colors.lightGrey, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]} onPress={() => setShowStartPicker(true)}>
              <Text style={[styles.dateLabel, { color: colors.primary }]}>Du</Text>
              <Text style={[styles.dateValue, { color: colors.black }]}>{formatDate(startDate)}</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7} style={[styles.dateButton, { backgroundColor: colors.lightGrey, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]} onPress={() => setShowEndPicker(true)}>
              <Text style={[styles.dateLabel, { color: colors.primary }]}>Au</Text>
              <Text style={[styles.dateValue, { color: colors.black }]}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            <StatusLegendItem color={colors.primary} label="Succès" />
            <StatusLegendItem color={colors.danger} label="Échecs" />
          </View>
        </View>

        {isLoadingAttempts ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <LoadingIndicator />
          </View>
        ) : attemptsInRange.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune voie testée sur cette période.</Text>
          </View>
        ) : (
          <View style={[styles.contentCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <View style={styles.filtersSection}>
              <Text style={[styles.filtersTitle, { color: colors.black }]}>Cotation</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll} keyboardShouldPersistTaps="handled">
                {gradeCounts.gradesToDisplay.map((grade) => {
                  const counts = gradeCounts.map.get(grade)
                  const total = (counts?.success ?? 0) + (counts?.fail ?? 0)
                  const isHidden = !!hiddenGrades[grade]

                  return (
                    <TouchableOpacity
                      key={grade}
                      activeOpacity={0.7}
                      onPress={() => setHiddenGrades((prev) => ({ ...prev, [grade]: !prev[grade] }))}
                      style={[
                        styles.gradeChip,
                        {
                          backgroundColor: isHidden ? colors.white : colors.primary,
                          borderColor: isHidden ? (mode === 'dark' ? colors.darkBorder : colors.cardBorder) : colors.primary,
                        },
                      ]}
                    >
                      <Text style={[styles.gradeChipText, { color: isHidden ? colors.grey : colors.white }]}>
                        {grade} ({total})
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>

            {gradeData.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune cotation sélectionnée.</Text>
              </View>
            ) : (
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
                  yAxisTextStyle={[styles.yAxisTextStyle, { color: colors.grey }]}
                  xAxisTextNumberOfLines={2}
                />

                <Text style={[styles.lineChartTitle, { color: colors.black }]}>Taux de réussite (par jour)</Text>

                {dailySuccessRate.length === 0 ? (
                  <View style={styles.lineChartEmptyBox}>
                    <Text style={[styles.emptyText, { color: colors.grey }]}>Pas assez de données pour la courbe.</Text>
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
                          color={colors.primary}
                          thickness={2}
                          dataPointsRadius={4}
                          dataPointsColor={colors.primary}
                          lineGradient={false}
                          xAxisTextNumberOfLines={2}
                          yAxisTextStyle={[styles.yAxisTextStyle, { color: colors.grey }]}
                          disableScroll
                        />
                      )
                    })()}
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '400',
  },
  headerBlock: {
    marginBottom: 12,
  },
  topCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  contentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  emptyCard: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
  emptyBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersSection: {
    marginBottom: 10,
  },
  filtersTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  filtersScroll: {
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 8,
  },
  gradeChip: {
    borderRadius: 9999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  lineChartTitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '700',
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
  },
})
