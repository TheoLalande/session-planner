import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StyleSheet, Text, View } from 'react-native'
import { useAppTheme } from '../providers/themeProvider'

export default function Tool3() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
        <Text style={[styles.title, { color: colors.primary }]}>Tool 3</Text>
        <Text style={[styles.text, { color: colors.grey }]}>Page de simulation.</Text>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    card: {
      width: '100%',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
    },
    text: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: '600',
    },
  })

