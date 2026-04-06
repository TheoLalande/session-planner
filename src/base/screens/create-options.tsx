import React from 'react'
import { View, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Surface, Text, Button } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useAppTheme } from '../providers/themeProvider'
import { useTrainingStore } from '../store/trainingStore'
import { haptic } from '../utils/haptics'
import { Fonts } from '../constants/theme'

export default function CreateOptionsScreen() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const router = useRouter()
  const clearEditingTraining = useTrainingStore((state) => state.clearEditingTraining)

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.black }]}>Que veux-tu créer ?</Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Choisis le type de création que tu veux lancer.
        </Text>

        <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-plus-outline" size={22} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.black }]}>Créer un entraînement</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.mutedText }]}>
            Crée une nouvelle séance complète avec tes blocs et tes exercices.
          </Text>
          <Button
            mode="contained"
            onPress={async () => {
              await haptic('tap')
              clearEditingTraining()
              router.push('/create-training')
            }}
            buttonColor={colors.primary}
            contentStyle={styles.buttonContent}
          >
            Créer un entraînement
          </Button>
        </Surface>

        <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="dumbbell" size={22} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.black }]}>Créer un exercice</Text>
          </View>
          <Text style={[styles.cardDescription, { color: colors.mutedText }]}>
            Ouvre l'écran de création d'exercice pour préparer un nouveau mouvement.
          </Text>
          <Button
            mode="outlined"
            onPress={async () => {
              await haptic('tap')
              router.push('/create-exercice')
            }}
            textColor={colors.primary}
            style={[styles.outlinedButton, { borderColor: colors.primary }]}
            contentStyle={styles.buttonContent}
          >
            Créer un exercice
          </Button>
        </Surface>
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 20,
      gap: 14,
    },
    title: {
      fontFamily: Fonts.poppins.bold,
      fontSize: 24,
      lineHeight: 30,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 4,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 10,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    cardTitle: {
      fontFamily: Fonts.poppins.medium,
      fontSize: 16,
      lineHeight: 22,
    },
    cardDescription: {
      fontSize: 13,
      lineHeight: 19,
    },
    buttonContent: {
      minHeight: 44,
    },
    outlinedButton: {
      borderWidth: 1,
    },
  })
