import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LightColors } from '../constants/theme'

interface BottomNavBarProps {
  onHomePress?: () => void
  onCalendarPress?: () => void
  onSettingsPress?: () => void
}

export function BottomNavBar({ onHomePress, onCalendarPress, onSettingsPress }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onHomePress} style={styles.iconWrapper} activeOpacity={0.7}>
        <MaterialIcons name="home-filled" size={28} color={LightColors.white} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onCalendarPress} style={styles.iconWrapper} activeOpacity={0.7}>
        <MaterialIcons name="event-note" size={28} color={LightColors.white} />
      </TouchableOpacity>

      <TouchableOpacity onPress={onSettingsPress} style={styles.iconWrapper} activeOpacity={0.7}>
        <MaterialIcons name="settings" size={28} color={LightColors.white} />
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
    backgroundColor: LightColors.primary,
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
