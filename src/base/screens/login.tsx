import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { TextField, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { getSession, login } from '../api/authService'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCheckingSession, setIsCheckingSession] = useState(true)

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      try {
        const session = await getSession()
        if (!isMounted) return
        if (session.accessToken) router.replace('/home')
      } catch {}
      if (!isMounted) return
      setIsCheckingSession(false)
    }

    check()
    return () => {
      isMounted = false
    }
  }, [])

  const onSubmit = async () => {
    setError(null)
    try {
      await login({ email, password })
      router.replace('/home')
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? (e as any).message : 'Erreur de connexion'
      setError(String(message))
    }
  }

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Connexion</Text>

        <View style={{ width: '100%', marginTop: 10 }}>
          <TextField icon="email" placeholder="Email" value={email} onChangeText={setEmail} type="email" />
          <TextField icon="lock" placeholder="Mot de passe" value={password} onChangeText={setPassword} type="password" />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={{ width: '100%', marginTop: 10 }}>
          <PrimaryButton title="Se connecter" onPress={onSubmit} isClickable={email.trim().length > 0 && password.length > 0} />
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.linkText}>Créer un compte</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <Text style={styles.linkText}>Mot de passe oublié</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: LightColors.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  loadingText: {
    color: LightColors.grey,
  },
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 8,
  },
  linksRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  linkText: {
    color: LightColors.primary,
    fontWeight: '600',
  },
})

