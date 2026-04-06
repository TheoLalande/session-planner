import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Surface, Text } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAppTheme } from '../providers/themeProvider'
import { haptic } from '../utils/haptics'

export default function AddExerciseChoiceScreen() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const router = useRouter()
  const { blocId } = useLocalSearchParams<{ blocId?: string }>()

  if (!blocId) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={{ color: colors.mutedText }}>Bloc introuvable.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.black }]}>Ajouter un exercice</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>Choisis la source de l’exercice pour ce bloc.</Text>

        <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="bookshelf" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.black }]}>Exercice existant</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.mutedText }]}>Sélectionner un exercice déjà enregistré en librairie.</Text>
          <Button
            mode="contained"
            buttonColor={colors.primary}
            onPress={async () => {
              await haptic('tap')
              router.push({ pathname: '/exercise-library', params: { mode: 'pick', blocId } })
            }}
          >
            Choisir dans ma librairie
          </Button>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.black }]}>Exercice custom</Text>
          </View>
          <Text style={[styles.cardText, { color: colors.mutedText }]}>Créer un exercice ponctuel sans l’enregistrer en librairie.</Text>
          <Button
            mode="outlined"
            textColor={colors.primary}
            style={{ borderColor: colors.primary }}
            onPress={async () => {
              await haptic('tap')
              router.push({ pathname: '/create-exercice', params: { blocId } })
            }}
          >
            Créer un custom
          </Button>
        </Surface>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 18, paddingTop: 18, gap: 14 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, marginBottom: 2 },
    card: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    cardText: { fontSize: 13, fontWeight: '500', lineHeight: 18 },
  })
