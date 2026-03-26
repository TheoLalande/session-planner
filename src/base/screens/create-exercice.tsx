import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Keyboard, Alert, StyleSheet } from 'react-native'
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
import { LightColors } from '../constants/theme'
import { getSession } from '../api/authService'
import { getSupabaseClient } from '../api/supabaseClient'
import LoadingIndicator from '../components/LoadingIndicator'
import * as ImageManipulator from 'expo-image-manipulator'

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
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const STORAGE_BUCKET = 'exercice-images'
  const isLocalUri = (uri: string) => !/^https?:\/\//i.test(uri)

  const extractStoragePathFromUrl = (storageUrl: string): string | null => {
    const publicMarker = `/storage/v1/object/public/${STORAGE_BUCKET}/`
    const signMarker = `/storage/v1/object/sign/${STORAGE_BUCKET}/`
    const idxPublic = storageUrl.indexOf(publicMarker)
    const idxSign = storageUrl.indexOf(signMarker)
    const idx = idxPublic !== -1 ? idxPublic : idxSign
    const marker = idxPublic !== -1 ? publicMarker : signMarker
    if (idx === -1) return null
    const afterMarker = storageUrl.substring(idx + marker.length)
    const pathEncoded = afterMarker.split('?')[0]
    try {
      return decodeURIComponent(pathEncoded)
    } catch {
      return pathEncoded
    }
  }

  const deleteExercisePictureFromStorage = async (pictureUrl?: string) => {
    if (!pictureUrl) return
    if (!pictureUrl.startsWith('http')) return
    const objectPath = extractStoragePathFromUrl(pictureUrl)
    if (!objectPath) return
    const supabase = getSupabaseClient()
    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([objectPath])
    if (error) {
      Alert.alert('Erreur', error.message)
    }
  }

  const uploadExercisePictureToStorage = async (localUri: string, userId: string): Promise<string> => {
    const supabase = getSupabaseClient()
    const manipulated = await ImageManipulator.manipulateAsync(
      localUri,
      [{ resize: { width: 1280 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
    )

    const response = await fetch(manipulated.uri)
    const arrayBuffer = await response.arrayBuffer()
    const contentType = 'image/jpeg'

    const fileNameRaw = localUri.split('/').pop() ?? 'image'
    const fileNameBase = fileNameRaw.split('?')[0] || 'image'
    const safeBase = fileNameBase.replace(/[^a-zA-Z0-9._-]/g, '_')
    const lastDotIdx = safeBase.lastIndexOf('.')
    const hasExt = lastDotIdx !== -1 && lastDotIdx < safeBase.length - 1
    const ext = hasExt ? safeBase.slice(lastDotIdx + 1).toLowerCase() : 'jpg'
    const baseNoExt = hasExt ? safeBase.slice(0, lastDotIdx) : safeBase
    const safeBaseNoExt = baseNoExt || 'image'
    const objectPath = `users/${userId}/exercises/${Date.now()}-${safeBaseNoExt}.${ext}`

    const fileBytes = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, fileBytes as any, { contentType, upsert: false })
    if (uploadError) throw new Error(uploadError.message)

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL')
    return `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`
  }

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
      const dataAny = exercise.data as any
      const pictureValue = typeof dataAny.picture === 'string' ? dataAny.picture : ''

      const existingPicture = currentExercise && (currentExercise.data as any).picture ? (currentExercise.data as any).picture : undefined

      if (pictureValue && pictureValue !== existingPicture) {
        if (isLocalUri(pictureValue)) {
          setIsSaving(true)
          try {
            const session = await getSession()
            const userId = session.user?.id
            if (!userId) {
              Alert.alert('Erreur', 'Utilisateur non connecté')
              return
            }

            const uploadedUrl = await uploadExercisePictureToStorage(pictureValue, userId)
            dataAny.picture = uploadedUrl

            if (existingPicture) {
              await deleteExercisePictureFromStorage(existingPicture)
            }
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible de televerser l image')
            return
          } finally {
            setIsSaving(false)
          }
        } else {
          dataAny.picture = pictureValue
        }
      }

      if (isEditTrainingMode && trainingId !== null && exerciseIndex !== null) {
        setIsSaving(true)
        try {
          await updateExerciseInTraining(trainingId, blocId, exerciseIndex, exercise)
        } finally {
          setIsSaving(false)
        }
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
        onPress: async () => {
          try {
            setIsDeleting(true)
            if (currentExercise && (currentExercise.data as any)?.picture) {
              await deleteExercisePictureFromStorage((currentExercise.data as any).picture)
            }

            if (isEditTrainingMode && trainingId !== null) {
              await removeExerciseFromTraining(trainingId, blocId, exerciseIndex)
              router.back()
              return
            }
            removeExerciseFromBloc(blocId, exerciseIndex)
            router.back()
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || 'Impossible de supprimer l image')
          } finally {
            setIsDeleting(false)
          }
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
          <PrimaryButton title="Ajouter l'exercice" onPress={handleNext} isClickable={!isSaving && !isDeleting} />
          {isEditTrainingMode || isEditBlocMode ? (
            <PrimaryButton
              title="Supprimer l'exercice"
              onPress={handleDelete}
              color={LightColors.primary}
              borderColor={LightColors.primary}
              isClickable={!isSaving && !isDeleting}
            />
          ) : null}
        </View>
      </ScrollView>
      {isSaving || isDeleting ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <LoadingIndicator />
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
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
})
