import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LightColors } from '../constants/theme'
import { router } from 'expo-router'
import { haptic } from '../utils/haptics'
import { useTrainingStore } from '../store/trainingStore'

export function BottomNavBar() {
  const clearEditingTraining = useTrainingStore((state) => state.clearEditingTraining)

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={async () => {
          await haptic('tap')
          clearEditingTraining()
          router.push('/create-training')
        }}
        style={styles.iconWrapper}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add-circle-outline" size={28} color={LightColors.primary} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={async () => {
          await haptic('tap')
          router.push('/statistiques')
        }}
        style={styles.iconWrapper}
        activeOpacity={0.7}
      >
        <MaterialIcons name="bar-chart" size={28} color={LightColors.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={async () => {
          await haptic('tap')
          router.push('/settings')
        }}
        style={styles.iconWrapper}
        activeOpacity={0.7}
      >
        <MaterialIcons name="settings" size={28} color={LightColors.primary} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 14,
    marginHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: LightColors.white,
    borderWidth: 1,
    borderColor: '#E6ECF4',
    borderRadius: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },
})
