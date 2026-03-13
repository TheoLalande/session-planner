import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { Logo, MainText, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'

export default function Index() {
  const router = useRouter()

  return (
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

      <PrimaryButton title="Commencer l'entrainement" onPress={() => router.push('/home')} />
    </View>
  )
}
