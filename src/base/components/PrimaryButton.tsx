import { StyleSheet } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { Fonts } from '../constants/theme'
import { useAppTheme } from '../providers/themeProvider'
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
  color,
  borderColor,
  textColor,
}: PrimaryButtonProps) {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const resolvedColor = color ?? colors.primary
  const resolvedBorderColor = borderColor ?? colors.primary
  const resolvedTextColor = textColor ?? colors.white
  const buttonStyle = [styles.button, !isClickable && styles.buttonDisabled]

  return (
    <Button
      mode="contained"
      contentStyle={styles.content}
      style={[buttonStyle, { backgroundColor: resolvedColor, borderColor: resolvedBorderColor, borderWidth: 1 }]}
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
      <Text style={[styles.title, { color: resolvedTextColor }]}>{title}</Text>
    </Button>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  button: {
    borderRadius: 14,
    marginHorizontal: 20,
    width: '100%',
    shadowColor: colors.shadow,
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
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  title: {
    textAlign: 'center',
    color: colors.white,
    alignSelf: 'center',
    fontFamily: Fonts.poppins.medium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
})
