import React from 'react'
import { View, Text } from 'react-native'
import Slider from '@react-native-community/slider'
import { TextField } from './TextField'
import { LightColors } from '../constants/theme'
import { IClimbing } from '../types/trainingTypes'

type ClimbingFormProps = {
  value: IClimbing
  onChange: (value: IClimbing) => void
}

const sliderBlockStyle = { marginVertical: 10, width: '100%' as const }
const labelStyle = { marginBottom: 4, textAlign: 'center' as const, color: LightColors.black }

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
      <View style={sliderBlockStyle}>
        <Text style={labelStyle}>Temps de repos : {value.restingTime} s</Text>
        <Slider
          value={value.restingTime}
          onValueChange={(v) => onChange({ ...value, restingTime: Math.round(v) })}
          minimumValue={0}
          maximumValue={300}
          step={1}
          minimumTrackTintColor={LightColors.primary}
        />
      </View>
      <View style={sliderBlockStyle}>
        <Text style={labelStyle}>Nombre de tentatives : {value.attempts}</Text>
        <Slider
          value={value.attempts}
          onValueChange={(v) => onChange({ ...value, attempts: Math.round(v) })}
          minimumValue={0}
          maximumValue={20}
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

