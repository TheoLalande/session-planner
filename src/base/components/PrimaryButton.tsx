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
      mode="contained"
      contentStyle={styles.content}
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
    borderRadius: 14,
    marginHorizontal: 20,
    width: '100%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  content: {
    minHeight: 52,
    paddingVertical: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CDD5DF',
    borderColor: '#CDD5DF',
    shadowOpacity: 0,
    elevation: 0,
  },
  title: {
    textAlign: 'center',
    color: LightColors.white,
    alignSelf: 'center',
    fontFamily: Fonts.poppins.medium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
})
