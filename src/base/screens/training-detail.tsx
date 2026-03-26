import React, { useEffect, useLayoutEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Text, TouchableOpacity } from 'react-native'
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
        <View style={{ flexDirection: 'row' }}>
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
            style={{
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
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
            style={{
              width: 40,
              height: 40,
              backgroundColor: LightColors.white,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="edit" size={22} color={LightColors.primary} />
          </TouchableOpacity>
        </View>
      ),
    })
  }, [navigation, router, startEditingTraining, training, trainingId])

  if (!training || !trainingId) {
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
          paddingTop: 20,
          paddingBottom: 30,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '700', color: LightColors.primary, marginBottom: 8 }}>{training.title}</Text>
        {training.description ? <Text style={{ fontSize: 14, color: LightColors.grey, marginBottom: 16 }}>{training.description}</Text> : null}

        {training.blocs.map((bloc) => {
          const firstExercise = bloc.exercises[0]
          const type = firstExercise?.type as keyof typeof LightColors | undefined
          const blocTitleColor = type && LightColors[type] ? LightColors[type] : LightColors.black

          return (
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
              <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 6, color: blocTitleColor }}>{bloc.title}</Text>
              {bloc.exercises.length === 0 ? (
                <Text style={{ color: LightColors.grey, fontSize: 13 }}>Aucun exercice dans ce bloc.</Text>
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
