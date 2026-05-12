import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View, Text, TouchableOpacity } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { useRouter } from 'expo-router'
import DateTimePicker, { DateTimePickerAndroid } from '../components/AppDatePicker'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'
import { useAppTheme } from '../providers/themeProvider'
import { CompletedSession, fetchCompletedSessions } from '../api/completedSessionsService'
import { ExerciseType, TrainingExercise } from '../types/trainingTypes'
import StatisticsHeader from '../components/StatisticsHeader'
import StatisticsDateRangeCard from '../components/StatisticsDateRangeCard'
import StatisticsCalendarCard from '../components/StatisticsCalendarCard'
import StatisticsClimbingChartsCard from '../components/StatisticsClimbingChartsCard'
import { getSupabaseDb } from '../api/supabaseClient'
import { getSession } from '../api/authService'

const extractGradeFromRouteLabel = (routeLabel: string) => {
  const parts = routeLabel.split(' · ')
  return (parts[parts.length - 1] ?? '').trim()
}

const extractGradeFromAttempt = (attempt: { grade?: string; routeLabel: string }) => {
  if (attempt.grade && attempt.grade.trim().length > 0) {
    return attempt.grade
  }
  return extractGradeFromRouteLabel(attempt.routeLabel)
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
const GRADE_SCALE = ['5c', '5c+', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7a+', '7b', '7b+', '7c', '7c+', '8a'] as const
const toDayKey = (timestamp: number) => {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const gradeToScore = (grade: string) => GRADE_SCALE.findIndex((value) => value === grade)

const scoreToGrade = (score: number) => {
  const rounded = Math.round(score)
  const clamped = Math.max(0, Math.min(GRADE_SCALE.length - 1, rounded))
  return GRADE_SCALE[clamped]
}

const toShortDate = (timestamp: number) => {
  const d = new Date(timestamp)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

const getExerciseDisplayName = (exercise: TrainingExercise) => {
  if (exercise.type === 'warmup' || exercise.type === 'renforcement' || exercise.type === 'strength' || exercise.type === 'stretching' || exercise.type === 'gainage') {
    return (exercise.data.exerciceType || exercise.data.title || '').trim() || 'Exercice'
  }
  if (exercise.type === 'hangboard' || exercise.type === 'climbing') {
    return (exercise.data.title || '').trim() || 'Exercice'
  }
  return 'Exercice'
}

const getExerciseTimingSeconds = (exercise: TrainingExercise) => {
  if (exercise.type === 'warmup' || exercise.type === 'renforcement' || exercise.type === 'strength' || exercise.type === 'stretching' || exercise.type === 'gainage') {
    if (exercise.data.mode !== 'time') {
      return null
    }
    const rawDuration = typeof exercise.data.duration === 'number' ? exercise.data.duration : 0
    const unit = exercise.data.durationUnit === 'minutes' ? 'minutes' : 'seconds'
    return Math.max(0, unit === 'minutes' ? rawDuration * 60 : rawDuration)
  }
  if (exercise.type === 'hangboard') {
    return Math.max(0, Number(exercise.data.holdTime ?? 0))
  }
  if (exercise.type === 'climbing') {
    return Math.max(0, Number(exercise.data.restingTime ?? 0))
  }
  return null
}

type StatsTab = 'practice' | 'climbing' | 'calendar'

type StoredTrainingBlockRow = {
  id: string
  plan_id: string
  position: number
}

type StoredTrainingExerciseRow = {
  block_id: string
  exercise_type: string
  title: string | null
  position: number
  exercise_library_id: string | null
  payload_json: unknown
}

const getStoredExerciseDisplayName = (exerciseType: string, title: string | null, payload: Record<string, unknown>) => {
  const payloadTitle = String(payload.title ?? '')
  const payloadExerciseType = String(payload.exerciceType ?? '')
  if (exerciseType === 'warmup' || exerciseType === 'renforcement' || exerciseType === 'strength' || exerciseType === 'stretching' || exerciseType === 'gainage') {
    return (title || payloadExerciseType || payloadTitle || '').trim() || 'Exercice'
  }
  return (title || payloadTitle || '').trim() || 'Exercice'
}

const getStoredExerciseTimingSeconds = (exerciseType: string, payload: Record<string, unknown>) => {
  if (exerciseType === 'warmup' || exerciseType === 'renforcement' || exerciseType === 'strength' || exerciseType === 'stretching' || exerciseType === 'gainage') {
    const mode = String(payload.mode ?? 'time')
    if (mode !== 'time') {
      return null
    }
    const rawDuration = typeof payload.duration === 'number' ? payload.duration : Number(payload.duration ?? 0)
    const unit = String(payload.durationUnit ?? 'seconds') === 'minutes' ? 'minutes' : 'seconds'
    const safeDuration = Number.isFinite(rawDuration) ? rawDuration : 0
    return Math.max(0, unit === 'minutes' ? safeDuration * 60 : safeDuration)
  }
  if (exerciseType === 'hangboard') {
    const value = Number(payload.holdTime ?? 0)
    return Math.max(0, Number.isFinite(value) ? value : 0)
  }
  if (exerciseType === 'climbing') {
    const value = Number(payload.restingTime ?? 0)
    return Math.max(0, Number.isFinite(value) ? value : 0)
  }
  return null
}

export default function Statistiques() {
  const { mode, colors } = useAppTheme()
  const router = useRouter()
  const attempts = useClimbingAttemptsStore((state) => state.attempts)
  const isLoadingAttempts = useClimbingAttemptsStore((state) => state.isLoadingAttempts)
  const loadAttempts = useClimbingAttemptsStore((state) => state.loadAttempts)
  const { width: windowWidth } = useWindowDimensions()
  const [hiddenGrades, setHiddenGrades] = useState<Record<string, boolean>>({ '5c': true })
  const [activeTab, setActiveTab] = useState<StatsTab>('practice')

  const [startDate, setStartDate] = useState<Date>(() => {
    const next = new Date()
    next.setFullYear(next.getFullYear() - 1)
    return next
  })
  const [endDate, setEndDate] = useState<Date>(() => new Date())

  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [isLoadingCompletedSessions, setIsLoadingCompletedSessions] = useState(false)
  const [isLoadingPracticeData, setIsLoadingPracticeData] = useState(false)
  const [exerciseTimingEventsFromDb, setExerciseTimingEventsFromDb] = useState<
    Array<{ libraryExerciseId: string; title: string; completedAt: number; valueSeconds: number }>
  >([])
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date())
  const [selectedExerciseLibraryId, setSelectedExerciseLibraryId] = useState<string | null>(null)

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

  useEffect(() => {
    let isMounted = true
    const loadPracticeData = async () => {
      if (completedSessions.length === 0) {
        setExerciseTimingEventsFromDb([])
        return
      }
      try {
        setIsLoadingPracticeData(true)
        const session = await getSession()
        const userId = session.user?.id
        if (!userId) {
          if (isMounted) {
            setExerciseTimingEventsFromDb([])
          }
          return
        }
        const trainingIds = Array.from(new Set(completedSessions.map((item) => item.trainingId)))
        const db = getSupabaseDb()
        const { data: blocksData, error: blocksError } = await db
          .from('training_plan_blocks')
          .select('id,plan_id,position')
          .eq('user_id', userId)
          .in('plan_id', trainingIds)
          .order('position', { ascending: true })
        if (blocksError) {
          throw new Error(blocksError.message)
        }
        const blocks = (blocksData ?? []) as StoredTrainingBlockRow[]
        const blockIds = blocks.map((item) => item.id)
        if (blockIds.length === 0) {
          if (isMounted) {
            setExerciseTimingEventsFromDb([])
          }
          return
        }
        const { data: exercisesData, error: exercisesError } = await db
          .from('training_plan_exercises')
          .select('block_id,exercise_type,title,position,exercise_library_id,payload_json')
          .eq('user_id', userId)
          .in('block_id', blockIds)
          .order('position', { ascending: true })
        if (exercisesError) {
          throw new Error(exercisesError.message)
        }
        const exercises = (exercisesData ?? []) as StoredTrainingExerciseRow[]
        const blockById = new Map<string, StoredTrainingBlockRow>()
        blocks.forEach((item) => blockById.set(item.id, item))
        const exercisesByTrainingId = new Map<
          string,
          Array<{
            exercise_type: string
            title: string | null
            exercise_library_id: string | null
            payload_json: unknown
            blockPosition: number
            exercisePosition: number
          }>
        >()
        exercises.forEach((exercise) => {
          const block = blockById.get(exercise.block_id)
          if (!block) {
            return
          }
          const current = exercisesByTrainingId.get(block.plan_id) ?? []
          current.push({
            exercise_type: exercise.exercise_type,
            title: exercise.title,
            exercise_library_id: exercise.exercise_library_id,
            payload_json: exercise.payload_json,
            blockPosition: block.position,
            exercisePosition: exercise.position,
          })
          exercisesByTrainingId.set(block.plan_id, current)
        })
        const events: Array<{ libraryExerciseId: string; title: string; completedAt: number; valueSeconds: number }> = []
        completedSessions.forEach((completed) => {
          const trainingExercises = exercisesByTrainingId.get(completed.trainingId) ?? []
          trainingExercises
            .sort((a, b) => (a.blockPosition === b.blockPosition ? a.exercisePosition - b.exercisePosition : a.blockPosition - b.blockPosition))
            .forEach((exercise) => {
              const libId = String(exercise.exercise_library_id ?? '').trim()
              if (!libId) {
                return
              }
              const payload =
                exercise.payload_json && typeof exercise.payload_json === 'object' ? (exercise.payload_json as Record<string, unknown>) : {}
              const valueSeconds = getStoredExerciseTimingSeconds(exercise.exercise_type, payload)
              if (valueSeconds == null) {
                return
              }
              events.push({
                libraryExerciseId: libId,
                title: getStoredExerciseDisplayName(exercise.exercise_type, exercise.title, payload),
                completedAt: completed.completedAt,
                valueSeconds,
              })
            })
        })
        if (isMounted) {
          setExerciseTimingEventsFromDb(events.sort((a, b) => a.completedAt - b.completedAt))
        }
      } catch {
        if (isMounted) {
          setExerciseTimingEventsFromDb([])
        }
      } finally {
        if (isMounted) {
          setIsLoadingPracticeData(false)
        }
      }
    }
    void loadPracticeData()
    return () => {
      isMounted = false
    }
  }, [completedSessions])

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
      const rawGrade = extractGradeFromAttempt(attempt)
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
      const rawGrade = extractGradeFromAttempt(attempt)
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
    return Math.max(220, Math.floor(windowWidth - 76))
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
          stacks: [{ value: d.success, color: colors.primary }],
        })
      }

      if (hasFail) {
        items.push({
          label: hasSuccess ? '' : d.grade,
          spacing: bigGap,
          stacks: [{ value: d.fail, color: colors.danger }],
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
    const rangeStart = toStartOfDay(startDate)
    const rangeEnd = toEndOfDay(endDate)
    attempts.forEach((attempt) => {
      if (attempt.createdAt < rangeStart || attempt.createdAt > rangeEnd) return
      const key = toDayKey(attempt.createdAt)
      const current = map.get(key) ?? new Set<ExerciseType>()
      current.add('climbing')
      map.set(key, current)
    })
    return map
  }, [attempts, completedSessions, endDate, startDate])

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
    if (type === 'renforcement') return colors.renforcement
    if (type === 'strength') return colors.strength
    if (type === 'gainage') return colors.gainage
    if (type === 'stretching') return colors.stretching
    if (type === 'hangboard') return colors.hangboard
    return colors.climbing
  }

  const dailyAverageGrades = useMemo(() => {
    const byDay = new Map<number, number[]>()

    attemptsInRange.forEach((attempt) => {
      const rawGrade = extractGradeFromAttempt(attempt)
      const grade = normalizeGradeLabel(rawGrade)
      const score = gradeToScore(grade)
      if (score < 0) {
        return
      }
      const dayKey = toStartOfDay(new Date(attempt.createdAt))
      const current = byDay.get(dayKey) ?? []
      current.push(score)
      byDay.set(dayKey, current)
    })

    return Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayKey, scores]) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        const d = new Date(dayKey)
        const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
        return {
          value: Math.round(avgScore * 10) / 10,
          label,
          gradeLabel: scoreToGrade(avgScore),
        }
      })
  }, [attemptsInRange])

  const dailyAverageSuccessGrades = useMemo(() => {
    const byDay = new Map<number, number[]>()

    attemptsInRange.forEach((attempt) => {
      if (attempt.status !== 'success') {
        return
      }
      const rawGrade = extractGradeFromAttempt(attempt)
      const grade = normalizeGradeLabel(rawGrade)
      const score = gradeToScore(grade)
      if (score < 0) {
        return
      }
      const dayKey = toStartOfDay(new Date(attempt.createdAt))
      const current = byDay.get(dayKey) ?? []
      current.push(score)
      byDay.set(dayKey, current)
    })

    return Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayKey, scores]) => {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
        return {
          value: Math.round(avgScore * 10) / 10,
          gradeLabel: scoreToGrade(avgScore),
          timestamp: dayKey,
        }
      })
  }, [attemptsInRange])

  const exerciseTimingEvents = useMemo(() => exerciseTimingEventsFromDb, [exerciseTimingEventsFromDb])

  const exerciseGroups = useMemo(() => {
    const byExercise = new Map<
      string,
      {
        libraryExerciseId: string
        title: string
        entries: Array<{ completedAt: number; valueSeconds: number }>
      }
    >()

    exerciseTimingEvents.forEach((event) => {
      const current = byExercise.get(event.libraryExerciseId) ?? {
        libraryExerciseId: event.libraryExerciseId,
        title: event.title,
        entries: [],
      }
      current.entries.push({ completedAt: event.completedAt, valueSeconds: event.valueSeconds })
      if (event.title.length > 0) {
        current.title = event.title
      }
      byExercise.set(event.libraryExerciseId, current)
    })

    return Array.from(byExercise.values())
      .map((group) => ({
        ...group,
        entries: group.entries.sort((a, b) => a.completedAt - b.completedAt),
      }))
      .sort((a, b) => b.entries.length - a.entries.length)
  }, [exerciseTimingEvents])

  useEffect(() => {
    if (exerciseGroups.length === 0) {
      setSelectedExerciseLibraryId(null)
      return
    }
    if (!selectedExerciseLibraryId || !exerciseGroups.some((group) => group.libraryExerciseId === selectedExerciseLibraryId)) {
      setSelectedExerciseLibraryId(exerciseGroups[0].libraryExerciseId)
    }
  }, [exerciseGroups, selectedExerciseLibraryId])

  const selectedExerciseGroup = useMemo(() => {
    if (!selectedExerciseLibraryId) {
      return null
    }
    return exerciseGroups.find((group) => group.libraryExerciseId === selectedExerciseLibraryId) ?? null
  }, [exerciseGroups, selectedExerciseLibraryId])

  const selectedExerciseSeries = useMemo(() => {
    if (!selectedExerciseGroup) {
      return []
    }
    const byDay = new Map<number, number[]>()
    selectedExerciseGroup.entries.forEach((entry) => {
      const dayKey = toStartOfDay(new Date(entry.completedAt))
      const current = byDay.get(dayKey) ?? []
      current.push(entry.valueSeconds)
      byDay.set(dayKey, current)
    })
    return Array.from(byDay.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([dayKey, values]) => {
        const avgSeconds = values.reduce((sum, value) => sum + value, 0) / values.length
        return {
          value: Math.round((avgSeconds / 60) * 100) / 100,
          label: toShortDate(dayKey),
          valueSeconds: avgSeconds,
        }
      })
  }, [selectedExerciseGroup])

  const selectedExerciseProgress = useMemo(() => {
    if (!selectedExerciseGroup || selectedExerciseGroup.entries.length === 0) {
      return null
    }
    const first = selectedExerciseGroup.entries[0].valueSeconds
    const latest = selectedExerciseGroup.entries[selectedExerciseGroup.entries.length - 1].valueSeconds
    const delta = latest - first
    return { first, latest, delta }
  }, [selectedExerciseGroup])

  const sessionsCompletedInRange = completedSessions.length
  const timedExerciseSessionsInRange = exerciseTimingEvents.length
  const topExerciseCount = exerciseGroups[0]?.entries.length ?? 0
  const topExerciseName = exerciseGroups[0]?.title ?? '—'

  const isPracticeLoading = isLoadingCompletedSessions || isLoadingPracticeData
  const practiceChartWidth = Math.max(220, Math.floor(windowWidth - 86))

  const tabItems: Array<{ key: StatsTab; label: string }> = [
    { key: 'practice', label: 'Pratique' },
    { key: 'climbing', label: 'Escalade' },
    { key: 'calendar', label: 'Calendrier' },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <StatisticsHeader mode={mode} colors={colors} titleColor={colors.primary} subtitleColor={colors.grey} />

        <StatisticsDateRangeCard
          mode={mode}
          colors={colors}
          startDateLabel={formatDate(startDate)}
          endDateLabel={formatDate(endDate)}
          onPressStartDate={() => {
            if (Platform.OS === 'web') {
              DateTimePickerAndroid.open({
                value: startDate,
                mode: 'date',
                maximumDate: endDate,
                onChange: (_, date) => {
                  if (!date) return
                  setStartDate(date)
                  setEndDate((prevEnd) => (prevEnd.getTime() < date.getTime() ? date : prevEnd))
                },
              })
              return
            }
            setShowStartPicker(true)
          }}
          onPressEndDate={() => {
            if (Platform.OS === 'web') {
              DateTimePickerAndroid.open({
                value: endDate,
                mode: 'date',
                maximumDate: new Date(),
                onChange: (_, date) => {
                  if (!date) return
                  setEndDate(date)
                  setStartDate((prevStart) => (prevStart.getTime() > date.getTime() ? date : prevStart))
                },
              })
              return
            }
            setShowEndPicker(true)
          }}
        />

        <View style={[styles.modernCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow} keyboardShouldPersistTaps="handled">
            {tabItems.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.white,
                      borderColor: isActive ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.tabChipText, { color: isActive ? colors.white : colors.black }]}>{tab.label}</Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {activeTab === 'practice' ? (
          <>
            <View
              style={[styles.modernCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.black }]}>Synthèse pratique</Text>
              <View style={styles.kpiRow}>
                <View style={[styles.kpiItem, { backgroundColor: colors.badgeBackground }]}>
                  <Text style={[styles.kpiValue, { color: colors.primary }]}>{sessionsCompletedInRange}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Séances</Text>
                </View>
                <View style={[styles.kpiItem, { backgroundColor: colors.badgeBackground }]}>
                  <Text style={[styles.kpiValue, { color: colors.primary }]}>{timedExerciseSessionsInRange}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>Points temps</Text>
                </View>
                <View style={[styles.kpiItem, { backgroundColor: colors.badgeBackground }]}>
                  <Text style={[styles.kpiValue, { color: colors.primary }]}>{topExerciseCount}</Text>
                  <Text style={[styles.kpiLabel, { color: colors.mutedText }]} numberOfLines={1}>
                    {topExerciseName}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[styles.modernCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}
            >
              <Text style={[styles.sectionTitle, { color: colors.black }]}>Exercice suivi</Text>
              {isPracticeLoading ? (
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: colors.grey }]}>Chargement des données...</Text>
                </View>
              ) : exerciseGroups.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={[styles.emptyText, { color: colors.grey }]}>Aucun exercice de librairie trouvé sur cette période.</Text>
                </View>
              ) : (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersScroll}
                    keyboardShouldPersistTaps="handled"
                  >
                    {exerciseGroups.map((group) => {
                      const isActive = group.libraryExerciseId === selectedExerciseLibraryId
                      return (
                        <TouchableOpacity
                          key={group.libraryExerciseId}
                          activeOpacity={0.7}
                          onPress={() => setSelectedExerciseLibraryId(group.libraryExerciseId)}
                          style={[
                            styles.gradeChip,
                            {
                              backgroundColor: isActive ? colors.primary : colors.white,
                              borderColor: isActive ? colors.primary : colors.cardBorder,
                            },
                          ]}
                        >
                          <Text style={[styles.gradeChipText, { color: isActive ? colors.white : colors.black }]}>
                            {group.title} ({group.entries.length})
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>

                  {selectedExerciseProgress ? (
                    <View style={styles.progressRow}>
                      <View style={[styles.progressItem, { backgroundColor: colors.badgeBackground }]}>
                        <Text style={[styles.progressLabel, { color: colors.mutedText }]}>Départ</Text>
                        <Text style={[styles.progressValue, { color: colors.black }]}>{Math.round(selectedExerciseProgress.first)} sec</Text>
                      </View>
                      <View style={[styles.progressItem, { backgroundColor: colors.badgeBackground }]}>
                        <Text style={[styles.progressLabel, { color: colors.mutedText }]}>Dernier</Text>
                        <Text style={[styles.progressValue, { color: colors.black }]}>{Math.round(selectedExerciseProgress.latest)} sec</Text>
                      </View>
                      <View style={[styles.progressItem, { backgroundColor: colors.badgeBackground }]}>
                        <Text style={[styles.progressLabel, { color: colors.mutedText }]}>Évolution</Text>
                        <Text
                          style={[
                            styles.progressValue,
                            {
                              color: selectedExerciseProgress.delta >= 0 ? colors.primary : colors.danger,
                            },
                          ]}
                        >
                          {selectedExerciseProgress.delta >= 0 ? '+' : ''}
                          {Math.round(selectedExerciseProgress.delta)} sec
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {selectedExerciseSeries.length > 1 ? (
                    <View style={styles.practiceLineChartWrap}>
                      <LineChart
                        height={220}
                        data={selectedExerciseSeries.map((d) => ({ value: d.value }))}
                        xAxisLabelTexts={selectedExerciseSeries.map((d, index) => {
                          const step = Math.max(1, Math.ceil(selectedExerciseSeries.length / 6))
                          return index % step === 0 || index === selectedExerciseSeries.length - 1 ? d.label : ''
                        })}
                        adjustToWidth
                        parentWidth={practiceChartWidth}
                        disableScroll
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
                      />
                    </View>
                  ) : (
                    <View style={styles.emptyBox}>
                      <Text style={[styles.emptyText, { color: colors.grey }]}>Il faut au moins 2 points pour afficher une évolution.</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </>
        ) : null}

        {activeTab === 'calendar' ? (
          <StatisticsCalendarCard
            mode={mode}
            colors={colors}
            monthTitle={formatMonthTitle(calendarMonth)}
            isLoading={isLoadingCompletedSessions}
            calendarCells={calendarCells}
            onPrevMonth={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            onNextMonth={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            getTypeColor={getTypeColor}
            onPressDay={(dayKey) => {
              router.push({ pathname: '/statistics-day-detail', params: { day: dayKey } })
            }}
          />
        ) : null}

        {activeTab === 'climbing' ? (
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
            dailyAverageGrades={dailyAverageGrades}
            dailyAverageSuccessGrades={dailyAverageSuccessGrades}
          />
        ) : null}
      </ScrollView>

      {Platform.OS !== 'web' && showStartPicker ? (
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

      {Platform.OS !== 'web' && showEndPicker ? (
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
  modernCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
  },
  tabsRow: {
    alignItems: 'center',
    gap: 8,
  },
  tabChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  kpiLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
  },
  filtersScroll: {
    paddingHorizontal: 2,
    alignItems: 'center',
    gap: 8,
  },
  gradeChip: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
  },
  gradeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  progressItem: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
  },
  practiceLineChartWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
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
  yAxisTextStyle: {
    fontSize: 12,
    fontWeight: '700',
  },
  xAxisLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
})
