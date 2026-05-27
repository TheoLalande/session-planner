import React from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { QuickSessionLogForm } from '../components/QuickSessionLogForm'
import { useAppTheme } from '../providers/themeProvider'
import { Fonts } from '../constants/theme'

export default function LogQuickSessionScreen() {
  const { colors } = useAppTheme()
  const styles = createStyles()

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Choisis le type et la date de ta séance pour l’ajouter à ton calendrier et tes statistiques, sans autre détail.
        </Text>
        <QuickSessionLogForm />
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = () =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 18,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 16,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: Fonts.poppins.medium,
    },
  })
