import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Keyboard, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ExerciceTypes, ExerciseType, Ihangboard, IClimbing, IWarmUp, ICooldown, IStretching, TrainingExercise } from '../types/trainingTypes'
import { PrimaryButton } from '../components/PrimaryButton'
import { ExercicePicker } from '../components/ExercicePicker'
import { HangboardForm } from '../components/HangboardForm'
import { ClimbingForm } from '../components/ClimbingForm'
import { WarmupForm } from '../components/WarmupForm'
import { CooldownForm } from '../components/CooldownForm'
import { StretchingForm } from '../components/StretchingForm'
import { useTrainingStore } from '../store/trainingStore'
import { ExerciceColors } from '../constants/theme'

export default function index() {
  const params = useLocalSearchParams<{
    blocId?: string
    trainingId?: string
    mode?: string
    exerciseIndex?: string
  }>()
  const blocId = params.blocId ? Number(params.blocId) : null
  const trainingId = params.trainingId ?? null
  const exerciseIndex = params.exerciseIndex ? Number(params.exerciseIndex) : null
  const isEditTrainingMode = params.mode === 'edit' && trainingId !== null && exerciseIndex !== null && blocId !== null
  const isEditBlocMode = params.mode === 'edit-bloc' && blocId !== null && exerciseIndex !== null

  const addExerciseToBloc = useTrainingStore((state) => state.addExerciseToBloc)
  const removeExerciseFromBloc = useTrainingStore((state) => state.removeExerciseFromBloc)
  const removeExerciseFromTraining = useTrainingStore((state) => state.removeExerciseFromTraining)
  const updateExerciseInBloc = useTrainingStore((state) => state.updateExerciseInBloc)
  const updateExerciseInTraining = useTrainingStore((state) => state.updateExerciseInTraining)
  const blocType = useTrainingStore((state) => (blocId ? state.blocs.find((b) => b.id === blocId)?.blocType : undefined))
  const currentExercise = useTrainingStore((state) => {
    if (isEditTrainingMode) {
      if (trainingId === null || blocId === null || exerciseIndex === null) {
        return null
      }
      const training = state.trainings.find((t) => t.id === trainingId)
      const bloc = training?.blocs.find((b) => b.id === blocId)
      if (!bloc || exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
        return null
      }
      return bloc.exercises[exerciseIndex]
    }

    if (isEditBlocMode) {
      if (blocId === null || exerciseIndex === null) {
        return null
      }
      const bloc = state.blocs.find((b) => b.id === blocId)
      if (!bloc || exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
        return null
      }
      return bloc.exercises[exerciseIndex]
    }

    return null
  })

  const forcedType: ExerciseType | null = useMemo(() => {
    if (isEditTrainingMode || isEditBlocMode) {
      return null
    }
    return blocType ?? null
  }, [blocType, isEditTrainingMode, isEditBlocMode])

  const [selectedType, setSelectedType] = useState<ExerciceTypes | null>(null)

  const [hangboardData, setHangboardData] = useState<Ihangboard>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    holdType: '',
    restingTime: 0,
    holdTime: 0,
    sets: 0,
    notes: '',
  })

  const [climbingData, setClimbingData] = useState<IClimbing>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    grade: '6a',
    restingTime: 0,
    attempts: 0,
    notes: '',
  })

  const [warmupData, setWarmupData] = useState<IWarmUp>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    exerciceType: '',
    notes: '',
    duration: 0,
    durationUnit: 'seconds',
    mode: 'time',
    repetitions: 0,
  })

  const [cooldownData, setCooldownData] = useState<ICooldown>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    exerciceType: '',
    notes: '',
    duration: 0,
    durationUnit: 'seconds',
    mode: 'time',
    repetitions: 0,
  })

  const [stretchingData, setStretchingData] = useState<IStretching>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    exerciceType: '',
    notes: '',
    duration: 0,
    durationUnit: 'seconds',
    mode: 'time',
    repetitions: 0,
  })

  useEffect(() => {
    if ((!isEditTrainingMode && !isEditBlocMode) || !currentExercise) {
      return
    }

    setSelectedType(currentExercise.type)

    if (currentExercise.type === 'hangboard') {
      setHangboardData(currentExercise.data)
    } else if (currentExercise.type === 'climbing') {
      setClimbingData(currentExercise.data)
    } else if (currentExercise.type === 'warmup') {
      setWarmupData(currentExercise.data)
    } else if (currentExercise.type === 'cooldown') {
      setCooldownData(currentExercise.data)
    } else if (currentExercise.type === 'stretching') {
      setStretchingData(currentExercise.data)
    }
  }, [currentExercise, isEditTrainingMode, isEditBlocMode])

  // Si le bloc impose un type (warmup/cooldown/stretching/climbing/hangboard),
  // on le sélectionne automatiquement et on ne montre plus le picker.
  useEffect(() => {
    if (!forcedType) {
      return
    }
    setSelectedType(forcedType)
  }, [forcedType])

  const handleNext = async () => {
    if (!blocId || !selectedType) {
      router.back()
      return
    }

    let exercise: TrainingExercise | null = null

    if (selectedType === 'hangboard') {
      exercise = { type: 'hangboard', data: hangboardData }
    } else if (selectedType === 'climbing') {
      exercise = { type: 'climbing', data: climbingData }
    } else if (selectedType === 'warmup') {
      exercise = { type: 'warmup', data: warmupData }
    } else if (selectedType === 'cooldown') {
      exercise = { type: 'cooldown', data: cooldownData }
    } else if (selectedType === 'stretching') {
      exercise = { type: 'stretching', data: stretchingData }
    }

    if (exercise) {
      if (isEditTrainingMode && trainingId !== null && exerciseIndex !== null) {
        await updateExerciseInTraining(trainingId, blocId, exerciseIndex, exercise)
      } else if (isEditBlocMode && exerciseIndex !== null) {
        updateExerciseInBloc(blocId, exerciseIndex, exercise)
      } else {
        addExerciseToBloc(blocId, exercise)
      }
    }

    router.back()
  }

  const handleDelete = () => {
    if (blocId === null || exerciseIndex === null || (!isEditTrainingMode && !isEditBlocMode)) {
      return
    }

    Alert.alert("Supprimer l'exercice", 'Cette action est irreversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          if (isEditTrainingMode && trainingId !== null) {
            removeExerciseFromTraining(trainingId, blocId, exerciseIndex).then(() => {
              router.back()
            })
            return
          }
          removeExerciseFromBloc(blocId, exerciseIndex)
          router.back()
        },
      },
    ])
  }

  const renderForm = () => {
    if (selectedType === 'hangboard') {
      return <HangboardForm value={hangboardData} onChange={setHangboardData} />
    }
    if (selectedType === 'climbing') {
      return <ClimbingForm value={climbingData} onChange={setClimbingData} />
    }
    if (selectedType === 'warmup') {
      return <WarmupForm value={warmupData} onChange={setWarmupData} />
    }
    if (selectedType === 'cooldown') {
      return <CooldownForm value={cooldownData} onChange={setCooldownData} />
    }
    if (selectedType === 'stretching') {
      return <StretchingForm value={stretchingData} onChange={setStretchingData} />
    }

    return null
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingBottom: 30,
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {!forcedType && !isEditTrainingMode && !isEditBlocMode ? <ExercicePicker selectedType={selectedType} onSelect={setSelectedType} /> : null}
        {renderForm()}
        <View style={{ width: '100%', paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
          <PrimaryButton title="Ajouter l'exercice" onPress={handleNext} />
          {isEditTrainingMode || isEditBlocMode ? (
            <PrimaryButton
              title="Supprimer l'exercice"
              onPress={handleDelete}
              color={ExerciceColors.cooldown}
              borderColor={ExerciceColors.cooldown}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
