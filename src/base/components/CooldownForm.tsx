import React from 'react'
import { View, Image, TouchableOpacity, Text } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
import { ICooldown } from '../types/trainingTypes'

type CooldownFormProps = {
  value: ICooldown
  onChange: (value: ICooldown) => void
}

export function CooldownForm({ value, onChange }: CooldownFormProps) {
  const handleChange = (field: keyof ICooldown, newValue: string) => {
    if (['duration', 'id'].includes(field as string)) {
      const num = Number(newValue)
      onChange({ ...value, [field]: isNaN(num) ? 0 : num })
    } else {
      onChange({ ...value, [field]: newValue })
    }
  }

  return (
    <View style={{ width: '100%', paddingHorizontal: 30 }}>
      <TextField
        placeholder="Nom du retour au calme"
        value={value.title}
        onChangeText={(text) => handleChange('title', text)}
      />
      <TextField
        placeholder="Type d'exercice"
        value={value.exerciceType}
        onChangeText={(text) => handleChange('exerciceType', text)}
      />
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          })
          if (!result.canceled && result.assets && result.assets[0]?.uri) {
            onChange({ ...value, picture: result.assets[0].uri })
          }
        }}
        style={{ marginTop: 10, marginBottom: 10 }}
      >
        <View
          style={{
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: '#ccc',
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#555' }}>
            {value.picture ? "Changer l'image" : "Choisir une image depuis la galerie"}
          </Text>
        </View>
      </TouchableOpacity>
      {value.picture ? (
        <Image
          source={{ uri: value.picture }}
          style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 10 }}
          resizeMode="cover"
        />
      ) : null}
      <FormSlider
        label="Durée"
        unit="seconds"
        enableUnitToggle
        valueUnit={value.durationUnit}
        onUnitChange={(unitMode) => onChange({ ...value, durationUnit: unitMode })}
        value={value.duration}
        minimumValue={0}
        maximumValue={60}
        onChange={(v) => onChange({ ...value, duration: v })}
      />
      <TextField
        placeholder="Notes"
        value={value.notes}
        onChangeText={(text) => handleChange('notes', text)}
      />
    </View>
  )
}

