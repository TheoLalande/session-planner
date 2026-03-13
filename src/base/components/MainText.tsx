// import { Text } from "@rneui/themed";
import { Text } from 'react-native-paper'
import { Fonts } from '../constants/theme'

interface MainTextProps {
  text: string
  fontSize: number
  color: string
}

export function MainText({ text, fontSize, color }: MainTextProps) {
  return (
    <Text
      style={{
        fontSize: fontSize,
        textAlign: 'center',
        color: color,
        lineHeight: fontSize + 8,
        fontFamily: Fonts.sairaCondensed.bold,
        includeFontPadding: false,
        textAlignVertical: 'top',
      }}
    >
      {text}
    </Text>
  )
}
