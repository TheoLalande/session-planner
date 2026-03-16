import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Keyboard } from 'react-native'
import { router } from 'expo-router'
import { useLocalSearchParams } from 'expo-router'
import { ExerciceTypes, Ihangboard, IClimbing, IWarmUp, ICooldown, IStretching, TrainingExercise } from '../types/trainingTypes'
import { PrimaryButton } from '../components/PrimaryButton'
import { ExercicePicker } from '../components/ExercicePicker'
import { HangboardForm } from '../components/HangboardForm'
import { ClimbingForm } from '../components/ClimbingForm'
import { WarmupForm } from '../components/WarmupForm'
import { CooldownForm } from '../components/CooldownForm'
import { StretchingForm } from '../components/StretchingForm'
import { useTrainingStore } from '../store/trainingStore'

export default function index() {
  const params = useLocalSearchParams<{ blocId?: string }>()
  const blocId = params.blocId ? Number(params.blocId) : null

  const addExerciseToBloc = useTrainingStore((state) => state.addExerciseToBloc)

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
  })

  const [cooldownData, setCooldownData] = useState<ICooldown>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    exerciceType: '',
    notes: '',
    duration: 0,
  })

  const [stretchingData, setStretchingData] = useState<IStretching>({
    id: 0,
    title: '',
    description: '',
    picture: '',
    exerciceType: '',
    notes: '',
    duration: 0,
  })

  const handleNext = () => {
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
      addExerciseToBloc(blocId, exercise)
    }

    router.back()
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
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: 30,
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        <ExercicePicker selectedType={selectedType} onSelect={setSelectedType} />
        {renderForm()}
        <View style={{ width: '100%', paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center' }}>
          <PrimaryButton title="Valider" onPress={handleNext} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
