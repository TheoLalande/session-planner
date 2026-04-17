import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import LoadingIndicator from '../components/LoadingIndicator'
import { CompletedSession, fetchCompletedSessions } from '../api/completedSessionsService'
import { useAppTheme } from '../providers/themeProvider'
import { useTrainingStore } from '../store/trainingStore'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'

const parseDayKey = (dayKey: string) => {
  const match = dayKey.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) {
    return null
  }
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }
  const date = new Date(year, month, day)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }
  return date
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

const formatDayLabel = (d: Date) =>
  d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

const formatHour = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

export default function StatisticsDayDetail() {
  const { mode, colors } = useAppTheme()
  const styles = createStyles(colors)
  const { day } = useLocalSearchParams<{ day?: string }>()
  const dayKey = typeof day === 'string' ? day : Array.isArray(day) ? day[0] : ''
  const parsedDate = useMemo(() => parseDayKey(dayKey), [dayKey])
  const dayStart = useMemo(() => (parsedDate ? toStartOfDay(parsedDate) : 0), [parsedDate])
  const dayEnd = useMemo(() => (parsedDate ? toEndOfDay(parsedDate) : 0), [parsedDate])
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [isLoadingCompletedSessions, setIsLoadingCompletedSessions] = useState(false)
  const trainings = useTrainingStore((state) => state.trainings)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)
  const attempts = useClimbingAttemptsStore((state) => state.attempts)
  const isLoadingAttempts = useClimbingAttemptsStore((state) => state.isLoadingAttempts)
  const loadAttempts = useClimbingAttemptsStore((state) => state.loadAttempts)

  useEffect(() => {
    void loadTrainings()
    void loadAttempts()
  }, [loadAttempts, loadTrainings])

  useEffect(() => {
    if (!parsedDate) {
      setCompletedSessions([])
      return
    }
    let isMounted = true
    const loadDaySessions = async () => {
      try {
        setIsLoadingCompletedSessions(true)
        const data = await fetchCompletedSessions({ startAt: dayStart, endAt: dayEnd })
        if (isMounted) {
          setCompletedSessions(data)
        }
      } finally {
        if (isMounted) {
          setIsLoadingCompletedSessions(false)
        }
      }
    }
    void loadDaySessions()
    return () => {
      isMounted = false
    }
  }, [dayEnd, dayStart, parsedDate])

  const trainingById = useMemo(() => {
    const map = new Map<string, string>()
    trainings.forEach((training) => {
      map.set(training.id, training.title)
    })
    return map
  }, [trainings])

  const climbingAttemptsOfDay = useMemo(() => {
    if (!parsedDate) {
      return []
    }
    return attempts
      .filter((attempt) => attempt.createdAt >= dayStart && attempt.createdAt <= dayEnd)
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [attempts, dayEnd, dayStart, parsedDate])

  const completedSessionsSorted = useMemo(
    () => [...completedSessions].sort((a, b) => b.completedAt - a.completedAt),
    [completedSessions],
  )

  const isLoading = isLoadingAttempts || isLoadingCompletedSessions

  if (!parsedDate) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.grey }]}>Date invalide.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.primary }]}>Détail de la journée</Text>
        <Text style={[styles.subtitle, { color: colors.grey }]}>{formatDayLabel(parsedDate)}</Text>

        {isLoading ? (
          <View style={[styles.loadingBox, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
            <LoadingIndicator />
          </View>
        ) : (
          <>
            <View style={[styles.sectionCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.black }]}>Entraînements terminés</Text>
              {completedSessionsSorted.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune séance terminée.</Text>
              ) : (
                completedSessionsSorted.map((session) => (
                  <View key={session.id} style={[styles.rowCard, { backgroundColor: colors.badgeBackground }]}>
                    <Text style={[styles.rowTitle, { color: colors.black }]}>{trainingById.get(session.trainingId) ?? 'Entraînement'}</Text>
                    <Text style={[styles.rowSub, { color: colors.grey }]}>
                      {formatHour(session.completedAt)} · {session.blockTypes.join(' · ') || 'Sans bloc'}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={[styles.sectionCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
              <Text style={[styles.sectionTitle, { color: colors.black }]}>Voies réalisées</Text>
              {climbingAttemptsOfDay.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune voie réalisée ce jour.</Text>
              ) : (
                climbingAttemptsOfDay.map((attempt) => (
                  <View key={attempt.id} style={[styles.rowCard, { backgroundColor: colors.badgeBackground }]}>
                    <Text style={[styles.rowTitle, { color: colors.black }]}>
                      {attempt.climbingType} · {attempt.routeName} · {attempt.grade}
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.grey }]}>
                      {formatHour(attempt.createdAt)} · {attempt.status === 'success' ? 'Réussi' : 'Échoué'} ·{' '}
                      {attempt.source === 'planned' ? 'Entraînement' : 'Hors séance'}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      gap: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primary,
    },
    subtitle: {
      marginTop: 2,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'capitalize',
      color: colors.grey,
    },
    loadingBox: {
      borderWidth: 1,
      borderRadius: 16,
      minHeight: 160,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 12,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 2,
    },
    rowCard: {
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      gap: 2,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    rowSub: {
      fontSize: 12,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 13,
      fontWeight: '600',
    },
  })
