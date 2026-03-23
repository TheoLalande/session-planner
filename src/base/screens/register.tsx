import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { TextField, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { register } from '../api/authService'

export default function Register() {
  const [nickname, setNickname] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await register({ nickname, firstName, lastName, email, password })
      if (res.accessToken) {
        router.replace('/home')
        return
      }
      setSuccessMessage('Vérifiez votre email puis cliquez sur le lien de confirmation.')
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? (e as any).message : "Erreur d'enregistrement"
      setError(String(message))
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Créer un compte</Text>

        <View style={{ width: '100%', marginTop: 10 }}>
          <TextField icon="account" placeholder="Pseudo" value={nickname} onChangeText={setNickname} type="text" />
          <TextField icon="account" placeholder="Prénom" value={firstName} onChangeText={setFirstName} type="text" />
          <TextField icon="account-box" placeholder="Nom" value={lastName} onChangeText={setLastName} type="text" />
          <TextField icon="email" placeholder="Email" value={email} onChangeText={setEmail} type="email" />
          <TextField icon="lock" placeholder="Mot de passe" value={password} onChangeText={setPassword} type="password" />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <View style={{ width: '100%', marginTop: 10 }}>
          <PrimaryButton
            title="S'inscrire"
            onPress={onSubmit}
            isClickable={
              nickname.trim().length > 0 && firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 0 && password.length > 0
            }
          />
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>J’ai déjà un compte</Text>
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
  errorText: {
    color: '#ff3b30',
    textAlign: 'center',
    marginTop: 8,
  },
  successText: {
    color: LightColors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  linksRow: {
    marginTop: 10,
  },
  linkText: {
    color: LightColors.primary,
    fontWeight: '600',
  },
})

