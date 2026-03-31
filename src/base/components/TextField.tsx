import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { TextInput } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'

interface TextFieldProps {
  icon?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  type?: 'text' | 'email' | 'password' | 'number'
  onFocus?: () => void
  onBlur?: () => void
}

export function TextField({ icon, placeholder, value: controlledValue, onChangeText, type = 'text', onFocus, onBlur }: TextFieldProps) {
  const { colors } = useAppTheme()
  const isPassword = type === 'password'
  const isEmail = type === 'email'
  const isNumber = type === 'number'
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [localValue, setLocalValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const value = controlledValue !== undefined ? controlledValue : localValue
  const hasValue = value && value.length > 0

  const handleChangeText = (text: string) => {
    if (controlledValue === undefined) {
      setLocalValue(text)
    }
    onChangeText?.(text)
  }

  return (
    <TextInput
      left={icon ? <TextInput.Icon icon={icon} color={colors.primary} /> : null}
      right={
        isPassword && hasValue ? (
          <TextInput.Icon
            icon={isPasswordVisible ? 'eye' : 'eye-off'}
            color={colors.primary}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          />
        ) : null
      }
      textColor={colors.black}
      cursorColor={colors.primary}
      caretHidden={false}
      selectionColor={colors.primary}
      placeholder={isFocused ? '' : placeholder}
      value={value}
      onChangeText={handleChangeText}
      secureTextEntry={isPassword && !isPasswordVisible}
      keyboardType={isEmail ? 'email-address' : isNumber ? 'numeric' : 'default'}
      autoCapitalize={isEmail || isPassword ? 'none' : 'sentences'}
      autoCorrect={false}
      style={[
        styles.input,
        { backgroundColor: colors.white, borderColor: colors.lightGrey },
        isFocused && { borderColor: colors.primary },
      ]}
      contentStyle={styles.content}
      placeholderTextColor={colors.black}
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      onFocus={() => {
        setIsFocused(true)
        onFocus?.()
      }}
      onBlur={() => {
        setIsFocused(false)
        onBlur?.()
      }}
    />
  )
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 10,
    textAlign: 'left',
    width: '100%',
    borderRadius: 17,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: 'transparent',
    height: 50,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 0,
  },
  inputFocused: {
    borderColor: 'transparent',
  },
  content: {
    paddingLeft: 14,
    fontSize: 15,
  },
})
