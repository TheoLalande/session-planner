import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Icon } from 'react-native-paper'
import { LightColors } from '../constants/theme'

interface CustomCheckboxProps {
  checked: boolean
  onPress: () => void
  borderColor: string
  checkedColor: string
}

export function CustomCheckbox({ checked, onPress, borderColor, checkedColor }: CustomCheckboxProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.checkbox,
          {
            width: 24,
            height: 24,
            borderColor: borderColor,
            backgroundColor: checked ? checkedColor : 'transparent',
          },
        ]}
      >
        {checked && <Icon source="check" size={24 * 0.7} color={LightColors.white} />}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  checkbox: {
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
