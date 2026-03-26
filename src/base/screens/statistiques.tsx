import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Platform, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LightColors } from '../constants/theme'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'
import { useAppTheme } from '../providers/themeProvider'
import { CompletedSession, fetchCompletedSessions } from '../api/completedSessionsService'
import { ExerciseType } from '../types/trainingTypes'
import StatisticsHeader from '../components/StatisticsHeader'
import StatisticsDateRangeCard from '../components/StatisticsDateRangeCard'
import StatisticsCalendarCard from '../components/StatisticsCalendarCard'
import StatisticsClimbingChartsCard from '../components/StatisticsClimbingChartsCard'

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

const formatMonthTitle = (d: Date) =>
  d.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

const getMonthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const getMonthEnd = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0)
const toDayKey = (timestamp: number) => {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [isLoadingCompletedSessions, setIsLoadingCompletedSessions] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date())

  useEffect(() => {
    loadAttempts()
  }, [loadAttempts])

  useEffect(() => {
    let isMounted = true
    const loadCompletedSessions = async () => {
      try {
        setIsLoadingCompletedSessions(true)
        const data = await fetchCompletedSessions({
          startAt: toStartOfDay(startDate),
          endAt: toEndOfDay(endDate),
        })
        if (!isMounted) {
          return
        }
        setCompletedSessions(data)
      } finally {
        if (isMounted) {
          setIsLoadingCompletedSessions(false)
        }
      }
    }
    loadCompletedSessions()
    return () => {
      isMounted = false
    }
  }, [endDate, startDate])

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

  const monthStart = useMemo(() => getMonthStart(calendarMonth), [calendarMonth])
  const monthEnd = useMemo(() => getMonthEnd(calendarMonth), [calendarMonth])
  const firstWeekDay = useMemo(() => {
    const jsDay = monthStart.getDay()
    return jsDay === 0 ? 6 : jsDay - 1
  }, [monthStart])

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, Set<ExerciseType>>()
    completedSessions.forEach((session) => {
      const key = toDayKey(session.completedAt)
      const current = map.get(key) ?? new Set<ExerciseType>()
      session.blockTypes.forEach((type) => current.add(type))
      map.set(key, current)
    })
    return map
  }, [completedSessions])

  const calendarCells = useMemo(() => {
    const totalDays = monthEnd.getDate()
    const cells: Array<{ day: number | null; key: string; blockTypes: ExerciseType[] }> = []
    for (let i = 0; i < firstWeekDay; i += 1) {
      cells.push({ day: null, key: `empty-${i}`, blockTypes: [] })
    }
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
      const key = toDayKey(date.getTime())
      const dayTypes = Array.from(sessionsByDay.get(key) ?? [])
      cells.push({ day, key, blockTypes: dayTypes })
    }
    return cells
  }, [firstWeekDay, monthEnd, monthStart, sessionsByDay])

  const getTypeColor = (type: ExerciseType) => {
    if (type === 'warmup') return colors.warmup
    if (type === 'cooldown') return colors.cooldown
    if (type === 'stretching') return colors.stretching
    if (type === 'hangboard') return colors.hangboard
    return colors.climbing
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <StatisticsHeader titleColor={colors.primary} subtitleColor={colors.grey} />

        <StatisticsDateRangeCard
          mode={mode}
          colors={colors}
          startDateLabel={formatDate(startDate)}
          endDateLabel={formatDate(endDate)}
          onPressStartDate={() => setShowStartPicker(true)}
          onPressEndDate={() => setShowEndPicker(true)}
        />

        <StatisticsCalendarCard
          mode={mode}
          colors={colors}
          monthTitle={formatMonthTitle(calendarMonth)}
          isLoading={isLoadingCompletedSessions}
          calendarCells={calendarCells}
          onPrevMonth={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          onNextMonth={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          getTypeColor={getTypeColor}
        />

        <StatisticsClimbingChartsCard
          mode={mode}
          colors={colors}
          isLoadingAttempts={isLoadingAttempts}
          attemptsInRangeCount={attemptsInRange.length}
          gradeCounts={gradeCounts}
          hiddenGrades={hiddenGrades}
          onToggleGrade={(grade) => setHiddenGrades((prev) => ({ ...prev, [grade]: !prev[grade] }))}
          gradeData={gradeData}
          availableChartWidth={availableChartWidth}
          chartHeight={chartHeight}
          stackData={stackData}
          maxCount={maxCount}
          noOfSections={noOfSections}
          stepValue={stepValue}
          dailySuccessRate={dailySuccessRate}
        />
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
})
