import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { View, Animated, Text } from 'react-native'
import { Logo, MainText } from '../components'
import { LightColors } from '../constants/theme'
import { getSession } from '../api/authService'

export default function Index() {
  const router = useRouter()
  const opacity = useRef(new Animated.Value(1)).current
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true

    const check = async () => {
      try {
        const session = await getSession()
        if (!isMounted) return

        const target = session.accessToken ? '/home' : '/login'
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          if (!isMounted) return
          router.replace(target)
        })
      } catch {
        if (!isMounted) return
        router.replace('/login')
      } finally {
        if (!isMounted) return
        setIsCheckingSession(false)
      }
    }

    check()

    return () => {
      isMounted = false
    }
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
        {isCheckingSession ? <Text style={{ color: LightColors.grey, marginBottom: 20 }}>Chargement...</Text> : null}
      </View>
    </Animated.View>
  )
}
