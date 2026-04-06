import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { TextField } from './TextField'
import { FormSlider } from './FormSlider'
import { IClimbing } from '../types/trainingTypes'
import { useAppTheme } from '../providers/themeProvider'

type ClimbingFormProps = {
  value: IClimbing
  onChange: (value: IClimbing) => void
  hideTimingControls?: boolean
}

export function ClimbingForm({ value, onChange, hideTimingControls = false }: ClimbingFormProps) {
  const { colors } = useAppTheme()
  const climbingTypeOptions: Array<NonNullable<IClimbing['climbingType']>> = ['bloc', 'voie', 'grande voie']
  const routeProfileOptions: Array<NonNullable<IClimbing['routeProfile']>> = ['dalle', 'verticale', 'devers', 'toit']

  const handleChange = (field: keyof IClimbing, newValue: string) => {
    if (['id'].includes(field as string)) {
      const num = Number(newValue)
      onChange({ ...value, [field]: isNaN(num) ? 0 : num })
    } else {
      onChange({ ...value, [field]: newValue })
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionLabel, { color: colors.grey }]}>Type d'escalade</Text>
      <View style={styles.segmentedRow}>
        {climbingTypeOptions.map((type) => {
          const isActive = (value.climbingType ?? 'bloc') === type
          return (
            <TouchableOpacity
              key={type}
              activeOpacity={0.7}
              onPress={() => onChange({ ...value, climbingType: type })}
              style={[
                styles.segmentButton,
                {
                  backgroundColor: isActive ? colors.primary : colors.white,
                  borderColor: isActive ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.segmentText, { color: isActive ? colors.white : colors.black }]}>{type}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.grey }]}>Profil de voie</Text>
      <View style={styles.segmentedWrapRow}>
        {routeProfileOptions.map((profile) => {
          const isActive = (value.routeProfile ?? 'verticale') === profile
          return (
            <TouchableOpacity
              key={profile}
              activeOpacity={0.7}
              onPress={() => onChange({ ...value, routeProfile: profile })}
              style={[
                styles.segmentButtonWrap,
                {
                  backgroundColor: isActive ? colors.primary : colors.white,
                  borderColor: isActive ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.segmentText, { color: isActive ? colors.white : colors.black }]}>{profile}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <TextField placeholder="Cotation (grade)" value={value.grade} onChangeText={(text) => handleChange('grade', text)} />
      {!hideTimingControls ? (
        <FormSlider
          label="Temps de repos"
          unit="seconds"
          enableUnitToggle
          value={value.restingTime}
          minimumValue={0}
          maximumValue={20 * 60}
          onChange={(v) => onChange({ ...value, restingTime: v })}
        />
      ) : null}
      <FormSlider
        label="Nombre de tentatives"
        value={value.attempts}
        minimumValue={0}
        maximumValue={20}
        onChange={(v) => onChange({ ...value, attempts: v })}
      />
      <TextField placeholder="Notes" value={value.notes} onChangeText={(text) => handleChange('notes', text)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 30,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  segmentedWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonWrap: {
    minWidth: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
})
