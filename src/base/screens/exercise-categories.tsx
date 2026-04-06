import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Alert, FlatList, StyleSheet, View } from 'react-native'
import { Button, Surface, Text, TextInput } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'
import { createExerciseCategory, fetchExerciseCategories } from '../api/exerciseCategoriesService'
import { IExerciseCategory } from '../types/trainingTypes'
import LoadingIndicator from '../components/LoadingIndicator'

export default function ExerciseCategoriesScreen() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [categories, setCategories] = useState<IExerciseCategory[]>([])
  const [name, setName] = useState('')

  const load = async () => {
    setIsLoading(true)
    try {
      const data = await fetchExerciseCategories()
      setCategories(data)
    } catch (e: any) {
      Alert.alert('Erreur', e?.message || 'Impossible de charger les types')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
          <Text style={[styles.cardTitle, { color: colors.black }]}>Nouveau type d'exercice</Text>
          <TextInput
            mode="outlined"
            label="Nom du type"
            value={name}
            onChangeText={setName}
            style={styles.input}
            outlineColor={colors.cardBorder}
            activeOutlineColor={colors.primary}
          />
          <Button
            mode="contained"
            buttonColor={colors.primary}
            disabled={isCreating || !name.trim()}
            onPress={async () => {
              setIsCreating(true)
              try {
                const created = await createExerciseCategory(name)
                setCategories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
                setName('')
              } catch (e: any) {
                Alert.alert('Erreur', e?.message || 'Impossible de créer le type')
              } finally {
                setIsCreating(false)
              }
            }}
          >
            Créer le type
          </Button>
        </Surface>

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <LoadingIndicator />
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Surface style={[styles.row, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
                <Text style={[styles.rowText, { color: colors.black }]}>{item.name}</Text>
              </Surface>
            )}
            ListEmptyComponent={
              <Surface style={[styles.emptyCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
                <Text style={{ color: colors.mutedText }}>Aucun type créé pour le moment.</Text>
              </Surface>
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    input: { backgroundColor: colors.white },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingBottom: 20, gap: 8 },
    row: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
    rowText: { fontSize: 14, fontWeight: '600' },
    emptyCard: { borderWidth: 1, borderRadius: 12, padding: 14 },
  })
