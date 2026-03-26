import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { PrimaryButton } from '../components'
import { getSession, logout } from '../api/authService'
import LoadingIndicator from '../components/LoadingIndicator'
import { useAppTheme } from '../providers/themeProvider'
import { LightColors } from '../constants/theme'

export default function settings() {
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const { mode, setMode, colors } = useAppTheme()
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h')
  const [autoStartNextExercise, setAutoStartNextExercise] = useState(true)
  const [dailyReminder, setDailyReminder] = useState(false)

  useEffect(() => {
    let isMounted = true
    const check = async () => {
      try {
        const session = await getSession()
        if (!isMounted) return
        if (!session.accessToken) router.replace('/login')
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
  }, [])

  if (isCheckingSession) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
        <View style={styles.content}>
          <LoadingIndicator />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.white }]}>
      <View style={styles.content}>
        <View style={[styles.panel, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.black }]}>Apparence</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.black }]}>Thème sombre</Text>
            <Switch value={mode === 'dark'} onValueChange={(enabled) => setMode(enabled ? 'dark' : 'light')} />
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.white, borderColor: mode === 'dark' ? colors.darkBorder : colors.cardBorder }]}>
          <Text style={[styles.panelTitle, { color: colors.black }]}>Préférences d'entraînement</Text>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.black }]}>Démarrer automatiquement l'exercice suivant</Text>
            <Switch value={autoStartNextExercise} onValueChange={setAutoStartNextExercise} />
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.black }]}>Rappel quotidien</Text>
            <Switch value={dailyReminder} onValueChange={setDailyReminder} />
          </View>

          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.grey }]}>Unités de mesure</Text>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.segmentButton,
                  {
                    backgroundColor: unitSystem === 'metric' ? colors.primary : colors.white,
                    borderColor: unitSystem === 'metric' ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setUnitSystem('metric')}
              >
                <Text style={[styles.segmentText, { color: unitSystem === 'metric' ? colors.white : colors.black }]}>Métrique</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.segmentButton,
                  {
                    backgroundColor: unitSystem === 'imperial' ? colors.primary : colors.white,
                    borderColor: unitSystem === 'imperial' ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setUnitSystem('imperial')}
              >
                <Text style={[styles.segmentText, { color: unitSystem === 'imperial' ? colors.white : colors.black }]}>Impérial</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.grey }]}>Format de l'heure</Text>
            <View style={styles.segmentedRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.segmentButton,
                  {
                    backgroundColor: timeFormat === '24h' ? colors.primary : colors.white,
                    borderColor: timeFormat === '24h' ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setTimeFormat('24h')}
              >
                <Text style={[styles.segmentText, { color: timeFormat === '24h' ? colors.white : colors.black }]}>24h</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.segmentButton,
                  {
                    backgroundColor: timeFormat === '12h' ? colors.primary : colors.white,
                    borderColor: timeFormat === '12h' ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setTimeFormat('12h')}
              >
                <Text style={[styles.segmentText, { color: timeFormat === '12h' ? colors.white : colors.black }]}>12h</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            title="Se déconnecter"
            onPress={async () => {
              await logout()
              router.replace('/login')
            }}
          />
        </View>
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
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  panel: {
    width: '100%',
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    paddingRight: 12,
  },
  group: {
    marginTop: 8,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
})
