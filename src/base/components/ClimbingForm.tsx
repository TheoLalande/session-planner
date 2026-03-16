import React from 'react'
import { View } from 'react-native'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
import { IClimbing } from '../types/trainingTypes'

type ClimbingFormProps = {
  value: IClimbing
  onChange: (value: IClimbing) => void
}

export function ClimbingForm({ value, onChange }: ClimbingFormProps) {
  const handleChange = (field: keyof IClimbing, newValue: string) => {
    if (['id'].includes(field as string)) {
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
      <FormSlider
        label="Temps de repos"
        unit="s"
        value={value.restingTime}
        minimumValue={0}
        maximumValue={300}
        onChange={(v) => onChange({ ...value, restingTime: v })}
      />
      <FormSlider
        label="Nombre de tentatives"
        value={value.attempts}
        minimumValue={0}
        maximumValue={20}
        onChange={(v) => onChange({ ...value, attempts: v })}
      />
      <TextField
        placeholder="Notes"
        value={value.notes}
        onChangeText={(text) => handleChange('notes', text)}
      />
    </View>
  )
}

