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
import { useAppTheme } from '../providers/themeProvider'

export default function index() {
  const { mode, colors } = useAppTheme()
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
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingIndicator />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.primary }]}>Mes entrainements</Text>
          <Text style={[styles.pageSubtitle, { color: colors.grey }]}>Retrouve et lance tes sessions en un geste.</Text>
        </View>

        <View style={styles.listContainer}>
          {trainings.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.lightGrey, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorderMuted },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.black }]}>Aucun entrainement pour le moment</Text>
              <Text style={[styles.emptySubtitle, { color: colors.grey }]}>Crée ton premier entrainement avec le bouton + en bas.</Text>
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
                  style={[
                    styles.trainingCard,
                    { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder },
                  ]}
                >
                  <View style={styles.trainingTopRow}>
                    <View style={styles.trainingTextBlock}>
                      <Text style={[styles.trainingTitle, { color: colors.black }]}>{training.title}</Text>
                      {training.description ? <Text style={[styles.trainingDescription, { color: colors.grey }]}>{training.description}</Text> : null}
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.grey} />
                  </View>
                  <View style={styles.trainingMetaRow}>
                    <View style={[styles.trainingMeta, { backgroundColor: mode === 'dark' ? colors.darkBadgeBackground : colors.badgeBackground }]}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightColors.background,
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
    borderColor: LightColors.cardBorderMuted,
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
    borderColor: LightColors.cardBorder,
    backgroundColor: LightColors.white,
    shadowColor: LightColors.shadow,
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
    backgroundColor: LightColors.badgeBackground,
  },
  trainingMetaText: {
    fontSize: 12,
    color: LightColors.primary,
    fontWeight: '600',
  },
  deleteBackground: {
    flex: 1,
    backgroundColor: LightColors.danger,
    borderRadius: 16,
  },
})
