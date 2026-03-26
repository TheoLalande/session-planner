import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BottomNavBar } from '../components'
import { LightColors } from '../constants/theme'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { router } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { haptic } from '../utils/haptics'
import { getSession } from '../api/authService'
import LoadingIndicator from '../components/LoadingIndicator'
import { MaterialIcons } from '@expo/vector-icons'

export default function index() {
  const trainings = useTrainingStore((state) => state.trainings)
  const removeTraining = useTrainingStore((state) => state.removeTraining)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [isRemovingTraining, setIsRemovingTraining] = useState(false)

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      try {
        const session = await getSession()
        if (!isMounted) return
        if (!session.accessToken) {
          router.replace('/login')
          return
        }
      } catch {
        if (!isMounted) return
        router.replace('/login')
        return
      }

      try {
        if (trainings.length === 0) {
          await loadTrainings()
        }
      } catch {
        if (!isMounted) return
      } finally {
        if (!isMounted) return
        setIsCheckingSession(false)
      }
    }

    check()
    return () => {
      isMounted = false
    }
  }, [loadTrainings, trainings.length])

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingIndicator />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Mes entrainements</Text>
          <Text style={styles.pageSubtitle}>Retrouve et lance tes sessions en un geste.</Text>
        </View>

        <View style={styles.listContainer}>
          {trainings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Aucun entrainement pour le moment</Text>
              <Text style={styles.emptySubtitle}>Crée ton premier entrainement avec le bouton + en bas.</Text>
            </View>
          ) : (
            trainings.map((training) => (
              <Swipeable
                key={training.id}
                containerStyle={styles.swipeContainer}
                overshootLeft={false}
                overshootRight={false}
                renderLeftActions={() => <View style={styles.deleteBackground} />}
                renderRightActions={() => <View style={styles.deleteBackground} />}
                onSwipeableOpen={async (direction) => {
                  if (direction === 'left' || direction === 'right') {
                    setIsRemovingTraining(true)
                    try {
                      await removeTraining(training.id)
                    } finally {
                      setIsRemovingTraining(false)
                    }
                  }
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={async () => {
                    await haptic('tap')
                    router.push({ pathname: '/training-detail', params: { id: String(training.id) } })
                  }}
                  style={styles.trainingCard}
                >
                  <View style={styles.trainingTopRow}>
                    <View style={styles.trainingTextBlock}>
                      <Text style={styles.trainingTitle}>{training.title}</Text>
                      {training.description ? <Text style={styles.trainingDescription}>{training.description}</Text> : null}
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color="#98A5B8" />
                  </View>
                  <View style={styles.trainingMetaRow}>
                    <View style={styles.trainingMeta}>
                      <Text style={styles.trainingMetaText}>{training.blocs.length} bloc(s) d'exercices</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Swipeable>
            ))
          )}
        </View>
      </ScrollView>
      <BottomNavBar />
      {isRemovingTraining ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <LoadingIndicator />
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  pageHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: LightColors.primary,
  },
  pageSubtitle: {
    marginTop: 4,
    color: LightColors.grey,
    fontSize: 14,
  },
  listContainer: {
    width: '100%',
    gap: 12,
  },
  emptyState: {
    backgroundColor: LightColors.white,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E6ECF4',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: LightColors.black,
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: LightColors.grey,
    textAlign: 'center',
  },
  swipeContainer: {
    width: '100%',
  },
  trainingCard: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EBF3',
    backgroundColor: LightColors.white,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 2,
  },
  trainingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  trainingTextBlock: {
    flex: 1,
  },
  trainingTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: LightColors.black,
  },
  trainingDescription: {
    marginTop: 6,
    color: LightColors.grey,
    fontSize: 14,
  },
  trainingMetaRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainingMeta: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EEF4FF',
  },
  trainingMetaText: {
    fontSize: 12,
    color: LightColors.primary,
    fontWeight: '600',
  },
  deleteBackground: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 16,
  },
})
