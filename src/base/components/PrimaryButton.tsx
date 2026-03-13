import { StyleSheet } from 'react-native'
import { Button, Text } from 'react-native-paper'
import { Fonts, LightColors } from '../constants/theme'

interface PrimaryButtonProps {
  title: string
  onPress?: () => void
  isClickable?: boolean
}

export function PrimaryButton({ title, onPress, isClickable = true }: PrimaryButtonProps) {
  const buttonStyle = [styles.button, !isClickable && styles.buttonDisabled]

  return (
    <Button style={buttonStyle} onPress={isClickable ? onPress : undefined} disabled={!isClickable}>
      <Text style={styles.title}>{title}</Text>
    </Button>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: LightColors.primary,
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
