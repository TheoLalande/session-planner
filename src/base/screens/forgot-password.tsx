import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { TextField, PrimaryButton } from '../components'
import { LightColors } from '../constants/theme'
import { forgotPassword } from '../api/authService'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const onSubmit = async () => {
    setError(null)
    setSuccessMessage(null)
    try {
      await forgotPassword(email)
      setSuccessMessage('Un email de réinitialisation a été envoyé si l’adresse existe.')
    } catch (e) {
      const message = e && typeof e === 'object' && 'message' in e ? (e as any).message : "Erreur d'envoi"
      setError(String(message))
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.title}>Mot de passe oublié</Text>

        <View style={{ width: '100%', marginTop: 10 }}>
          <TextField icon="email" placeholder="Email" value={email} onChangeText={setEmail} type="email" />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

        <View style={{ width: '100%', marginTop: 10 }}>
          <PrimaryButton title="Envoyer" onPress={onSubmit} isClickable={email.trim().length > 0} />
        </View>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.linkText}>Retour à la connexion</Text>
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
    marginTop: 12,
  },
  linkText: {
    color: LightColors.primary,
    fontWeight: '600',
  },
})

