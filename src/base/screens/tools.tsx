import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { BottomNavBar } from '../components'
import { useAppTheme } from '../providers/themeProvider'
import { router } from 'expo-router'

export default function Tools() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.primary }]}>Outils</Text>
        <Text style={[styles.subtitle, { color: colors.grey }]}>Raccourcis et outils utiles.</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/media-library')}
          style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.cardTitle, { color: colors.black }]}>Galerie de photos</Text>
          <Text style={[styles.cardText, { color: colors.grey }]}>Gérer les images ajoutées par l’utilisateur.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/tool2')}
          style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.cardTitle, { color: colors.black }]}>Tool 2</Text>
          <Text style={[styles.cardText, { color: colors.grey }]}>Simulation d’outil.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/tool3')}
          style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.cardTitle, { color: colors.black }]}>Tool 3</Text>
          <Text style={[styles.cardText, { color: colors.grey }]}>Simulation d’outil.</Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: colors.black }]}>À venir</Text>
          <Text style={[styles.cardText, { color: colors.grey }]}>Ajoute ici tes outils (timers, calculs, checklists...).</Text>
        </View>
      </ScrollView>
      <BottomNavBar />
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 24,
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      marginTop: -6,
      fontSize: 14,
      fontWeight: '600',
    },
    card: {
      width: '100%',
      borderWidth: 1,
      borderRadius: 16,
      padding: 14,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
    },
    cardText: {
      marginTop: 6,
      fontSize: 13,
      fontWeight: '600',
    },
  })
