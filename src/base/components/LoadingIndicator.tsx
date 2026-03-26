import * as React from 'react'
import { ActivityIndicator } from 'react-native-paper'
import { LightColors } from '../constants/theme'

const LoadingIndicator = () => <ActivityIndicator animating={true} color={LightColors.primary} />

export default LoadingIndicator
