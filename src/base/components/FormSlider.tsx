import React from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'
import Slider from '@react-native-community/slider'
import { LightColors } from '../constants/theme'

type FormSliderProps = {
  label: string
  value: number
  minimumValue: number
  maximumValue: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  containerStyle?: ViewStyle
  labelStyle?: TextStyle
}

export function FormSlider({
  label,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  unit,
  onChange,
  containerStyle,
  labelStyle,
}: FormSliderProps) {
  const fullLabel = unit ? `${label} : ${value} ${unit}` : `${label} : ${value}`

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{fullLabel}</Text>
      <Slider
        value={value}
        onValueChange={(v) => onChange(Math.round(v))}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor={LightColors.primary}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    marginBottom: 4,
    textAlign: 'center',
    color: LightColors.black,
  },
})

