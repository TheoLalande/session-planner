import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { TrainingBlocItem } from '../components/TrainingBlocItem'

export default function TrainingDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const router = useRouter()
  const trainingId = id ? Number(id) : NaN

  const training = useTrainingStore((state) =>
    state.trainings.find((t) => t.id === trainingId),
  )

  if (!training || Number.isNaN(trainingId)) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: LightColors.grey }}>Entrainement introuvable.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 30,
          paddingTop: 30,
          paddingBottom: 30,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: LightColors.primary, marginBottom: 8 }}>
          {training.title}
        </Text>
        {training.description ? (
          <Text style={{ fontSize: 14, color: LightColors.grey, marginBottom: 16 }}>
            {training.description}
          </Text>
        ) : null}

        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, color: LightColors.black }}>
          Blocs d'exercices
        </Text>

        {training.blocs.map((bloc) => (
          <View
            key={bloc.id}
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: LightColors.primary,
              backgroundColor: LightColors.white,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 6, color: LightColors.black }}>
              {bloc.title}
            </Text>
            {bloc.exercises.length === 0 ? (
              <Text style={{ color: LightColors.grey, fontSize: 13 }}>Aucun exercice dans ce bloc.</Text>
            ) : (
              bloc.exercises.map((exercise, index) => (
                <TrainingBlocItem key={index} exercise={exercise} />
              ))
            )}
          </View>
        ))}

        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Text
            style={{
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 24,
              backgroundColor: LightColors.primary,
              color: LightColors.white,
              fontWeight: '600',
            }}
            onPress={() => {
              // On prend pour l'instant la séquence des exercices "time-based" (warmup / cooldown / stretching)
              const timeExercises = training.blocs
                .flatMap((bloc) => bloc.exercises)
                .filter(
                  (exercise) =>
                    exercise.type === 'warmup' ||
                    exercise.type === 'cooldown' ||
                    exercise.type === 'stretching',
                )

              if (timeExercises.length === 0) {
                return
              }

              router.push({
                pathname: '/simple-timer',
                params: {
                  trainingId: String(training.id),
                  timeIndex: '0',
                },
              })
            }}
          >
            Commencer l'entrainement
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

