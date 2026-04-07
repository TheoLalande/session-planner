import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, View, Keyboard, Alert, StyleSheet, TouchableOpacity, Text, Platform, KeyboardAvoidingView } from 'react-native'
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
import { createExerciseLibraryItem, fetchExerciseLibraryItemById, toTrainingExerciseFromLibrary, updateExerciseLibraryItem } from '../api/exerciseLibraryService'
import { fetchExerciseCategories } from '../api/exerciseCategoriesService'
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
    saveToLibrary?: string
    libraryExerciseId?: string
  }>()
  const blocId = params.blocId ? Number(params.blocId) : null
  const saveToLibrary = params.saveToLibrary === '1'
  const libraryExerciseId = params.libraryExerciseId ?? null
  const trainingId = params.trainingId ?? null
  const exerciseIndex = params.exerciseIndex ? Number(params.exerciseIndex) : null
  const isEditTrainingMode = params.mode === 'edit' && trainingId !== null && exerciseIndex !== null && blocId !== null
  const isEditBlocMode = params.mode === 'edit-bloc' && blocId !== null && exerciseIndex !== null
  const isEditLibraryMode = params.mode === 'edit-library' && blocId === null && !!libraryExerciseId
  const isLibraryCreationMode = blocId === null && !isEditTrainingMode && !isEditBlocMode && !isEditLibraryMode
  const isFromLibraryForBloc = params.mode === 'from-library' && blocId !== null && !!libraryExerciseId

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
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [libraryPictureBeforeEdit, setLibraryPictureBeforeEdit] = useState<string>('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])

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

  useEffect(() => {
    if ((!isFromLibraryForBloc && !isEditLibraryMode) || !libraryExerciseId) {
      return
    }
    let isMounted = true
    const loadTemplate = async () => {
      setIsLoadingTemplate(true)
      try {
        const item = await fetchExerciseLibraryItemById(libraryExerciseId)
        if (!isMounted || !item) {
          return
        }
        setLibraryPictureBeforeEdit(item.pictureUrl || '')
        const templated = toTrainingExerciseFromLibrary(item)
        const templatedData: any = {
          ...(templated.data as any),
          libraryExerciseId: item.id,
        }
        setSelectedCategoryId(String(templatedData.exerciseCategoryId ?? '').trim())
        setSelectedCategoryName(String(templatedData.exerciseCategoryName ?? '').trim())
        if (templated.type === 'hangboard') {
          setSelectedType('hangboard')
          setHangboardData(templatedData as Ihangboard)
        } else if (templated.type === 'climbing') {
          setSelectedType('climbing')
          setClimbingData(templatedData as IClimbing)
        } else if (templated.type === 'warmup') {
          setSelectedType('warmup')
          setWarmupData(templatedData as IWarmUp)
        } else if (templated.type === 'renforcement') {
          setSelectedType('renforcement')
          setRenforcementData(templatedData as IRenforcement)
        } else if (templated.type === 'stretching') {
          setSelectedType('stretching')
          setStretchingData(templatedData as IStretching)
        }
      } catch (e: any) {
        Alert.alert('Erreur', e?.message || 'Impossible de charger le template')
      } finally {
        if (isMounted) {
          setIsLoadingTemplate(false)
        }
      }
    }
    loadTemplate()
    return () => {
      isMounted = false
    }
  }, [isEditLibraryMode, isFromLibraryForBloc, libraryExerciseId])

  // Si le bloc impose un type (warmup/renforcement/stretching/climbing/hangboard),
  // on le sélectionne automatiquement et on ne montre plus le picker.
  useEffect(() => {
    if (!forcedType) {
      return
    }
    setSelectedType(forcedType)
  }, [forcedType])

  useEffect(() => {
    if (!isLibraryCreationMode && !isEditLibraryMode) {
      return
    }
    let isMounted = true
    const loadCategories = async () => {
      try {
        const data = await fetchExerciseCategories()
        if (!isMounted) {
          return
        }
        setCategories(data.map((item) => ({ id: item.id, name: item.name })))
      } catch {}
    }
    void loadCategories()
    return () => {
      isMounted = false
    }
  }, [isEditLibraryMode, isLibraryCreationMode])

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
    if (!selectedType) {
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

      const existingPicture =
        (currentExercise && (currentExercise.data as any).picture ? (currentExercise.data as any).picture : undefined) || libraryPictureBeforeEdit || undefined

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
      const blocIdValue = blocId ?? -1

      if (isEditLibraryMode && libraryExerciseId) {
        const libraryExercise: TrainingExercise = {
          ...exercise,
          data: {
            ...(exercise.data as any),
            exerciseCategoryId: selectedCategoryId || '',
            exerciseCategoryName: selectedCategoryName || '',
            mode: 'time',
            duration: 0,
            durationUnit: 'seconds',
            repetitions: 0,
            restingTime: 0,
            holdTime: 0,
          },
        } as TrainingExercise
        setIsSaving(true)
        try {
          await updateExerciseLibraryItem(libraryExerciseId, libraryExercise)
          Alert.alert('Succès', 'Exercice mis à jour')
        } catch (e: any) {
          Alert.alert('Erreur', e?.message || "Impossible de mettre à jour l'exercice")
          return
        } finally {
          setIsSaving(false)
        }
      } else if (isLibraryCreationMode) {
        const libraryExercise: TrainingExercise = {
          ...exercise,
          data: {
            ...(exercise.data as any),
            exerciseCategoryId: selectedCategoryId || '',
            exerciseCategoryName: selectedCategoryName || '',
            mode: 'time',
            duration: 0,
            durationUnit: 'seconds',
            repetitions: 0,
            restingTime: 0,
            holdTime: 0,
          },
        } as TrainingExercise
        setIsSaving(true)
        try {
          await createExerciseLibraryItem(libraryExercise)
          Alert.alert('Succès', 'Exercice enregistré dans ta librairie')
        } catch (e: any) {
          Alert.alert('Erreur', e?.message || "Impossible d'enregistrer l'exercice")
          return
        } finally {
          setIsSaving(false)
        }
      } else if (isCreateMode && isLeftRightExercise) {
        if (blocIdValue <= 0) {
          Alert.alert('Erreur', 'Bloc invalide')
          return
        }
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

        addExerciseToBloc(blocIdValue, leftExercise)
        addExerciseToBloc(blocIdValue, rightExercise)
        if (saveToLibrary) {
          setIsSaving(true)
          try {
            await createExerciseLibraryItem(leftExercise)
            await createExerciseLibraryItem(rightExercise)
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || "Impossible d'enregistrer dans la librairie")
            return
          } finally {
            setIsSaving(false)
          }
        }
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
        if (blocIdValue <= 0) {
          Alert.alert('Erreur', 'Bloc invalide')
          return
        }
        updateExerciseInBloc(blocIdValue, exerciseIndex, exercise)
      } else {
        if (blocIdValue <= 0) {
          Alert.alert('Erreur', 'Bloc invalide')
          return
        }
        addExerciseToBloc(blocIdValue, exercise)
        if (saveToLibrary) {
          setIsSaving(true)
          try {
            await createExerciseLibraryItem(exercise)
          } catch (e: any) {
            Alert.alert('Erreur', e?.message || "Impossible d'enregistrer dans la librairie")
            return
          } finally {
            setIsSaving(false)
          }
        }
      }
    }

    if (blocId !== null && !isEditTrainingMode) {
      router.replace('/create-training')
      return
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
      return <HangboardForm value={hangboardData} onChange={setHangboardData} hideTimingControls={isLibraryCreationMode || isEditLibraryMode} />
    }
    if (selectedType === 'climbing') {
      return <ClimbingForm value={climbingData} onChange={setClimbingData} hideTimingControls={isLibraryCreationMode || isEditLibraryMode} />
    }
    if (selectedType === 'warmup') {
      return <WarmupForm value={warmupData} onChange={setWarmupData} hideTimingControls={isLibraryCreationMode || isEditLibraryMode} />
    }
    if (selectedType === 'renforcement') {
      return <RenforcementForm value={renforcementData} onChange={setRenforcementData} hideTimingControls={isLibraryCreationMode || isEditLibraryMode} />
    }
    if (selectedType === 'stretching') {
      return <StretchingForm value={stretchingData} onChange={setStretchingData} hideTimingControls={isLibraryCreationMode || isEditLibraryMode} />
    }

    return null
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingBottom: 120,
            paddingTop: 20,
          }}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
        >
          {!forcedType && !isEditTrainingMode && !isEditBlocMode && !isFromLibraryForBloc && !isEditLibraryMode ? (
            <ExercicePicker selectedType={selectedType} onSelect={setSelectedType} />
          ) : null}
          {renderForm()}
          {isLibraryCreationMode || isEditLibraryMode ? (
            <View style={{ width: '100%', paddingHorizontal: 30, marginBottom: 12 }}>
              <Text style={{ color: colors.black, fontWeight: '700', marginBottom: 8 }}>Type d'exercice</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedCategoryId('')
                    setSelectedCategoryName('')
                  }}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selectedCategoryId === '' ? colors.primary : colors.cardBorder,
                    backgroundColor: selectedCategoryId === '' ? colors.primary : colors.white,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                  }}
                >
                  <Text style={{ color: selectedCategoryId === '' ? colors.white : colors.black, fontWeight: '700', fontSize: 12 }}>Sans type</Text>
                </TouchableOpacity>
                {categories.map((category) => {
                  const isActive = selectedCategoryId === category.id
                  return (
                    <TouchableOpacity
                      key={category.id}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedCategoryId(category.id)
                        setSelectedCategoryName(category.name)
                      }}
                      style={{
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                        backgroundColor: isActive ? colors.primary : colors.white,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                      }}
                    >
                      <Text style={{ color: isActive ? colors.white : colors.black, fontWeight: '700', fontSize: 12 }}>{category.name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          ) : null}
          <View style={{ width: '100%', paddingHorizontal: 30, justifyContent: 'center', alignItems: 'center', gap: 10 }}>
            <PrimaryButton
              title={isEditLibraryMode ? "Mettre à jour l'exercice" : blocId === null ? "Enregistrer l'exercice" : "Ajouter l'exercice"}
              onPress={handleNext}
              isClickable={!isSaving && !isDeleting && !isLoadingTemplate}
            />
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
      </KeyboardAvoidingView>
      {isSaving || isDeleting || isLoadingTemplate ? (
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
