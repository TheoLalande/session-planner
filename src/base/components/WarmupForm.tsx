import React from 'react'
import { View } from 'react-native'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
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
      <FormSlider
        label="Durée"
        unit="minutes"
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

