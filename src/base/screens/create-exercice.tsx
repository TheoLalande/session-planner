import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Keyboard, Alert, StyleSheet } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { ExerciceTypes, ExerciseType, Ihangboard, IClimbing, IWarmUp, IRenforcement, IStretching, TrainingExercise } from '../types/trainingTypes'
import { PrimaryButton } from '../components/PrimaryButton'
import { ExercicePicker } from '../components/ExercicePicker'
import { HangboardForm } from '../components/HangboardForm'
import { ClimbingForm } from '../components/ClimbingForm'
import { WarmupForm } from '../components/WarmupForm'
import { RenforcementForm } from '../components/RenforcementForm'
import { StretchingForm } from '../components/StretchingForm'
import { useTrainingStore } from '../store/trainingStore'
import { getSession } from '../api/authService'
import { getSupabaseClient } from '../api/supabaseClient'
import LoadingIndicator from '../components/LoadingIndicator'
import * as ImageManipulator from 'expo-image-manipulator'
import { useAppTheme } from '../providers/themeProvider'

export default function index() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
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
    climbingType: 'bloc',
    routeProfile: 'verticale',
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
    leftRight: false,
  })

  const [renforcementData, setRenforcementData] = useState<IRenforcement>({
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
    leftRight: false,
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
    leftRight: false,
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
    } else if (currentExercise.type === 'renforcement') {
      setRenforcementData(currentExercise.data)
    } else if (currentExercise.type === 'stretching') {
      setStretchingData(currentExercise.data)
    }
  }, [currentExercise, isEditTrainingMode, isEditBlocMode])

  // Si le bloc impose un type (warmup/renforcement/stretching/climbing/hangboard),
  // on le sélectionne automatiquement et on ne montre plus le picker.
  useEffect(() => {
    if (!forcedType) {
      return
    }
    setSelectedType(forcedType)
  }, [forcedType])

  const STORAGE_BUCKET = 'exercice-images'
  const SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7
  const isLocalUri = (uri: string) => !/^https?:\/\//i.test(uri)

  const toSafeFileBase = (value: string) => {
    const trimmed = (value ?? '').trim()
    const base = trimmed.length > 0 ? trimmed : 'image'
    const normalized = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const safe = normalized.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_')
    return safe.slice(0, 60) || 'image'
  }

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

  const uploadExercisePictureToStorage = async (localUri: string, userId: string, desiredBaseName: string): Promise<string> => {
    const supabase = getSupabaseClient()
    const manipulated = await ImageManipulator.manipulateAsync(localUri, [{ resize: { width: 1280 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    })

    const response = await fetch(manipulated.uri)
    const arrayBuffer = await response.arrayBuffer()
    const contentType = 'image/jpeg'

    const safeBaseNoExt = toSafeFileBase(desiredBaseName)
    const objectPath = `users/${userId}/exercises/${Date.now()}-${safeBaseNoExt}.jpg`

    const fileBytes = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, fileBytes as any, { contentType, upsert: false })
    if (uploadError) throw new Error(uploadError.message)

    const { data: signedData, error: signedError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(objectPath, SIGNED_URL_EXPIRES_IN_SECONDS)
    if (signedError || !signedData?.signedUrl) throw new Error(signedError?.message ?? 'Impossible de signer l image')
    return signedData.signedUrl
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
    } else if (selectedType === 'renforcement') {
      exercise = { type: 'renforcement', data: renforcementData }
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

            const desiredBaseName =
              selectedType === 'hangboard' || selectedType === 'climbing'
                ? String((dataAny?.title ?? '').trim() || 'exercice')
                : String((dataAny?.exerciceType ?? dataAny?.title ?? '').trim() || 'exercice')

            const uploadedUrl = await uploadExercisePictureToStorage(pictureValue, userId, desiredBaseName)
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

      const isCreateMode = !isEditTrainingMode && !isEditBlocMode
      const isLeftRightExercise =
        (selectedType === 'warmup' || selectedType === 'renforcement' || selectedType === 'stretching') && Boolean((exercise.data as IWarmUp).leftRight)

      if (isCreateMode && isLeftRightExercise) {
        const baseData = exercise.data as IWarmUp
        const baseLabel = (baseData.exerciceType || baseData.title || '').trim()
        const leftLabel = baseLabel ? `${baseLabel} gauche` : 'gauche'
        const rightLabel = baseLabel ? `${baseLabel} droite` : 'droite'

        const leftExercise: TrainingExercise = {
          type: selectedType as 'warmup' | 'renforcement' | 'stretching',
          data: { ...baseData, exerciceType: leftLabel, title: leftLabel, leftRight: false },
        }
        const rightExercise: TrainingExercise = {
          type: selectedType as 'warmup' | 'renforcement' | 'stretching',
          data: { ...baseData, exerciceType: rightLabel, title: rightLabel, leftRight: false },
        }

        addExerciseToBloc(blocId, leftExercise)
        addExerciseToBloc(blocId, rightExercise)
      } else if (isEditTrainingMode && trainingId !== null && exerciseIndex !== null) {
        setIsSaving(true)
        try {
          await updateExerciseInTraining(trainingId, blocId, exerciseIndex, exercise)
        } catch (e: any) {
          Alert.alert('Erreur', e?.message || 'Impossible de mettre a jour l exercice')
          return
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
    if (selectedType === 'renforcement') {
      return <RenforcementForm value={renforcementData} onChange={setRenforcementData} />
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
          paddingTop: 20,
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
              color={colors.primary}
              borderColor={colors.primary}
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

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.overlayLight,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 50,
    },
  })
