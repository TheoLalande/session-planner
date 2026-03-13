import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PrimaryButton, TextField } from '../components'
import { View } from 'react-native'
import { router } from 'expo-router'

export default function index() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingTop: 0,
          paddingBottom: 30,
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            width: '100%',
            paddingBottom: 30,
          }}
        >
          <TextField placeholder="Titre de l'entrainement" type="text" value={title} onChangeText={setTitle} />
          <TextField placeholder="Description de l'entrainement" type="text" value={description} onChangeText={setDescription} />
          <PrimaryButton
            title="Ajouter un exercice"
            onPress={() => {
              router.push('/create-exercice')
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  )
}
