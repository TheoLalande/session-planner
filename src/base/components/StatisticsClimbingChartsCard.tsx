import React from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BarChart, LineChart } from 'react-native-gifted-charts'
import LoadingIndicator from './LoadingIndicator'

type GradeCountMap = Map<
  string,
  {
    grade: string
    success: number
    fail: number
  }
>

type Props = {
  mode: string
  colors: any
  isLoadingAttempts: boolean
  attemptsInRangeCount: number
  gradeCounts: {
    map: GradeCountMap
    gradesToDisplay: string[]
  }
  hiddenGrades: Record<string, boolean>
  onToggleGrade: (grade: string) => void
  gradeData: Array<{ grade: string; success: number; fail: number }>
  availableChartWidth: number
  chartHeight: number
  stackData: Array<{ label: string; spacing?: number; stacks: Array<{ value: number; color: string }> }>
  maxCount: number
  noOfSections: number
  stepValue: number
  dailySuccessRate: Array<{ value: number; label: string }>
  dailyAverageGrades: Array<{ value: number; label: string; gradeLabel: string }>
}

export default function StatisticsClimbingChartsCard({
  mode,
  colors,
  isLoadingAttempts,
  attemptsInRangeCount,
  gradeCounts,
  hiddenGrades,
  onToggleGrade,
  gradeData,
  availableChartWidth,
  chartHeight,
  stackData,
  maxCount,
  noOfSections,
  stepValue,
  dailySuccessRate,
  dailyAverageGrades,
}: Props) {
  if (isLoadingAttempts) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
        <LoadingIndicator />
      </View>
    )
  }

  if (attemptsInRangeCount === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
        <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune voie testée sur cette période.</Text>
      </View>
    )
  }

  const buildSparseLabels = (labels: string[]) => {
    if (labels.length <= 6) {
      return labels
    }
    const step = Math.ceil(labels.length / 6)
    return labels.map((label, index) => (index % step === 0 || index === labels.length - 1 ? label : ''))
  }

  const successRateLabels = buildSparseLabels(dailySuccessRate.map((d) => d.label))
  const averageGradeLabels = buildSparseLabels(dailyAverageGrades.map((d) => d.label))

  return (
    <>
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
                  onPress={() => onToggleGrade(grade)}
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
      </View>

      {gradeData.length === 0 ? (
        <View style={[styles.contentCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
          <View style={styles.emptyBox}>
            <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune cotation sélectionnée.</Text>
          </View>
        </View>
      ) : (
        <>
          <View style={[styles.contentCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <Text style={[styles.lineChartTitle, { color: colors.black }]}>Succès / Échecs par cotation</Text>
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
            </View>
          </View>

          <View style={[styles.contentCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <Text style={[styles.lineChartTitle, { color: colors.black }]}>Taux de réussite (par jour)</Text>
            {dailySuccessRate.length === 0 ? (
              <View style={styles.lineChartEmptyBox}>
                <Text style={[styles.emptyText, { color: colors.grey }]}>Pas assez de données pour la courbe.</Text>
              </View>
            ) : (
              <View style={styles.lineChartContainer}>
                <LineChart
                  height={220}
                  data={dailySuccessRate.map((d) => ({ value: d.value }))}
                  xAxisLabelTexts={successRateLabels}
                  maxValue={100}
                  noOfSections={4}
                  stepValue={25}
                  adjustToWidth
                  parentWidth={availableChartWidth}
                  rotateLabel={false}
                  xAxisLabelsAtBottom
                  initialSpacing={14}
                  endSpacing={26}
                  labelsExtraHeight={12}
                  color={colors.primary}
                  thickness={2}
                  dataPointsRadius={4}
                  dataPointsColor={colors.primary}
                  lineGradient={false}
                  xAxisTextNumberOfLines={1}
                  xAxisLabelTextStyle={[styles.xAxisLabelText, { color: colors.grey }]}
                  yAxisTextStyle={[styles.yAxisTextStyle, { color: colors.grey }]}
                  disableScroll
                />
              </View>
            )}
          </View>

          <View style={[styles.contentCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <Text style={[styles.lineChartTitle, { color: colors.black }]}>Cotation moyenne (par jour)</Text>
            {dailyAverageGrades.length === 0 ? (
              <View style={styles.lineChartEmptyBox}>
                <Text style={[styles.emptyText, { color: colors.grey }]}>Pas assez de données pour calculer la moyenne.</Text>
              </View>
            ) : (
              <View style={styles.lineChartContainer}>
                <BarChart
                  width={availableChartWidth}
                  height={220}
                  data={dailyAverageGrades.map((d, index) => ({
                    value: d.value,
                    label: averageGradeLabels[index] ?? '',
                    frontColor: colors.secondary,
                    topLabelComponent: () => <Text style={[styles.avgGradeLabel, { color: colors.black }]}>{d.gradeLabel}</Text>,
                  }))}
                  maxValue={14}
                  noOfSections={7}
                  stepValue={2}
                  adjustToWidth
                  parentWidth={availableChartWidth}
                  disableScroll
                  rotateLabel={false}
                  xAxisLabelsAtBottom
                  barWidth={14}
                  spacing={10}
                  initialSpacing={14}
                  endSpacing={26}
                  labelsExtraHeight={12}
                  yAxisTextStyle={[styles.yAxisTextStyle, { color: colors.grey }]}
                  xAxisTextNumberOfLines={1}
                  xAxisLabelTextStyle={[styles.xAxisLabelText, { color: colors.grey }]}
                />
              </View>
            )}
          </View>
        </>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  contentCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  emptyCard: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
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
    fontSize: 14,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 8,
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
  yAxisTextStyle: {
    fontSize: 12,
    fontWeight: '700',
  },
  xAxisLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  avgGradeLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
})
