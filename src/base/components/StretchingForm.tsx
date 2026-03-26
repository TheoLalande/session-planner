import React from 'react'
import { View, Image, TouchableOpacity, Text } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
import { IStretching } from '../types/trainingTypes'
import { LightColors } from '../constants/theme'

type StretchingFormProps = {
  value: IStretching
  onChange: (value: IStretching) => void
}

export function StretchingForm({ value, onChange }: StretchingFormProps) {
  const handleChange = (field: keyof IStretching, newValue: string) => {
    if (['duration', 'id'].includes(field as string)) {
      const num = Number(newValue)
      onChange({ ...value, [field]: isNaN(num) ? 0 : num })
    } else {
      onChange({ ...value, [field]: newValue })
    }
  }

  return (
    <View style={{ width: '100%', paddingHorizontal: 30 }}>
      <TextField placeholder="Type d'exercice" value={value.exerciceType} onChangeText={(text) => handleChange('exerciceType', text)} />
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
          })
          if (!result.canceled && result.assets && result.assets[0]?.uri) {
            onChange({ ...value, picture: result.assets[0].uri })
          }
        }}
        style={{ marginTop: 10, marginBottom: 10 }}
      >
        <View
          style={{
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: LightColors.neutralBorder,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: LightColors.mutedText }}>{value.picture ? "Changer l'image" : 'Choisir une image depuis la galerie'}</Text>
        </View>
      </TouchableOpacity>
      {value.picture ? (
        <Image source={{ uri: value.picture }} style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 10 }} resizeMode="cover" />
      ) : null}
      <View style={{ marginBottom: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: LightColors.neutralBorder,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onChange({ ...value, mode: 'time' })}
            style={{
              flex: 1,
              paddingVertical: 6,
              alignItems: 'center',
              backgroundColor: value.mode === 'time' ? LightColors.primary : LightColors.white,
            }}
          >
            <Text style={{ color: value.mode === 'time' ? LightColors.white : LightColors.black, fontWeight: '600' }}>Temps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onChange({ ...value, mode: 'reps' })}
            style={{
              flex: 1,
              paddingVertical: 6,
              alignItems: 'center',
              backgroundColor: value.mode === 'reps' ? LightColors.primary : LightColors.white,
            }}
          >
            <Text style={{ color: value.mode === 'reps' ? LightColors.white : LightColors.black, fontWeight: '600' }}>Répétitions</Text>
          </TouchableOpacity>
        </View>

        {value.mode === 'time' ? (
          <FormSlider
            label="Durée"
            unit="seconds"
            enableUnitToggle
            valueUnit={value.durationUnit}
            onUnitChange={(unitMode) => onChange({ ...value, durationUnit: unitMode })}
            value={value.duration}
            minimumValue={0}
            maximumValue={60}
            onChange={(v) => onChange({ ...value, duration: v })}
          />
        ) : (
          <FormSlider
            label="Répétitions"
            value={value.repetitions}
            minimumValue={0}
            maximumValue={50}
            step={1}
            onChange={(v) => onChange({ ...value, repetitions: v })}
          />
        )}
      </View>
      <TextField placeholder="Notes" value={value.notes} onChangeText={(text) => handleChange('notes', text)} />
    </View>
  )
}
