import React from 'react'
import { View, Image, TouchableOpacity, Text } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
import { IRenforcement } from '../types/trainingTypes'
import { useAppTheme } from '../providers/themeProvider'
import { CustomCheckbox } from './CustomCheckbox'

type RenforcementFormProps = {
  value: IRenforcement
  onChange: (value: IRenforcement) => void
}

export function RenforcementForm({ value, onChange }: RenforcementFormProps) {
  const { colors } = useAppTheme()
  const handleChange = (field: keyof IRenforcement, newValue: string) => {
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
        placeholder="Nom du renforcement"
        value={value.title}
        onChangeText={(text) => handleChange('title', text)}
      />
      <TextField
        placeholder="Type d'exercice"
        value={value.exerciceType}
        onChangeText={(text) => handleChange('exerciceType', text)}
      />
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
            borderColor: colors.neutralBorder,
            padding: 10,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: colors.mutedText }}>
            {value.picture ? "Changer l'image" : "Choisir une image depuis la galerie"}
          </Text>
        </View>
      </TouchableOpacity>
      {value.picture ? (
        <Image
          source={{ uri: value.picture }}
          style={{ width: '100%', height: 120, borderRadius: 8, marginBottom: 10 }}
          resizeMode="cover"
        />
      ) : null}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <CustomCheckbox
            checked={value.leftRight}
            onPress={() => onChange({ ...value, leftRight: !value.leftRight })}
            borderColor={colors.neutralBorder}
            checkedColor={colors.primary}
          />
          <Text style={{ color: colors.black }}>Gauche / droite</Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.neutralBorder,
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
              backgroundColor: value.mode === 'time' ? colors.primary : colors.white,
            }}
          >
            <Text style={{ color: value.mode === 'time' ? colors.white : colors.black, fontWeight: '600' }}>Temps</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onChange({ ...value, mode: 'reps' })}
            style={{
              flex: 1,
              paddingVertical: 6,
              alignItems: 'center',
              backgroundColor: value.mode === 'reps' ? colors.primary : colors.white,
            }}
          >
            <Text style={{ color: value.mode === 'reps' ? colors.white : colors.black, fontWeight: '600' }}>Répétitions</Text>
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
      <TextField
        placeholder="Notes"
        value={value.notes}
        onChangeText={(text) => handleChange('notes', text)}
      />
    </View>
  )
}
