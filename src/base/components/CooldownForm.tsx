import React from 'react'
import { View, Text } from 'react-native'
import Slider from '@react-native-community/slider'
import { TextField } from './TextField'
import { LightColors } from '../constants/theme'
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
      <View style={{ marginVertical: 10, width: '100%' }}>
        <Text style={{ marginBottom: 4, textAlign: 'center', color: LightColors.black }}>
          Durée : {value.duration} minutes
        </Text>
        <Slider
          value={value.duration}
          onValueChange={(newValue) => onChange({ ...value, duration: Math.round(newValue) })}
          minimumValue={0}
          maximumValue={60}
          step={1}
          minimumTrackTintColor={LightColors.primary}
        />
      </View>
      <TextField
        placeholder="Notes"
        value={value.notes}
        onChangeText={(text) => handleChange('notes', text)}
      />
    </View>
  )
}

