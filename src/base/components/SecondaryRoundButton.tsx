import React from 'react'
import { Button, Icon } from 'react-native-paper'
import { StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { haptic } from '../utils/haptics'
import { useAppTheme } from '../providers/themeProvider'

type SecondaryRoundButtonProps = {
  blocId: number
  onPress?: () => void
  color?: string
}

export const SecondaryRoundButton = ({ blocId, onPress, color }: SecondaryRoundButtonProps) => {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const handlePress = async () => {
    await haptic('tap')
    onPress?.()
    router.push({
      pathname: '/create-exercice',
      params: { blocId: String(blocId) },
    })
  }

  return (
    <View style={styles.container}>
      <Button mode="contained" style={[styles.button, { backgroundColor: color ?? colors.primary }]} contentStyle={styles.buttonContent} compact onPress={handlePress}>
        <Icon source="plus" size={20} color={colors.white} />
      </Button>
    </View>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.translucentBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 0,
    marginVertical: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    minWidth: 44,
    width: 44,
    height: 44,
  },
})
