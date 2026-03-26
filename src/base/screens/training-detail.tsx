import React, { useEffect, useLayoutEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { TrainingBlocItem } from '../components/TrainingBlocItem'
import { haptic } from '../utils/haptics'
import LoadingIndicator from '../components/LoadingIndicator'
import { useAppTheme } from '../providers/themeProvider'

export default function TrainingDetail() {
  const { mode, colors } = useAppTheme()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  const trainingId = id ?? ''

  const training = useTrainingStore((state) => state.trainings.find((t) => t.id === trainingId))
  const startEditingTraining = useTrainingStore((state) => state.startEditingTraining)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)
  const isLoadingTrainings = useTrainingStore((state) => state.isLoadingTrainings)
  const [isStartingTraining, setIsStartingTraining] = useState(false)

  useEffect(() => {
    loadTrainings()
  }, [loadTrainings])

  useLayoutEffect(() => {
    if (!training || !trainingId) {
      navigation.setOptions({ headerRight: undefined })
      return
    }

    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              const exercises = training.blocs.flatMap((bloc) => bloc.exercises)
              if (exercises.length === 0) return

              const imageUris = Array.from(
                new Set(
                  exercises
                    .map((exercise) => (exercise.data as any)?.picture)
                    .filter((uri): uri is string => typeof uri === 'string' && uri.trim().length > 0 && /^https?:\/\//i.test(uri))
                )
              )

              setIsStartingTraining(true)
              try {
                await Promise.allSettled(imageUris.map((uri) => Image.prefetch(uri)))
                router.push({
                  pathname: '/run-exercise',
                  params: {
                    trainingId: String(training.id),
                    exerciseIndex: '0',
                  },
                })
              } finally {
                setIsStartingTraining(false)
              }
            }}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: mode === 'dark' ? colors.darkBadgeBackground : colors.headerButtonBackground,
                borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder,
              },
            ]}
          >
            <MaterialIcons name="play-arrow" size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              startEditingTraining(training.id)
              router.push('/create-training')
            }}
            style={[
              styles.headerIconButton,
              {
                backgroundColor: mode === 'dark' ? colors.darkBadgeBackground : colors.headerButtonBackground,
                borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder,
              },
            ]}
          >
            <MaterialIcons name="edit" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, router, startEditingTraining, training, trainingId])

  if (isLoadingTrainings) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <LoadingIndicator />
      </SafeAreaView>
    )
  }

  if (!training || !trainingId) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.grey }]}>Entrainement introuvable.</Text>
      </SafeAreaView>
    )
  }

  const totalExercises = training.blocs.reduce((acc, bloc) => acc + bloc.exercises.length, 0)

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.pageTitle, { color: colors.primary }]}>{training.title}</Text>
        {training.description ? <Text style={[styles.pageDescription, { color: colors.grey }]}>{training.description}</Text> : null}
        <View style={[styles.statsCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.grey }]}>Blocs</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{training.blocs.length}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, { color: colors.grey }]}>Exercices</Text>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalExercises}</Text>
          </View>
        </View>

        {training.blocs.map((bloc) => {
          const firstExercise = bloc.exercises[0]
          const blocType = firstExercise?.type
          const blocTitleColor =
            blocType === 'warmup'
              ? colors.warmup
              : blocType === 'cooldown'
                ? colors.cooldown
                : blocType === 'stretching'
                  ? colors.stretching
                  : blocType === 'climbing'
                    ? colors.climbing
                    : blocType === 'hangboard'
                      ? colors.hangboard
                      : LightColors.black

          return (
            <View
              key={bloc.id}
              style={[styles.blocCard, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}
            >
              <View style={styles.blocHeader}>
                <Text style={[styles.blocTitle, { color: blocTitleColor }]}>{bloc.title}</Text>
                <View style={[styles.blocBadge, { backgroundColor: mode === 'dark' ? colors.darkBadgeBackground : colors.badgeBackground }]}>
                  <Text style={[styles.blocBadgeText, { color: colors.primary }]}>{bloc.exercises.length}</Text>
                </View>
              </View>
              {bloc.exercises.length === 0 ? (
                <Text style={[styles.emptyBlocText, { color: colors.grey }]}>Aucun exercice dans ce bloc.</Text>
              ) : (
                bloc.exercises.map((exercise, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    onPress={async () => {
                      await haptic('tap')
                      router.push({
                        pathname: '/create-exercice',
                        params: {
                          mode: 'edit',
                          trainingId: String(training.id),
                          blocId: String(bloc.id),
                          exerciseIndex: String(index),
                        },
                      })
                    }}
                    style={styles.exerciseRow}
                  >
                    <TrainingBlocItem exercise={exercise} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          )
        })}
      </ScrollView>
      {isStartingTraining ? (
        <View pointerEvents="none" style={[styles.loadingOverlay, { backgroundColor: mode === 'dark' ? colors.overlayDark : colors.overlayLight }]}>
          <LoadingIndicator />
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: LightColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: LightColors.primary,
  },
  pageDescription: {
    marginTop: 6,
    color: LightColors.grey,
    fontSize: 14,
    marginBottom: 14,
  },
  statsCard: {
    width: '100%',
    backgroundColor: LightColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: LightColors.grey,
    fontWeight: '600',
  },
  statValue: {
    marginTop: 2,
    fontSize: 22,
    color: LightColors.primary,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: LightColors.cardBorder,
  },
  blocCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
    backgroundColor: LightColors.white,
    shadowColor: LightColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  blocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  blocTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  blocBadge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightColors.badgeBackground,
  },
  blocBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: LightColors.primary,
  },
  emptyBlocText: {
    color: LightColors.grey,
    fontSize: 13,
  },
  exerciseRow: {
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightColors.background,
  },
  emptyText: {
    color: LightColors.grey,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 4,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: LightColors.headerButtonBackground,
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: LightColors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
})
