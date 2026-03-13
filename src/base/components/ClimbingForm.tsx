import React from 'react'
import { View } from 'react-native'
import { TextField } from './TextField'
import { IClimbing } from '../types/trainingTypes'

type ClimbingFormProps = {
  value: IClimbing
  onChange: (value: IClimbing) => void
}

export function ClimbingForm({ value, onChange }: ClimbingFormProps) {
  const handleChange = (field: keyof IClimbing, newValue: string) => {
    if (['restingTime', 'attempts', 'id'].includes(field as string)) {
      const num = Number(newValue)
      onChange({ ...value, [field]: isNaN(num) ? 0 : num })
    } else {
      onChange({ ...value, [field]: newValue })
    }
  }

  return (
    <View style={{ width: '100%', paddingHorizontal: 30 }}>
      <TextField
        placeholder="Nom de l'exercice"
        value={value.title}
        onChangeText={(text) => handleChange('title', text)}
      />
      <TextField
        placeholder="Cotation (grade)"
        value={value.grade}
        onChangeText={(text) => handleChange('grade', text)}
      />
      <TextField
        placeholder="Temps de repos (secondes)"
        value={String(value.restingTime || '')}
        onChangeText={(text) => handleChange('restingTime', text)}
        type="number"
      />
      <TextField
        placeholder="Nombre de tentatives"
        value={String(value.attempts || '')}
        onChangeText={(text) => handleChange('attempts', text)}
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

