import React, { useEffect, useState } from 'react'
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Surface, Text } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'
import { fetchExerciseLibrary, getExerciseCategoryIdFromLibraryItem, getExerciseCategoryNameFromLibraryItem, toTrainingExerciseFromLibrary } from '../api/exerciseLibraryService'
import { fetchExerciseCategories } from '../api/exerciseCategoriesService'
import { IExerciseLibraryItem } from '../types/trainingTypes'
import { haptic } from '../utils/haptics'
import LoadingIndicator from '../components/LoadingIndicator'
import { PrimaryButton } from '../components'
import { useTrainingStore } from '../store/trainingStore'

export default function ExerciseLibraryScreen() {
  const { colors } = useAppTheme()
  const styles = createStyles(colors)
  const router = useRouter()
  const { mode, blocId } = useLocalSearchParams<{ mode?: string; blocId?: string }>()
  const [items, setItems] = useState<IExerciseLibraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([])
  const addExerciseToBloc = useTrainingStore((state) => state.addExerciseToBloc)
  const formatDate = (value: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoading(true)
      try {
        const [data, categoryRows] = await Promise.all([fetchExerciseLibrary(), fetchExerciseCategories()])
        if (isMounted) {
          setItems(data)
          setCategories(categoryRows.map((item) => ({ id: item.id, name: item.name })))
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
  const blocIdNumber = blocId ? Number(blocId) : null
  const filteredItems =
    selectedCategoryId.trim().length === 0 ? items : items.filter((item) => getExerciseCategoryIdFromLibraryItem(item) === selectedCategoryId)
  const selectedCount = selectedExerciseIds.length

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <LoadingIndicator />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, isPickMode ? { paddingBottom: 120 } : null]}
          ListHeaderComponent={
            <View style={styles.filterWrap}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setSelectedCategoryId('')}
                style={[
                  styles.filterChip,
                  {
                    borderColor: selectedCategoryId === '' ? colors.primary : colors.cardBorder,
                    backgroundColor: selectedCategoryId === '' ? colors.primary : colors.white,
                  },
                ]}
              >
                <Text style={{ color: selectedCategoryId === '' ? colors.white : colors.black, fontWeight: '700', fontSize: 12 }}>Tous</Text>
              </TouchableOpacity>
              {categories.map((category) => {
                const isActive = selectedCategoryId === category.id
                return (
                  <TouchableOpacity
                    key={category.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedCategoryId(category.id)}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: isActive ? colors.primary : colors.cardBorder,
                        backgroundColor: isActive ? colors.primary : colors.white,
                      },
                    ]}
                  >
                    <Text style={{ color: isActive ? colors.white : colors.black, fontWeight: '700', fontSize: 12 }}>{category.name}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          }
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
                await haptic('tap')
                if (isPickMode) {
                  setSelectedExerciseIds((prev) => (prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]))
                  return
                }
                router.push({
                  pathname: '/create-exercice',
                  params: {
                    mode: 'edit-library',
                    libraryExerciseId: item.id,
                  },
                })
              }}
            >
              <Surface
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.white,
                    borderColor: isPickMode && selectedExerciseIds.includes(item.id) ? colors.primary : colors.cardBorder,
                    borderWidth: isPickMode && selectedExerciseIds.includes(item.id) ? 2 : 1,
                  },
                ]}
                elevation={0}
              >
                <View style={styles.cardTopRow}>
                  {item.pictureUrl ? (
                    <Image source={{ uri: item.pictureUrl }} style={styles.cardImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.cardImagePlaceholder, { backgroundColor: colors.lightGrey, borderColor: colors.cardBorder }]}>
                      <Text style={{ color: colors.mutedText, fontSize: 11, fontWeight: '700' }}>PHOTO</Text>
                    </View>
                  )}
                  <View style={styles.cardMain}>
                    <Text style={[styles.cardTitle, { color: colors.black }]} numberOfLines={2}>
                      {item.title || 'Exercice'}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={[styles.metaBadge, { backgroundColor: colors.badgeBackground }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.primary }]}>{item.exerciseType}</Text>
                      </View>
                      {getExerciseCategoryNameFromLibraryItem(item) ? (
                        <View style={[styles.metaBadge, { backgroundColor: colors.lightGrey }]}>
                          <Text style={[styles.metaBadgeText, { color: colors.black }]}>{getExerciseCategoryNameFromLibraryItem(item)}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
                {item.description ? (
                  <Text style={[styles.cardDescription, { color: colors.mutedText }]} numberOfLines={3}>
                    {item.description}
                  </Text>
                ) : null}
                {item.notes ? (
                  <Text style={[styles.cardNotes, { color: colors.mutedText }]} numberOfLines={2}>
                    Notes: {item.notes}
                  </Text>
                ) : null}
                {formatDate(item.createdAt) ? <Text style={[styles.cardDate, { color: colors.grey }]}>Créé le {formatDate(item.createdAt)}</Text> : null}
              </Surface>
            </TouchableOpacity>
          )}
        />
      )}
      {isPickMode ? (
        <View style={[styles.selectionFooter, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
          <PrimaryButton
            title={selectedCount > 0 ? `Ajouter la sélection (${selectedCount})` : 'Sélectionne au moins un exercice'}
            isClickable={selectedCount > 0}
            onPress={async () => {
              if (!blocIdNumber || blocIdNumber <= 0) {
                Alert.alert('Erreur', 'Bloc invalide')
                return
              }
              const selectedItems = items.filter((item) => selectedExerciseIds.includes(item.id))
              selectedItems.forEach((item) => {
                addExerciseToBloc(blocIdNumber, toTrainingExerciseFromLibrary(item))
              })
              await haptic('tap')
              router.replace('/create-training')
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) =>
  StyleSheet.create({
    screen: { flex: 1 },
    loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 10, flexGrow: 1 },
    filterWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    filterChip: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 11,
      paddingVertical: 6,
    },
    card: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
    cardTopRow: {
      flexDirection: 'row',
      gap: 10,
    },
    cardImage: {
      width: 82,
      height: 82,
      borderRadius: 10,
    },
    cardImagePlaceholder: {
      width: 82,
      height: 82,
      borderRadius: 10,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardMain: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 82,
    },
    cardTitle: { fontSize: 16, fontWeight: '700' },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
    },
    metaBadge: {
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    metaBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    cardDescription: { marginTop: 10, fontSize: 13, lineHeight: 18 },
    cardNotes: { marginTop: 6, fontSize: 12, lineHeight: 17, fontWeight: '600' },
    cardDate: { marginTop: 8, fontSize: 11, fontWeight: '600' },
    emptyCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 20 },
    selectionFooter: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 10,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },
  })
