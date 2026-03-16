import React from 'react'
import { View, Text } from 'react-native'
import Slider from '@react-native-community/slider'
import { TextField } from './TextField'
import { LightColors } from '../constants/theme'
import { Ihangboard } from '../types/trainingTypes'

type HangboardFormProps = {
  value: Ihangboard
  onChange: (value: Ihangboard) => void
}

const sliderBlockStyle = { marginVertical: 10, width: '100%' as const }
const labelStyle = { marginBottom: 4, textAlign: 'center' as const, color: LightColors.black }

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
      <View style={sliderBlockStyle}>
        <Text style={labelStyle}>Temps de repos : {value.restingTime} s</Text>
        <Slider
          value={value.restingTime}
          onValueChange={(v) => onChange({ ...value, restingTime: Math.round(v) })}
          minimumValue={0}
          maximumValue={120}
          step={1}
          minimumTrackTintColor={LightColors.primary}
        />
      </View>
      <View style={sliderBlockStyle}>
        <Text style={labelStyle}>Temps de suspension : {value.holdTime} s</Text>
        <Slider
          value={value.holdTime}
          onValueChange={(v) => onChange({ ...value, holdTime: Math.round(v) })}
          minimumValue={0}
          maximumValue={60}
          step={1}
          minimumTrackTintColor={LightColors.primary}
        />
      </View>
      <View style={sliderBlockStyle}>
        <Text style={labelStyle}>Nombre de séries : {value.sets}</Text>
        <Slider
          value={value.sets}
          onValueChange={(v) => onChange({ ...value, sets: Math.round(v) })}
          minimumValue={0}
          maximumValue={20}
          step={1}
          minimumTrackTintColor={LightColors.primary}
        />
      </View>
      <TextField placeholder="Notes" value={value.notes} onChangeText={(text) => handleChange('notes', text)} />
    </View>
  )
}
