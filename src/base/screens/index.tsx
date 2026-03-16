import { useEffect, useRef } from 'react'
import { useRouter } from 'expo-router'
import { View, Animated } from 'react-native'
import { Logo, MainText, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'

export default function Index() {
  const router = useRouter()
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/home')
      })
    }, 2000)

    return () => clearTimeout(timer)
  }, [opacity, router])

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity,
      }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 30,
          paddingBottom: 30,
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Logo logo="logo-full.png" maxWidth={300} maxHeight={300} />
          <MainText text="Plannifiez vos sessions d'entrainement" fontSize={30} color={LightColors.primary} />
        </View>
      </View>
    </Animated.View>
  )
}
