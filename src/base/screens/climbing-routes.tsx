import React, { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TextInput } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { useAppTheme } from '../providers/themeProvider'
import LoadingIndicator from '../components/LoadingIndicator'
import { ClimbingRouteAddModal } from '../components/ClimbingRouteAddModal'
import { useClimbingAttemptsStore, type ClimbingAttempt } from '../store/climbingAttemptsStore'
import { addClimbingRouteAttempts, buildClimbingRouteLabel, deleteClimbingRouteLabel, renameClimbingRouteLabel } from '../api/climbingRoutesService'

import {
  type ClimbingRouteGrade,
  type ClimbingRouteStars,
  type ClimbingRouteType,
  type IClimbingRoute,
  type IClimbingRouteLabelPayload,
  type IClimbingRouteParsedLabel,
  type IClimbingRouteSummary,
  ClimbingSpotEnum,
} from '../types/climbingRoutesTypes'

type ClimbingSpotType = IClimbingRoute['climbingType']

const CLIMBING_TYPES: ClimbingSpotType[] = ['bloc', 'falaise', 'grande voie']

function toClimbingType(value: string): ClimbingSpotType {
  const next = value.trim().toLowerCase()
  const match = CLIMBING_TYPES.find((t) => t.toLowerCase() === next)
  return match ?? 'falaise'
}

const GRADE_OPTIONS: ClimbingRouteGrade[] = [
  '4',
  '5a',
  '5a+',
  '5b',
  '5b+',
  '5c',
  '5c+',
  '6a',
  '6a+',
  '6b',
  '6+b',
  '6c',
  '6c+',
  '7a',
  '7a+',
  '7b',
  '7b+',
  '7c',
  '7c+',
  '8a',
]

function toClimbingGrade(value: string): ClimbingRouteGrade {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '')
  const match = GRADE_OPTIONS.find((g) => g.toLowerCase() === normalized)
  return match ?? '6a'
}

const PROFILE_OPTIONS: ClimbingRouteType[] = ['dalle', 'verticale', 'devers', 'toit', 'autre']

function toRouteProfile(value: string): ClimbingRouteType {
  const normalized = value.trim().toLowerCase()
  const match = PROFILE_OPTIONS.find((p) => p.toLowerCase() === normalized)
  return match ?? 'autre'
}

function toStars(value: number | string | undefined | null): ClimbingRouteStars {
  const next = typeof value === 'number' ? value : Number(value ?? 0)
  const safe = Math.max(1, Math.min(5, Math.floor(next)))
  return (Number.isFinite(safe) ? safe : 3) as ClimbingRouteStars
}

const FACADE_OPTIONS: string[] = Object.values(ClimbingSpotEnum) as string[]

function getFacadeSuggestions(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return FACADE_OPTIONS.slice(0, 8)
  return FACADE_OPTIONS.filter((v) => v.toLowerCase().includes(q)).slice(0, 8)
}

function formatDate(ts: number) {
  const d = new Date(ts)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

function parseClimbingRouteLabel(routeLabel: string): IClimbingRouteParsedLabel {
  const parts = routeLabel.split(' · ')
  const routeGrade = toClimbingGrade((parts.pop() ?? '').trim())
  const left = parts.join(' · ').trim()

  if (!left) {
    return { facadeName: '', climbingType: 'falaise', routeName: '', routeProfile: 'autre', likedStars: 3, routeGrade }
  }

  const typeSplit = left.split(' || ')
  if (typeSplit.length >= 5) {
    const facadeName = (typeSplit[0] ?? '').trim()
    const climbingType = toClimbingType(typeSplit[1] ?? '')
    const routeName = (typeSplit[2] ?? '').trim()
    const routeProfile = (typeSplit[3] ?? '').trim()
    const likedStarsN = Number((typeSplit[4] ?? '').trim())

    return {
      facadeName,
      climbingType,
      routeName,
      routeProfile: toRouteProfile(routeProfile),
      likedStars: toStars(likedStarsN),
      routeGrade,
    }
  }

  if (typeSplit.length === 4) {
    const facadeName = (typeSplit[0] ?? '').trim()
    const climbingType = toClimbingType(typeSplit[1] ?? '')
    const routeName = (typeSplit[2] ?? '').trim()
    const routeProfile = (typeSplit[3] ?? '').trim()

    return { facadeName, climbingType, routeName, routeProfile: toRouteProfile(routeProfile), likedStars: 3, routeGrade }
  }

  if (typeSplit.length === 3) {
    const facadeName = (typeSplit[0] ?? '').trim()
    const climbingType = toClimbingType(typeSplit[1] ?? '')
    const routeName = (typeSplit[2] ?? '').trim()

    return { facadeName, climbingType, routeName, routeProfile: 'autre', likedStars: 3, routeGrade }
  }

  if (typeSplit.length >= 2) {
    const climbingType = toClimbingType(typeSplit[0] ?? '')
    const routeName = typeSplit.slice(1).join(' || ').trim()

    return { facadeName: '', climbingType, routeName, routeProfile: 'autre', likedStars: 3, routeGrade }
  }

  // Backward compatible: ancien format "Nom · grade"
  return { facadeName: '', climbingType: 'falaise', routeName: left, routeProfile: 'autre', likedStars: 3, routeGrade }
}

export default function ClimbingRoutes() {
  const { colors } = useAppTheme()
  const attempts = useClimbingAttemptsStore((state) => state.attempts)
  const loadAttempts = useClimbingAttemptsStore((state) => state.loadAttempts)
  const isLoadingAttempts = useClimbingAttemptsStore((state) => state.isLoadingAttempts)
  const [selectedRouteLabel, setSelectedRouteLabel] = useState<string | null>(null)
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)

  const [editFacadeName, setEditFacadeName] = useState('')
  const [isEditFacadePickerOpen, setIsEditFacadePickerOpen] = useState(false)
  const [editFacadeSearch, setEditFacadeSearch] = useState('')
  const [editClimbingType, setEditClimbingType] = useState<ClimbingSpotType>('falaise')
  const [editRouteName, setEditRouteName] = useState('')
  const [editRouteGrade, setEditRouteGrade] = useState<ClimbingRouteGrade>('6a')
  const [editRouteProfile, setEditRouteProfile] = useState<ClimbingRouteType>('autre')
  const [editLikedStars, setEditLikedStars] = useState<ClimbingRouteStars>(3)
  const [renameIsSubmitting, setRenameIsSubmitting] = useState(false)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    loadAttempts().catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [loadAttempts])

  const routeSummaries = useMemo((): IClimbingRouteSummary[] => {
    const map = new Map<string, IClimbingRouteSummary>()

    for (const attempt of attempts) {
      const existing = map.get(attempt.routeLabel)
      if (!existing) {
        map.set(attempt.routeLabel, {
          routeLabel: attempt.routeLabel,
          successCount: attempt.status === 'success' ? 1 : 0,
          failCount: attempt.status === 'fail' ? 1 : 0,
          lastAttemptAt: attempt.createdAt,
        })
        continue
      }

      existing.lastAttemptAt = Math.max(existing.lastAttemptAt, attempt.createdAt)
      if (attempt.status === 'success') existing.successCount += 1
      if (attempt.status === 'fail') existing.failCount += 1
    }

    return Array.from(map.values()).sort((a, b) => b.lastAttemptAt - a.lastAttemptAt)
  }, [attempts])

  useEffect(() => {
    if (selectedRouteLabel) return
    if (routeSummaries.length > 0) {
      setSelectedRouteLabel(routeSummaries[0].routeLabel)
      const parsed = parseClimbingRouteLabel(routeSummaries[0].routeLabel)
      setEditFacadeName(parsed.facadeName)
      setEditClimbingType(parsed.climbingType)
      setEditRouteName(parsed.routeName)
      setEditRouteProfile(parsed.routeProfile)
      setEditLikedStars(parsed.likedStars)
      setEditRouteGrade(parsed.routeGrade)
    }
  }, [routeSummaries, selectedRouteLabel])

  useEffect(() => {
    if (!selectedRouteLabel) return
    const parsed = parseClimbingRouteLabel(selectedRouteLabel)
    setEditFacadeName(parsed.facadeName)
    setEditClimbingType(parsed.climbingType)
    setEditRouteName(parsed.routeName)
    setEditRouteProfile(parsed.routeProfile)
    setEditLikedStars(parsed.likedStars)
    setEditRouteGrade(parsed.routeGrade)
  }, [selectedRouteLabel])

  const selectedAttempts = useMemo((): ClimbingAttempt[] => {
    if (!selectedRouteLabel) return []
    return attempts
      .filter((a) => a.routeLabel === selectedRouteLabel)
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [attempts, selectedRouteLabel])

  const selectedSummary = useMemo(() => {
    if (!selectedRouteLabel) return null
    return routeSummaries.find((s) => s.routeLabel === selectedRouteLabel) ?? null
  }, [routeSummaries, selectedRouteLabel])

  const selectedParsedRoute = useMemo(() => {
    if (!selectedRouteLabel) return null
    return parseClimbingRouteLabel(selectedRouteLabel)
  }, [selectedRouteLabel])

  const editFacadeSuggestions = useMemo(() => getFacadeSuggestions(editFacadeSearch), [editFacadeSearch])

  const addRouteFromModal = async (payload: IClimbingRouteLabelPayload) => {
    const facadeNameTrimmed = payload.facadeName.trim()
    const routeNameTrimmed = payload.routeName.trim()
    const routeProfileTrimmed = payload.routeProfile ?? 'autre'
    const likedStarsN = payload.likedStars ?? 3

    if (!facadeNameTrimmed || !payload.climbingType || !routeNameTrimmed || !payload.routeGrade) {
      throw new Error('Veuillez saisir nom de falaise, type, nom et cotation.')
    }

    await addClimbingRouteAttempts({
      facadeName: facadeNameTrimmed,
      routeType: payload.climbingType,
      routeName: routeNameTrimmed,
      routeGrade: payload.routeGrade,
      routeProfile: routeProfileTrimmed,
      likedStars: likedStarsN,
      successCount: 1,
      failCount: 0,
    })

    await loadAttempts()

    const nextLabel = buildClimbingRouteLabel({
      facadeName: facadeNameTrimmed,
      climbingType: payload.climbingType,
      routeName: routeNameTrimmed,
      routeGrade: payload.routeGrade,
      routeProfile: routeProfileTrimmed,
      likedStars: likedStarsN,
    })

    setSelectedRouteLabel(nextLabel)
    const parsed = parseClimbingRouteLabel(nextLabel)
    setEditFacadeName(parsed.facadeName)
    setEditClimbingType(parsed.climbingType)
    setEditRouteName(parsed.routeName)
    setEditRouteProfile(parsed.routeProfile)
    setEditLikedStars(parsed.likedStars)
    setEditRouteGrade(parsed.routeGrade)
  }

  const renameRoute = async () => {
    if (renameIsSubmitting || !selectedRouteLabel) return
    setError(null)
    try {
      setRenameIsSubmitting(true)
      const routeNameTrimmed = editRouteName.trim()
      const facadeNameTrimmed = editFacadeName.trim()
      const climbingTypeTrimmed = editClimbingType
      const routeGradeTrimmed = editRouteGrade
      const routeProfileTrimmed = editRouteProfile
      const likedStarsN = editLikedStars

      if (!facadeNameTrimmed || !climbingTypeTrimmed || !routeNameTrimmed || !routeGradeTrimmed) {
        setError('Veuillez saisir nom de falaise, type, nom et cotation.')
        return
      }

      const nextLabel = buildClimbingRouteLabel({
        facadeName: facadeNameTrimmed,
        climbingType: climbingTypeTrimmed,
        routeName: routeNameTrimmed,
        routeGrade: routeGradeTrimmed,
        routeProfile: routeProfileTrimmed,
        likedStars: likedStarsN,
      })

      await renameClimbingRouteLabel({ oldRouteLabel: selectedRouteLabel, newRouteLabel: nextLabel })
      await loadAttempts()
      setSelectedRouteLabel(nextLabel)
      setEditFacadeName(facadeNameTrimmed)
      setEditClimbingType(climbingTypeTrimmed)
      setEditRouteName(routeNameTrimmed)
      setEditRouteProfile(routeProfileTrimmed)
      setEditLikedStars(likedStarsN)
      setEditRouteGrade(routeGradeTrimmed)
      setIsEditFacadePickerOpen(false)
      setEditFacadeSearch('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRenameIsSubmitting(false)
    }
  }

  const deleteRoute = async () => {
    if (!selectedRouteLabel) return
    setError(null)
    setIsEditFacadePickerOpen(false)
    setEditFacadeSearch('')
    Alert.alert(
      'Supprimer la voie',
      `Supprimer toutes les tentatives pour "${selectedRouteLabel}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClimbingRouteLabel(selectedRouteLabel)
              await loadAttempts()
              setSelectedRouteLabel(null)
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e))
            }
          },
        },
      ],
      { cancelable: true }
    )
  }

  if (isLoadingAttempts) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.white }]}>
        <LoadingIndicator />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.white }]}>
      <View style={styles.pageTop}>
        <Text style={[styles.pageTitle, { color: colors.primary }]}>Voies en falaise</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setError(null)
            setIsAddModalVisible(true)
          }}
          style={[styles.addButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Text style={[styles.addButtonText, { color: colors.white }]}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={routeSummaries}
        keyExtractor={(item) => item.routeLabel}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isActive = item.routeLabel === selectedRouteLabel
          const parsed = parseClimbingRouteLabel(item.routeLabel)
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setSelectedRouteLabel(item.routeLabel)}
              style={[
                styles.routeCard,
                {
                  backgroundColor: isActive ? colors.primary : colors.white,
                  borderColor: isActive ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.routeLabel, { color: isActive ? colors.white : colors.black }]} numberOfLines={2}>
                {parsed.routeName || item.routeLabel}
              </Text>
              <Text style={[styles.routeMeta, { color: isActive ? colors.white : colors.grey }]}>
                {parsed.routeGrade} · {parsed.climbingType}
              </Text>
              {parsed.facadeName ? (
                <Text style={[styles.routeMeta, { color: isActive ? colors.white : colors.grey }]} numberOfLines={1}>
                  {parsed.facadeName}
                </Text>
              ) : null}
              {parsed.routeProfile ? (
                <Text style={[styles.routeMeta, { color: isActive ? colors.white : colors.grey }]} numberOfLines={1}>
                  {parsed.routeProfile}
                </Text>
              ) : null}
              <Text style={[styles.routeMeta, { color: isActive ? colors.white : colors.grey }]} numberOfLines={1}>
                {parsed.likedStars}/5 étoiles
              </Text>
              <Text style={[styles.routeMeta, { color: isActive ? colors.white : colors.grey }]}>
                {item.successCount} succès · {item.failCount} échecs
              </Text>
            </TouchableOpacity>
          )
        }}
        ListFooterComponent={
          <View style={{ paddingBottom: 24 }}>
            {selectedSummary ? (
              <View style={[styles.panel, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.panelTitle, { color: colors.black }]}>Voie sélectionnée</Text>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectedLabel, { color: colors.black }]} numberOfLines={3}>
                      {selectedParsedRoute?.routeName || selectedSummary.routeLabel}
                    </Text>
                    <Text style={[styles.selectedMeta, { color: colors.grey }]}>
                      {selectedParsedRoute?.routeGrade} · {selectedParsedRoute?.climbingType}
                    </Text>
                    {selectedParsedRoute?.routeProfile ? (
                      <Text style={[styles.selectedMeta, { color: colors.grey }]} numberOfLines={1}>
                        {selectedParsedRoute.routeProfile}
                      </Text>
                    ) : null}
                    <Text style={[styles.selectedMeta, { color: colors.grey }]} numberOfLines={1}>
                      {selectedParsedRoute?.likedStars ?? 0}/5 étoiles
                    </Text>
                    <Text style={[styles.selectedMeta, { color: colors.grey }]}>
                      {selectedSummary.successCount} succès · {selectedSummary.failCount} échecs
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.grey }]}>Modifier (renommer)</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsEditFacadePickerOpen(true)
                    setEditFacadeSearch('')
                  }}
                  style={[styles.facadeDisplay, { backgroundColor: colors.white, borderColor: colors.lightGrey }]}
                >
                  <Text style={{ color: editFacadeName ? colors.black : colors.grey, fontWeight: '700' }} numberOfLines={1}>
                    {editFacadeName || 'Nom de la falaise'}
                  </Text>
                </TouchableOpacity>

                {isEditFacadePickerOpen ? (
                  <View style={[styles.facadeDropdown, { borderColor: colors.cardBorder, backgroundColor: colors.white }]}>
                    <TextInput
                      mode="flat"
                      value={editFacadeSearch}
                      onChangeText={setEditFacadeSearch}
                      placeholder="Rechercher..."
                      textColor={colors.black}
                      style={[styles.textInput, { backgroundColor: colors.white, borderColor: colors.lightGrey, marginBottom: 8 }]}
                    />
                    {editFacadeSuggestions.length > 0 ? (
                      <View style={[styles.suggestionsBox, { borderColor: colors.cardBorder, backgroundColor: colors.white, marginBottom: 0 }]}>
                        {editFacadeSuggestions.map((s) => (
                          <TouchableOpacity
                            key={s}
                            activeOpacity={0.7}
                            onPress={() => {
                              Keyboard.dismiss()
                              setEditFacadeName(s)
                              setIsEditFacadePickerOpen(false)
                            }}
                            style={styles.suggestionItem}
                          >
                            <Text style={{ color: colors.black, fontWeight: '700', fontSize: 13 }}>{s}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ color: colors.grey, fontWeight: '700', fontSize: 13, paddingVertical: 8 }}>Aucun résultat</Text>
                    )}
                  </View>
                ) : null}
                <View style={styles.typeRow}>
                  {(['bloc', 'falaise', 'grande voie'] as const).map((t) => {
                    const isActive = editClimbingType === t
                    return (
                      <TouchableOpacity
                        key={t}
                        activeOpacity={0.7}
                        onPress={() => setEditClimbingType(t)}
                        style={[
                          styles.typeButton,
                          {
                            backgroundColor: isActive ? colors.primary : colors.white,
                            borderColor: isActive ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text style={{ color: isActive ? colors.white : colors.black, fontWeight: '800', fontSize: 12 }}>{t}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <TextInput
                  mode="flat"
                  value={editRouteName}
                  onChangeText={setEditRouteName}
                  textColor={colors.black}
                  placeholder="Nom"
                  style={[styles.textInput, { backgroundColor: colors.white, borderColor: colors.lightGrey }]}
                />
                <TextInput
                  mode="flat"
                  value={editRouteGrade}
                  onChangeText={(v) => setEditRouteGrade(toClimbingGrade(v))}
                  textColor={colors.black}
                  placeholder="Cotation (ex: 6a)"
                  style={[styles.textInput, { backgroundColor: colors.white, borderColor: colors.lightGrey }]}
                />
                <View style={styles.profileGrid}>
                  {PROFILE_OPTIONS.map((p) => {
                    const isActive = editRouteProfile === p
                    return (
                      <TouchableOpacity
                        key={p}
                        activeOpacity={0.7}
                        onPress={() => setEditRouteProfile(p)}
                        style={[
                          styles.profileButton,
                          {
                            backgroundColor: isActive ? colors.primary : colors.white,
                            borderColor: isActive ? colors.primary : colors.cardBorder,
                          },
                        ]}
                      >
                        <Text style={{ color: isActive ? colors.white : colors.black, fontWeight: '800', fontSize: 12 }}>{p}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
                <View style={styles.starsRow}>
                  {([1, 2, 3, 4, 5] as const).map((n) => {
                    const isActive = editLikedStars >= n
                    return (
                      <TouchableOpacity key={n} activeOpacity={0.7} onPress={() => setEditLikedStars(n)} style={styles.starButton}>
                        <MaterialIcons name="star" size={22} color={isActive ? colors.primary : colors.lightGrey} />
                      </TouchableOpacity>
                    )
                  })}
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={renameRoute}
                    disabled={renameIsSubmitting}
                    style={[styles.actionButton, { backgroundColor: colors.primary, opacity: renameIsSubmitting ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.white }]}>{renameIsSubmitting ? 'Renommage...' : 'Enregistrer'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={deleteRoute}
                    disabled={renameIsSubmitting}
                    style={[styles.actionButton, { backgroundColor: colors.danger, opacity: renameIsSubmitting ? 0.6 : 1 }]}
                  >
                    <Text style={[styles.actionButtonText, { color: colors.white }]}>Supprimer</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.grey }]}>Dernières tentatives</Text>
                {selectedAttempts.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune tentative.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {selectedAttempts.slice(0, 6).map((a) => (
                      <View
                        key={a.id}
                        style={[
                          styles.attemptRow,
                          {
                            borderColor: a.status === 'success' ? colors.primary : colors.danger,
                          },
                        ]}
                      >
                        <Text style={[styles.attemptStatus, { color: a.status === 'success' ? colors.primary : colors.danger }]}>
                          {a.status === 'success' ? 'Succès' : 'Echec'}
                        </Text>
                        <Text style={[styles.attemptDate, { color: colors.grey }]}>{formatDate(a.createdAt)}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {!isAddModalVisible && error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
              </View>
            ) : (
              <View style={[styles.panel, { borderColor: colors.cardBorder }]}>
                <Text style={[styles.panelTitle, { color: colors.black }]}>Voie sélectionnée</Text>
                <Text style={[styles.emptyText, { color: colors.grey }]}>Crée une voie via le bouton Ajouter.</Text>
                {!isAddModalVisible && error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: 20, paddingVertical: 28 }}>
            <Text style={[styles.emptyText, { color: colors.grey }]}>Aucune voie pour le moment. Ajoute-en une.</Text>
          </View>
        }
      />

      <ClimbingRouteAddModal visible={isAddModalVisible} onDismiss={() => setIsAddModalVisible(false)} onAddRoute={addRouteFromModal} />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pageTop: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  addButton: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },
  panel: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  textInput: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  textInputSmall: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  smallCol: {
    flex: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typeButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  profileButton: {
    flexBasis: '30%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facadeDisplay: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  facadeDropdown: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    marginBottom: 6,
  },
  suggestionsBox: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: -2,
    overflow: 'hidden',
    maxHeight: 160,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00000010',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  starButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectedLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedMeta: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalError: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 6,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  routeCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  routeLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  routeMeta: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  attemptRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  attemptStatus: {
    fontSize: 13,
    fontWeight: '800',
  },
  attemptDate: {
    fontSize: 13,
    fontWeight: '600',
  },
})
