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
    marginBottom: 10,
    marginHorizontal: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 0,
    backgroundColor: LightColors.white,
    borderWidth: 1,
    borderColor: LightColors.primary,
    borderRadius: 25,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
