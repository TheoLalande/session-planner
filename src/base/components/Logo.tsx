import { Image, StyleSheet } from 'react-native'

interface LogoProps {
  maxWidth?: number
  maxHeight?: number
  logo: 'logo-full.png' | 'logo-mignify.png'
}

const logoMap = {
  'logo-full.png': require('../assets/png/logo-full.png'),
  'logo-mignify.png': require('../assets/png/logo-mignify.png'),
}

export function Logo({ maxWidth, maxHeight, logo }: LogoProps) {
  return <Image source={logoMap[logo]} style={[styles.logo, { maxHeight: maxHeight ?? 300, maxWidth: maxWidth ?? 300 }]} />
}

const styles = StyleSheet.create({
  logo: {
    resizeMode: 'contain',
    alignSelf: 'center',
  },
})
