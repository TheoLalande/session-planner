import React, { useEffect, useLayoutEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { TrainingBlocItem } from '../components/TrainingBlocItem'
import { haptic } from '../utils/haptics'

export default function TrainingDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const navigation = useNavigation()
  const trainingId = id ?? ''

  const training = useTrainingStore((state) => state.trainings.find((t) => t.id === trainingId))
  const startEditingTraining = useTrainingStore((state) => state.startEditingTraining)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)

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

              router.push({
                pathname: '/run-exercise',
                params: {
                  trainingId: String(training.id),
                  exerciseIndex: '0',
                },
              })
            }}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="play-arrow" size={22} color={LightColors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              startEditingTraining(training.id)
              router.push('/create-training')
            }}
            style={styles.headerIconButton}
          >
            <MaterialIcons name="edit" size={22} color={LightColors.primary} />
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, router, startEditingTraining, training, trainingId])

  if (!training || !trainingId) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Entrainement introuvable.</Text>
      </SafeAreaView>
    )
  }

  const totalExercises = training.blocs.reduce((acc, bloc) => acc + bloc.exercises.length, 0)

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>{training.title}</Text>
        {training.description ? <Text style={styles.pageDescription}>{training.description}</Text> : null}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Blocs</Text>
            <Text style={styles.statValue}>{training.blocs.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Exercices</Text>
            <Text style={styles.statValue}>{totalExercises}</Text>
          </View>
        </View>

        {training.blocs.map((bloc) => {
          const firstExercise = bloc.exercises[0]
          const blocType = firstExercise?.type
          const blocTitleColor =
            blocType === 'warmup'
              ? '#2A9D8F'
              : blocType === 'cooldown'
                ? '#E76F51'
                : blocType === 'stretching'
                  ? '#3A86FF'
                  : blocType === 'climbing'
                    ? '#F4A261'
                    : blocType === 'hangboard'
                      ? '#8D5CF6'
                      : LightColors.black

          return (
            <View key={bloc.id} style={styles.blocCard}>
              <View style={styles.blocHeader}>
                <Text style={[styles.blocTitle, { color: blocTitleColor }]}>{bloc.title}</Text>
                <View style={styles.blocBadge}>
                  <Text style={styles.blocBadgeText}>{bloc.exercises.length}</Text>
                </View>
              </View>
              {bloc.exercises.length === 0 ? (
                <Text style={styles.emptyBlocText}>Aucun exercice dans ce bloc.</Text>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
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
    borderColor: '#E5EBF3',
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
    backgroundColor: '#E5EBF3',
  },
  blocCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EBF3',
    backgroundColor: LightColors.white,
    shadowColor: '#0F172A',
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
    backgroundColor: '#EEF4FF',
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
    backgroundColor: '#F7F9FC',
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
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#E5EBF3',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
