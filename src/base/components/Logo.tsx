import { Image, StyleSheet } from 'react-native'
import { useAppTheme } from '../providers/themeProvider'

interface LogoProps {
  maxWidth?: number
  maxHeight?: number
  logo: 'logo-full.png'
}

const logoMap = {
  'logo-full.png': require('../assets/png/logo-full.png'),
}

export function Logo({ maxWidth, maxHeight, logo }: LogoProps) {
  const { colors } = useAppTheme()

  return (
    <Image
      source={logoMap[logo]}
      style={[
        styles.logo,
        {
          maxHeight: maxHeight ?? 300,
          maxWidth: maxWidth ?? 300,
          tintColor: colors.black,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
    alignSelf: 'center',
  },
})
