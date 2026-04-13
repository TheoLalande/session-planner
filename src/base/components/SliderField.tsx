import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native'
import Slider from '@react-native-community/slider'
import { useAppTheme } from '../providers/themeProvider'

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
  valueUnit?: 'minutes' | 'seconds'
  onUnitChange?: (unit: 'minutes' | 'seconds') => void
  enableUnitToggle?: boolean
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
  enableUnitToggle,
  valueUnit,
  onUnitChange,
}: FormSliderProps) {
  const { colors } = useAppTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [internalUnit, setInternalUnit] = useState<'minutes' | 'seconds'>(() => {
    if (unit === 'seconds' || unit === 'secondes') return 'seconds'
    if (unit === 'minutes') return 'minutes'
    return 'minutes'
  })

  const unitMode = valueUnit ?? internalUnit

  const setUnitMode = (unitValue: 'minutes' | 'seconds') => {
    if (onUnitChange) {
      onUnitChange(unitValue)
    } else {
      setInternalUnit(unitValue)
    }
  }

  const effectiveUnit = useMemo(() => {
    if (!enableUnitToggle) {
      return unit ?? ''
    }

    if (unitMode === 'minutes') {
      return 'minutes'
    }
    if (unit === 'seconds' || unit === 'secondes') {
      return unit
    }
    return 'secondes'
  }, [unit, unitMode, enableUnitToggle])

  const isUnitControlled = valueUnit !== undefined
  const valueStoredInSeconds = Boolean(enableUnitToggle) && !isUnitControlled

  const displayValue = useMemo(() => {
    if (!valueStoredInSeconds) {
      return value
    }
    return unitMode === 'minutes' ? value / 60 : value
  }, [unitMode, value, valueStoredInSeconds])

  const displayMin = useMemo(() => {
    if (!valueStoredInSeconds) {
      return minimumValue
    }
    return unitMode === 'minutes' ? minimumValue / 60 : minimumValue
  }, [minimumValue, unitMode, valueStoredInSeconds])

  const displayMax = useMemo(() => {
    if (!valueStoredInSeconds) {
      return maximumValue
    }
    return unitMode === 'minutes' ? maximumValue / 60 : maximumValue
  }, [maximumValue, unitMode, valueStoredInSeconds])

  const sliderStep = useMemo(() => {
    const isSecondsMode = enableUnitToggle ? unitMode === 'seconds' : unit === 'seconds' || unit === 'secondes'
    if (isSecondsMode) {
      return step < 5 ? 5 : step
    }
    return step
  }, [enableUnitToggle, unitMode, unit, step])

  const fullLabel = effectiveUnit ? `${label} : ${Math.round(displayValue)} ${effectiveUnit}` : `${label} : ${Math.round(displayValue)}`

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, labelStyle]} numberOfLines={1}>
          {fullLabel}
        </Text>
        {enableUnitToggle && (
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setUnitMode('minutes')}
              style={[
                styles.toggleButton,
                unitMode === 'minutes' && styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  unitMode === 'minutes' && styles.toggleTextActive,
                ]}
              >
                min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setUnitMode('seconds')}
              style={[
                styles.toggleButton,
                unitMode === 'seconds' && styles.toggleButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  unitMode === 'seconds' && styles.toggleTextActive,
                ]}
              >
                sec
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Slider
        value={displayValue}
        onValueChange={(v) => {
          const rounded = Math.round(v)
          onChange(valueStoredInSeconds && unitMode === 'minutes' ? rounded * 60 : rounded)
        }}
        minimumValue={displayMin}
        maximumValue={displayMax}
        step={sliderStep}
        minimumTrackTintColor={colors.primary}
      />
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    flex: 1,
    marginRight: 8,
    textAlign: 'left',
    color: colors.black,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    overflow: 'hidden',
    marginBottom: 8,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.white,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize: 12,
    color: colors.black,
  },
  toggleTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
})
