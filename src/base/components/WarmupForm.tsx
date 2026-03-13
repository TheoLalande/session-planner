import React from 'react'
import { View } from 'react-native'
import { TextField } from './TextField'
import { IWarmUp } from '../types/trainingTypes'

type WarmupFormProps = {
  value: IWarmUp
  onChange: (value: IWarmUp) => void
}

export function WarmupForm({ value, onChange }: WarmupFormProps) {
  const handleChange = (field: keyof IWarmUp, newValue: string) => {
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
        placeholder="Nom de l'échauffement"
        value={value.title}
        onChangeText={(text) => handleChange('title', text)}
      />
      <TextField
        placeholder="Type d'exercice"
        value={value.exerciceType}
        onChangeText={(text) => handleChange('exerciceType', text)}
      />
      <TextField
        placeholder="Durée (minutes)"
        value={String(value.duration || '')}
        onChangeText={(text) => handleChange('duration', text)}
        type="number"
      />
      <TextField
        placeholder="Notes"
        value={value.notes}
        onChangeText={(text) => handleChange('notes', text)}
      />
    </View>
  )
}

