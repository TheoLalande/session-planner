import * as Haptics from 'expo-haptics'

export type HapticPreset = 'tap' | 'success' | 'error'

export async function haptic(preset: HapticPreset = 'tap') {
  try {
    if (preset === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      return
    }
    if (preset === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      return
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  } catch {
    // noop: device may not support haptics
  }
}

