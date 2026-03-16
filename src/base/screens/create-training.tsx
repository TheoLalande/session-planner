import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton, TextField } from '../components'
import { ScrollView, View } from 'react-native'
import { TrainingBloc } from '../components/TrainingBloc'
import { useTrainingStore } from '../store/trainingStore'
import { LightColors } from '../constants/theme'
import { useRouter } from 'expo-router'

export default function index() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const router = useRouter()

  const blocs = useTrainingStore((state) => state.blocs)
  const addBloc = useTrainingStore((state) => state.addBloc)
  const setEditingBlocId = useTrainingStore((state) => state.setEditingBlocId)
  const removeBloc = useTrainingStore((state) => state.removeBloc)
  const saveTraining = useTrainingStore((state) => state.saveTraining)

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingTop: 0,
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
          </View>

          <View style={{ width: '100%', alignItems: 'center', gap: 20 }}>
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
              addBloc(`Bloc ${blocs.length + 1}`)
            }}
          />
          <PrimaryButton
            title="Enregistrer"
            onPress={() => {
              if (!title.trim()) return
              saveTraining(title.trim(), description.trim())
              setTitle('')
              setDescription('')
              router.replace('/home')
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
