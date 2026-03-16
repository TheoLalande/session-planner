import React from 'react'
import { Button, Icon } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'
import { LightColors } from '../constants/theme'
import { router } from 'expo-router'

type SecondaryRoundButtonProps = {
  blocId: number
  onPress?: () => void
  color?: string
}

export const SecondaryRoundButton = ({ blocId, onPress, color = LightColors.primary }: SecondaryRoundButtonProps) => {
  const handlePress = () => {
    onPress?.()
    router.push({
      pathname: '/create-exercice',
      params: { blocId: String(blocId) },
    })
  }

  return (
    <View style={styles.container}>
      <Button style={[styles.button, { backgroundColor: color }]} contentStyle={styles.buttonContent} compact onPress={handlePress}>
        <Icon source="plus" size={20} color={LightColors.white} />
      </Button>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 40 / 2,
    marginTop: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
    marginVertical: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 40,
    width: 40,
    height: 40,
  },
})
