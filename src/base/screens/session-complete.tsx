import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { useTrainingStore } from '../store/trainingStore'
import { createCompletedSession } from '../api/completedSessionsService'

export default function SessionComplete() {
  const { trainingId } = useLocalSearchParams<{ trainingId?: string }>()
  const [isSaving, setIsSaving] = useState(false)
  const trainings = useTrainingStore((state) => state.trainings)
  const isLoadingTrainings = useTrainingStore((state) => state.isLoadingTrainings)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)
  const training = useMemo(() => trainings.find((item) => item.id === String(trainingId)), [trainingId, trainings])

  useEffect(() => {
    if (!trainingId) {
      return
    }
    if (training) {
      return
    }
    loadTrainings()
  }, [loadTrainings, training, trainingId])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Session terminée ?</Text>
        <Text style={styles.subtitle}>Confirme que tu as bien réalisé toute la séance.</Text>

        <View style={styles.buttons}>
          <PrimaryButton
            title="Oui, session terminée"
            isClickable={!isSaving && !isLoadingTrainings}
            onPress={async () => {
              if (!trainingId) {
                router.replace('/home')
                return
              }
              if (isLoadingTrainings) {
                return
              }
              if (!training) {
                Alert.alert('Info', "Chargement de l'entrainement en cours, réessaie dans quelques secondes.")
                return
              }
              try {
                setIsSaving(true)
                await createCompletedSession({
                  trainingId: String(trainingId),
                  blocs: training.blocs,
                })
              } catch (e) {
                const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : "Erreur lors de l'enregistrement de la séance"
                Alert.alert('Erreur', message)
                return
              } finally {
                setIsSaving(false)
              }
              router.replace({ pathname: '/training-detail', params: { id: String(trainingId) } })
            }}
          />
          <PrimaryButton
            title="Pas encore"
            color={LightColors.white}
            borderColor={LightColors.primary}
            textColor={LightColors.primary}
            onPress={() => {
              if (!trainingId) {
                router.replace('/home')
                return
              }
              router.replace({ pathname: '/run-exercise', params: { trainingId: String(trainingId), exerciseIndex: '0' } })
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: LightColors.primary,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: LightColors.grey,
    textAlign: 'center',
  },
  buttons: {
    width: '100%',
    marginTop: 22,
    gap: 10,
    alignItems: 'center',
  },
})
