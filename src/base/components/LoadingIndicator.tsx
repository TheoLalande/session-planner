import * as React from 'react'
import { ActivityIndicator } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'

const LoadingIndicator = () => {
  const { colors } = useAppTheme()
  return <ActivityIndicator animating={true} color={colors.primary} />
}

export default LoadingIndicator
