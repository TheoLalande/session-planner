import { useState } from 'react'
import { StyleSheet } from 'react-native'
import { TextInput } from 'react-native-paper'
import { LightColors } from '../constants/theme'

interface TextFieldProps {
  icon?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  type?: 'text' | 'email' | 'password' | 'number'
}

export function TextField({ icon, placeholder, value: controlledValue, onChangeText, type = 'text' }: TextFieldProps) {
  const isPassword = type === 'password'
  const isEmail = type === 'email'
  const isNumber = type === 'number'
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [localValue, setLocalValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Utiliser la valeur contrôlée si fournie, sinon utiliser l'état local
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
      left={icon ? <TextInput.Icon icon={icon} color={LightColors.white} /> : null}
      right={
        isPassword && localValue.length > 0 ? (
          <TextInput.Icon
            icon={isPasswordVisible ? 'eye' : 'eye-off'}
            color={LightColors.white}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          />
        ) : null
      }
      textColor={LightColors.black}
      placeholder={isFocused ? '' : placeholder}
      value={value}
      onChangeText={handleChangeText}
      secureTextEntry={isPassword && !isPasswordVisible}
      keyboardType={isEmail ? 'email-address' : isNumber ? 'numeric' : 'default'}
      autoCapitalize={isEmail ? 'none' : 'sentences'}
      style={[styles.input, isFocused && styles.inputFocused]}
      contentStyle={styles.content}
      placeholderTextColor={LightColors.black}
      underlineColor="transparent"
      activeUnderlineColor="transparent"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
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
    backgroundColor: LightColors.white,
    height: 50,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: LightColors.primary,
  },
  content: {
    paddingLeft: 14,
    fontSize: 15,
  },
})
