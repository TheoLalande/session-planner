import React, { useEffect, useState } from 'react'
import { View, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Surface, Text } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'
import { fetchExerciseLibrary } from '../api/exerciseLibraryService'
import { IExerciseLibraryItem } from '../types/trainingTypes'
import { haptic } from '../utils/haptics'
import LoadingIndicator from '../components/LoadingIndicator'

export default function ExerciseLibraryScreen() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const router = useRouter()
  const { mode, blocId } = useLocalSearchParams<{ mode?: string; blocId?: string }>()
  const [items, setItems] = useState<IExerciseLibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await fetchExerciseLibrary()
        if (isMounted) {
          setItems(data)
        }
      } catch (e: any) {
        Alert.alert('Erreur', e?.message || 'Impossible de charger la librairie')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const isPickMode = mode === 'pick' && !!blocId

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <LoadingIndicator />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Surface style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
              <Text style={{ color: colors.black, fontWeight: '700' }}>Aucun exercice enregistré</Text>
              <Text style={{ color: colors.mutedText, marginTop: 6 }}>Crée un exercice depuis l’écran Créer.</Text>
            </Surface>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={async () => {
                if (!isPickMode) {
                  return
                }
                await haptic('tap')
                if (!blocId) {
                  Alert.alert('Erreur', 'Bloc invalide')
                  return
                }
                router.push({
                  pathname: '/create-exercice',
                  params: {
                    mode: 'from-library',
                    blocId,
                    libraryExerciseId: item.id,
                  },
                })
              }}
            >
              <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
                <Text style={[styles.cardTitle, { color: colors.black }]} numberOfLines={1}>
                  {item.title || 'Exercice'}
                </Text>
                <Text style={[styles.cardType, { color: colors.primary }]}>{item.exerciseType}</Text>
                {item.description ? (
                  <Text style={[styles.cardDescription, { color: colors.mutedText }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </Surface>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: { flex: 1 },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 10, flexGrow: 1 },
    card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    cardType: { marginTop: 4, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
    cardDescription: { marginTop: 6, fontSize: 13, lineHeight: 18 },
    emptyCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 20 },
  })
