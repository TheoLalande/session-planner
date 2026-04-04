import React, { useCallback, useState } from 'react'
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { ActivityIndicator } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'
import { fetchAdHocClimbingAttemptsDetail, type AdHocClimbingAttemptDetail } from '../api/climbingAttemptsService'

function formatListDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

function routeLineLabel(row: AdHocClimbingAttemptDetail) {
  if (row.locationType === 'salle' && row.routeName === 'SAE') {
    return 'Salle (SAE)'
  }
  return row.routeName
}

export default function EditAdHocList() {
  const { colors } = useAppTheme()
  const [rows, setRows] = useState<AdHocClimbingAttemptDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await fetchAdHocClimbingAttemptsDetail()
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      void load()
    }, [load]),
  )

  const onRefresh = () => {
    setRefreshing(true)
    void load()
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>Mes voies à la volée</Text>
      <Text style={[styles.subtitle, { color: colors.grey }]}>
        Choisis une ligne pour modifier la date, la cotation ou les autres infos.
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator animating size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
          <Text style={[styles.errorText, { color: colors.black }]}>{error}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setLoading(true)
              void load()
            }}
            style={[styles.retryBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : rows.length === 0 ? (
        <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
          <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune voie enregistrée hors séance pour le moment.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push({ pathname: '/edit-ad-hoc-detail', params: { id: item.id } })}
              style={[styles.row, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
            >
              <Text style={[styles.rowTitle, { color: colors.black }]}>
                {formatListDate(item.performedAt)} · {routeLineLabel(item)}
              </Text>
              <Text style={[styles.rowSub, { color: colors.grey }]}>
                {item.grade} · {item.climbingType} · {item.status === 'success' ? 'Réussi' : 'Échoué'} · {item.locationType}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 14,
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 28,
    gap: 10,
  },
  row: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  rowSub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
  },
})
