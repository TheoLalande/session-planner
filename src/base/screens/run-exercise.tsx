import React, { useEffect, useMemo } from 'react'
import { View, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { TrainingExercise } from '../types/trainingTypes'

export default function RunExercise() {
  const { trainingId, exerciseIndex } = useLocalSearchParams<{ trainingId?: string; exerciseIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)

  useEffect(() => {
    loadTrainings()
  }, [loadTrainings])

  const { exercise, isValid } = useMemo((): { exercise: TrainingExercise | null; isValid: boolean } => {
    const trainingIdValue = trainingId ?? ''
    const indexNum = exerciseIndex ? Number(exerciseIndex) : 0

    const training = trainings.find((t) => t.id === trainingIdValue)
    if (!training || !trainingIdValue || Number.isNaN(indexNum)) {
      return { exercise: null, isValid: false }
    }

    const exercises = training.blocs.flatMap((b) => b.exercises)
    if (indexNum < 0 || indexNum >= exercises.length) {
      return { exercise: null, isValid: false }
    }

    return { exercise: exercises[indexNum], isValid: true }
  }, [exerciseIndex, trainingId, trainings])

  useEffect(() => {
    if (!isValid || !exercise || !trainingId) {
      return
    }

    if (exercise.type === 'warmup' || exercise.type === 'cooldown' || exercise.type === 'stretching') {
      router.replace({
        pathname: '/simple-timer',
        params: { trainingId, exerciseIndex: String(exerciseIndex ?? '0') },
      })
      return
    }

    if (exercise.type === 'climbing') {
      router.replace({
        pathname: '/climb-steps',
        params: { trainingId, exerciseIndex: String(exerciseIndex ?? '0') },
      })
      return
    }

    if (exercise.type === 'hangboard') {
      router.replace({
        pathname: '/hangboard',
        params: { trainingId, exerciseIndex: String(exerciseIndex ?? '0') },
      })
      return
    }
  }, [exercise, exerciseIndex, isValid, router, trainingId])

  if (!isValid) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: LightColors.grey }}>Exercice introuvable.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View>
        <Text style={{ color: LightColors.grey }}>Chargement...</Text>
      </View>
    </SafeAreaView>
  )
}

