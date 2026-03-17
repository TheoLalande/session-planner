import { StyleSheet } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { Fonts, LightColors } from '../constants/theme'
import { haptic } from '../utils/haptics'

interface PrimaryButtonProps {
  title: string
  onPress?: () => void
  isClickable?: boolean
  color?: string
  borderColor?: string
  textColor?: string
}

export function PrimaryButton({
  title,
  onPress,
  isClickable = true,
  color = LightColors.primary,
  borderColor = LightColors.primary,
  textColor = LightColors.white,
}: PrimaryButtonProps) {
  const buttonStyle = [styles.button, !isClickable && styles.buttonDisabled]

  return (
    <Button
      style={[buttonStyle, { backgroundColor: color, borderColor: borderColor, borderWidth: 1 }]}
      onPress={
        isClickable
          ? async () => {
              await haptic('tap')
              onPress?.()
            }
          : undefined
      }
      disabled={!isClickable}
    >
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 5,
    borderRadius: 30,
    marginHorizontal: 30,
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: LightColors.grey,
  },
  title: {
    textAlign: 'center',
    color: LightColors.white,
    alignSelf: 'center',
    fontFamily: Fonts.poppins.medium,
  },
})
