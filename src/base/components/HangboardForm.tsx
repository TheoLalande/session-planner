import React from 'react'
import { View } from 'react-native'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
import { Ihangboard } from '../types/trainingTypes'

type HangboardFormProps = {
  value: Ihangboard
  onChange: (value: Ihangboard) => void
}

export function HangboardForm({ value, onChange }: HangboardFormProps) {
  const handleChange = (field: keyof Ihangboard, newValue: string) => {
    if (['id'].includes(field as string)) {
      const num = Number(newValue)
      onChange({ ...value, [field]: isNaN(num) ? 0 : num })
    } else {
      onChange({ ...value, [field]: newValue })
    }
  }

  return (
    <View style={{ width: '100%', paddingHorizontal: 30 }}>
      <TextField placeholder="Nom de l'exercice" value={value.title} onChangeText={(text) => handleChange('title', text)} />
      <TextField placeholder="Type de prise (holdType)" value={value.holdType} onChangeText={(text) => handleChange('holdType', text)} />
      <FormSlider
        label="Temps de repos"
        unit="s"
        value={value.restingTime}
        minimumValue={0}
        maximumValue={120}
        onChange={(v) => onChange({ ...value, restingTime: v })}
      />
      <FormSlider
        label="Temps de suspension"
        unit="s"
        value={value.holdTime}
        minimumValue={0}
        maximumValue={60}
        onChange={(v) => onChange({ ...value, holdTime: v })}
      />
      <FormSlider
        label="Nombre de séries"
        value={value.sets}
        minimumValue={0}
        maximumValue={20}
        onChange={(v) => onChange({ ...value, sets: v })}
      />
      <TextField placeholder="Notes" value={value.notes} onChangeText={(text) => handleChange('notes', text)} />
    </View>
  )
}
