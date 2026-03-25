import React, { useEffect, useMemo, useState } from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton, TextField } from '../components'
import { Alert, ScrollView, View } from 'react-native'
import { TrainingBloc } from '../components/TrainingBloc'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { useRouter } from 'expo-router'
import { Portal, Dialog, Button, RadioButton, Text } from 'react-native-paper'
import { ExerciseType } from '../types/trainingTypes'
import { FormSlider } from '../components/FormSlider'

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

  const defaultBlocName = useMemo(() => `Bloc ${blocs.length + 1}`, [blocs.length])

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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingTop: 10,
          paddingBottom: 30,
          justifyContent: 'space-between',
        }}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: '100%', gap: 10 }}>
          <View style={{ width: '100%' }}>
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

          <View style={{ width: '100%', alignItems: 'center', gap: 20, marginBottom: 20 }}>
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

        <View style={{ width: '100%', alignItems: 'center', gap: 10 }}>
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
              }
            }}
          />
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={isBlocModalVisible} onDismiss={() => setIsBlocModalVisible(false)} style={{ marginTop: insets.top + 8 }}>
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
