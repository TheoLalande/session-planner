import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton, TextField } from '../components'
import { Alert, ScrollView, View, StyleSheet } from 'react-native'
import { TrainingBloc } from '../components/TrainingBloc'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { useRouter } from 'expo-router'
import { Portal, Dialog, Button, RadioButton, Text } from 'react-native-paper'
import { ExerciseType } from '../types/trainingTypes'
import { FormSlider } from '../components/FormSlider'
import LoadingIndicator from '../components/LoadingIndicator'

export default function index() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [transitionSecondsBetweenTimers, setTransitionSecondsBetweenTimers] = useState(5)
  const router = useRouter()
  const [isBlocModalVisible, setIsBlocModalVisible] = useState(false)
  const [blocTitle, setBlocTitle] = useState('')
  const [blocDescription, setBlocDescription] = useState('')
  const [blocType, setBlocType] = useState<ExerciseType>('warmup')
  const insets = useSafeAreaInsets()

  const blocs = useTrainingStore((state) => state.blocs)
  const editingTrainingId = useTrainingStore((state) => state.editingTrainingId)
  const trainings = useTrainingStore((state) => state.trainings)
  const addBlocWithMeta = useTrainingStore((state) => state.addBlocWithMeta)
  const setEditingBlocId = useTrainingStore((state) => state.setEditingBlocId)
  const removeBloc = useTrainingStore((state) => state.removeBloc)
  const saveTraining = useTrainingStore((state) => state.saveTraining)
  const updateTraining = useTrainingStore((state) => state.updateTraining)
  const loadTrainings = useTrainingStore((state) => state.loadTrainings)
  const isLoadingTrainings = useTrainingStore((state) => state.isLoadingTrainings)

  const defaultBlocName = useMemo(() => `Bloc ${blocs.length + 1}`, [blocs.length])

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadTrainings()
  }, [loadTrainings])

  useEffect(() => {
    if (!editingTrainingId) {
      return
    }
    const training = trainings.find((t) => t.id === editingTrainingId)
    if (!training) {
      return
    }
    setTitle(training.title)
    setDescription(training.description)
    setTransitionSecondsBetweenTimers(training.transitionSecondsBetweenTimers ?? 5)
  }, [editingTrainingId, trainings])

  return isLoadingTrainings ? (
    <SafeAreaView style={styles.loadingScreen}>
      <LoadingIndicator />
    </SafeAreaView>
  ) : (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.formCard}>
            <TextField placeholder="Titre de l'entrainement" type="text" value={title} onChangeText={setTitle} />
            <TextField placeholder="Description de l'entrainement" type="text" value={description} onChangeText={setDescription} />
            <FormSlider
              label="Temps entre deux timers"
              value={transitionSecondsBetweenTimers}
              minimumValue={0}
              maximumValue={30}
              step={1}
              onChange={setTransitionSecondsBetweenTimers}
              unit="secondes"
              valueUnit="seconds"
            />
          </View>

          <View style={styles.blocsSection}>
            {blocs.map((bloc) => (
              <TrainingBloc
                key={bloc.id}
                blocId={bloc.id}
                title={bloc.title}
                onPressAddExercise={() => setEditingBlocId(bloc.id)}
                onDeleteBloc={() => removeBloc(bloc.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.footerActions}>
          <PrimaryButton
            title="Ajouter un bloc d'exercices"
            color={'transparent'}
            borderColor={LightColors.primary}
            textColor={LightColors.primary}
            onPress={() => {
              setBlocTitle(defaultBlocName)
              setBlocDescription('')
              setBlocType('warmup')
              setIsBlocModalVisible(true)
            }}
          />
          <PrimaryButton
            title={editingTrainingId ? 'Mettre à jour' : 'Enregistrer'}
            onPress={async () => {
              if (!title.trim()) return
              setIsSaving(true)
              try {
                if (editingTrainingId) {
                  await updateTraining(title.trim(), description.trim(), transitionSecondsBetweenTimers)
                } else {
                  await saveTraining(title.trim(), description.trim(), transitionSecondsBetweenTimers)
                }
                setTitle('')
                setDescription('')
                router.replace('/home')
              } catch (e) {
                const message = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : "Erreur d'enregistrement"
                Alert.alert('Erreur', message)
              } finally {
                setIsSaving(false)
              }
            }}
            isClickable={!isSaving}
          />
        </View>
      </ScrollView>

      {isSaving ? (
        <View pointerEvents="none" style={styles.loadingOverlay}>
          <LoadingIndicator />
        </View>
      ) : null}

      <Portal>
        <Dialog visible={isBlocModalVisible} onDismiss={() => setIsBlocModalVisible(false)} style={[styles.dialog, { marginTop: insets.top + 8 }]}>
          <Dialog.Title>Nouveau bloc</Dialog.Title>
          <Dialog.Content>
            <TextField placeholder="Nom du bloc" type="text" value={blocTitle} onChangeText={setBlocTitle} />
            <TextField placeholder="Description (optionnel)" type="text" value={blocDescription} onChangeText={setBlocDescription} />

            <View style={{ marginTop: 10 }}>
              <Text style={{ marginBottom: 6 }}>Type de bloc</Text>
              <RadioButton.Group onValueChange={(value) => setBlocType(value as ExerciseType)} value={blocType}>
                <RadioButton.Item label="Warmup" value="warmup" />
                <RadioButton.Item label="Cooldown" value="cooldown" />
                <RadioButton.Item label="Stretching" value="stretching" />
                <RadioButton.Item label="Climbing" value="climbing" />
                <RadioButton.Item label="Hangboard" value="hangboard" />
              </RadioButton.Group>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsBlocModalVisible(false)}>Annuler</Button>
            <Button
              onPress={() => {
                const trimmed = blocTitle.trim()
                if (!trimmed) {
                  return
                }
                addBlocWithMeta(trimmed, blocDescription, blocType)
                setIsBlocModalVisible(false)
              }}
            >
              Ajouter
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  headerSection: {
    width: '100%',
    gap: 14,
  },
  formCard: {
    width: '100%',
    backgroundColor: LightColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EBF3',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  blocsSection: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    marginBottom: 8,
  },
  footerActions: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  dialog: {
    borderRadius: 16,
    backgroundColor: LightColors.white,
  },
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
