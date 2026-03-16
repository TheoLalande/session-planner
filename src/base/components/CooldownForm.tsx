import React from 'react'
import { View } from 'react-native'
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
      <FormSlider
        label="Durée"
        unit="seconds"
        enableUnitToggle
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

