import React from 'react'
import { View } from 'react-native'
import { TextField } from './TextField'
import { Ihangboard } from '../types/trainingTypes'

type HangboardFormProps = {
  value: Ihangboard
  onChange: (value: Ihangboard) => void
}

export function HangboardForm({ value, onChange }: HangboardFormProps) {
  const handleChange = (field: keyof Ihangboard, newValue: string) => {
    // cast number fields
    if (['restingTime', 'holdTime', 'sets', 'id'].includes(field as string)) {
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
      <TextField
        placeholder="Temps de repos (secondes)"
        value={String(value.restingTime || '')}
        onChangeText={(text) => handleChange('restingTime', text)}
        type="number"
      />
      <TextField
        placeholder="Temps de suspension (secondes)"
        value={String(value.holdTime || '')}
        onChangeText={(text) => handleChange('holdTime', text)}
        type="number"
      />
      <TextField placeholder="Nombre de séries" value={String(value.sets || '')} onChangeText={(text) => handleChange('sets', text)} type="number" />
      <TextField placeholder="Notes" value={value.notes} onChangeText={(text) => handleChange('notes', text)} />
    </View>
  )
}
