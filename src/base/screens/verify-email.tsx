import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getSupabaseClient } from '../api/supabaseClient'
import { LightColors } from '../constants/theme'

export default function VerifyEmail() {
  const router = useRouter()
  const params = useLocalSearchParams<{ access_token?: string; refresh_token?: string }>()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined
    const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined

    const run = async () => {
      if (!accessToken || !refreshToken) {
        if (!isMounted) return
        setStatus('error')
        setError('Parametres de confirmation manquants.')
        return
      }

      try {
        const supabase = getSupabaseClient()
        const { error: setErr } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (!isMounted) return
        if (setErr) {
          setStatus('error')
          setError(setErr.message)
          return
        }
        setStatus('success')
        router.replace('/home')
      } catch (e) {
        if (!isMounted) return
        setStatus('error')
        const message = e && typeof e === 'object' && 'message' in e ? (e as any).message : 'Erreur de vérification'
        setError(String(message))
      }
    }

    run()
    return () => {
      isMounted = false
    }
  }, [params.access_token, params.refresh_token, router])

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' ? <Text style={styles.text}>Vérification...</Text> : null}
        {status === 'success' ? <Text style={styles.textSuccess}>Email vérifié.</Text> : null}
        {status === 'error' ? <Text style={styles.textError}>{error ?? "Une erreur est survenue."}</Text> : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  text: {
    color: LightColors.grey,
    textAlign: 'center',
  },
  textSuccess: {
    color: LightColors.primary,
    textAlign: 'center',
  },
  textError: {
    color: LightColors.danger,
    textAlign: 'center',
  },
})

