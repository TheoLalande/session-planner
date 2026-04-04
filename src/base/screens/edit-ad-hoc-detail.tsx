import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { TextField } from '../components'
import { PrimaryButton } from '../components/PrimaryButton'
import LoadingIndicator from '../components/LoadingIndicator'
import { ActivityIndicator } from 'react-native-paper'
import { useAppTheme } from '../providers/themeProvider'
import { useClimbingAttemptsStore } from '../store/climbingAttemptsStore'
import {
  fetchAdHocClimbingAttemptById,
  updateAdHocClimbingAttempt,
} from '../api/climbingAttemptsService'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'

type ClimbingType = 'bloc' | 'voie' | 'grande voie'
type RouteProfile = 'dalle' | 'verticale' | 'devers' | 'toit'
type AttemptStatus = 'Réussi' | 'Echoué'
type LocationType = 'salle' | 'exterieur'

const CLIMBING_TYPES: ClimbingType[] = ['bloc', 'voie', 'grande voie']
const ROUTE_PROFILES: RouteProfile[] = ['dalle', 'verticale', 'devers', 'toit']
const ATTEMPT_STATUSES: AttemptStatus[] = ['Réussi', 'Echoué']
const LOCATION_TYPES: LocationType[] = ['salle', 'exterieur']

function parseClimbingType(v: string): ClimbingType {
  if (v === 'voie' || v === 'grande voie' || v === 'bloc') return v
  return 'bloc'
}

function parseRouteProfile(v: string): RouteProfile {
  if (v === 'dalle' || v === 'verticale' || v === 'devers' || v === 'toit') return v
  return 'verticale'
}

function parseLocationType(v: string): LocationType {
  return v === 'exterieur' ? 'exterieur' : 'salle'
}

export default function EditAdHocDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const attemptId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
  const { colors } = useAppTheme()
  const loadAttempts = useClimbingAttemptsStore((s) => s.loadAttempts)

  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [routeName, setRouteName] = useState('')
  const [grade, setGrade] = useState('6a')
  const [gradeTouched, setGradeTouched] = useState(false)
  const [climbingType, setClimbingType] = useState<ClimbingType>('bloc')
  const [routeProfile, setRouteProfile] = useState<RouteProfile>('verticale')
  const [status, setStatus] = useState<AttemptStatus>('Réussi')
  const [locationType, setLocationType] = useState<LocationType>('salle')
  const [attemptCount, setAttemptCount] = useState('1')
  const [attemptCountTouched, setAttemptCountTouched] = useState(false)
  const [climbedAt, setClimbedAt] = useState<Date>(new Date())
  const [isIosDateModalVisible, setIsIosDateModalVisible] = useState(false)
  const [pendingIosDate, setPendingIosDate] = useState<Date>(new Date())
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availableClimbingTypes = useMemo(() => {
    if (locationType === 'salle') {
      return CLIMBING_TYPES.filter((t) => t !== 'grande voie')
    }
    return CLIMBING_TYPES
  }, [locationType])

  useEffect(() => {
    if (locationType !== 'salle') {
      return
    }
    if (climbingType === 'grande voie') {
      setClimbingType('bloc')
    }
  }, [climbingType, locationType])

  const loadRow = useCallback(async () => {
    if (!attemptId) {
      setLoadState('error')
      return
    }
    setLoadState('loading')
    try {
      const row = await fetchAdHocClimbingAttemptById(attemptId)
      if (!row) {
        setLoadState('error')
        Alert.alert('Introuvable', 'Cette voie n’existe plus ou n’est pas modifiable.', [
          { text: 'OK', onPress: () => router.back() },
        ])
        return
      }
      setRouteName(row.locationType === 'salle' && row.routeName === 'SAE' ? '' : row.routeName)
      setGrade(row.grade)
      setGradeTouched(true)
      setClimbingType(parseClimbingType(row.climbingType))
      setRouteProfile(parseRouteProfile(row.routeProfile))
      setStatus(row.status === 'success' ? 'Réussi' : 'Echoué')
      setLocationType(parseLocationType(row.locationType))
      setAttemptCount(String(Math.max(1, row.attemptCount)))
      setAttemptCountTouched(true)
      setClimbedAt(new Date(row.performedAt))
      setNotes(row.notes ?? '')
      setLoadState('ready')
    } catch (e) {
      setLoadState('error')
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Chargement impossible')
    }
  }, [attemptId])

  useEffect(() => {
    void loadRow()
  }, [loadRow])

  const formattedClimbedAt = useMemo(() => {
    return climbedAt.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }, [climbedAt])

  const isValid = useMemo(() => {
    const count = Number(attemptCount)
    const hasRouteName = locationType === 'salle' ? true : routeName.trim().length > 0
    return hasRouteName && grade.trim().length > 0 && Number.isFinite(count) && count >= 1
  }, [attemptCount, grade, locationType, routeName])

  const openDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: climbedAt,
        mode: 'date',
        is24Hour: true,
        maximumDate: new Date(),
        onChange: (_, selectedDate) => {
          if (selectedDate) {
            setClimbedAt(selectedDate)
          }
        },
      })
      return
    }

    setPendingIosDate(climbedAt)
    setIsIosDateModalVisible(true)
  }

  const saveAttempt = async () => {
    if (!attemptId || !isValid || isSubmitting || loadState !== 'ready') return
    setIsSubmitting(true)
    try {
      const count = Math.max(1, Math.floor(Number(attemptCount)))
      const routeNameToSave = locationType === 'salle' ? 'SAE' : routeName.trim()
      const statusForDb = status === 'Réussi' ? 'success' : 'fail'
      const notesValue = notes.trim() === '' ? null : notes.trim()
      await updateAdHocClimbingAttempt(attemptId, {
        routeName: routeNameToSave,
        grade: grade.trim(),
        climbingType,
        routeProfile,
        locationType,
        attemptCount: count,
        performedAt: climbedAt,
        notes: notesValue,
        status: statusForDb,
      })
      void loadAttempts()
      Alert.alert('Enregistré', 'La voie a bien été mise à jour.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’enregistrer')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!attemptId) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.black }}>Paramètre manquant.</Text>
      </SafeAreaView>
    )
  }

  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <SafeAreaView style={[styles.screen, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator animating size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (loadState === 'error') {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => void loadRow()}
          style={[styles.retryBtn, { borderColor: colors.primary, alignSelf: 'flex-start' }]}
        >
          <Text style={[styles.retryText, { color: colors.primary }]}>Recharger</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.primary }]}>Modifier la voie</Text>
        <Text style={[styles.subtitle, { color: colors.grey }]}>Ajuste les infos puis enregistre.</Text>

        <View style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.grey }]}>Lieu</Text>
          <View style={styles.segmentedRow}>
            {LOCATION_TYPES.map((value) => {
              const isActive = locationType === value
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.7}
                  onPress={() => setLocationType(value)}
                  style={[
                    styles.segmentButton,
                    {
                      backgroundColor: isActive ? colors.primary : colors.white,
                      borderColor: isActive ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: isActive ? colors.white : colors.black }]}>{value}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          {locationType !== 'salle' ? <TextField placeholder="Nom de la voie" type="text" value={routeName} onChangeText={setRouteName} /> : null}
          <TextField
            placeholder="Cotation (ex: 6a)"
            type="text"
            value={grade}
            onFocus={() => {
              if (!gradeTouched) {
                setGrade('')
                setGradeTouched(true)
              }
            }}
            onChangeText={setGrade}
          />
          <TextField
            placeholder="Nombre de tentatives"
            type="number"
            value={attemptCount}
            onFocus={() => {
              if (!attemptCountTouched) {
                setAttemptCount('')
                setAttemptCountTouched(true)
              }
            }}
            onChangeText={setAttemptCount}
          />

          <Text style={[styles.sectionTitle, { color: colors.grey }]}>Date</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={openDatePicker}
            style={[styles.dateButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.dateText, { color: colors.black }]}>{formattedClimbedAt}</Text>
          </TouchableOpacity>

          <TextField placeholder="Notes (optionnel)" type="text" value={notes} onChangeText={setNotes} />

          <Text style={[styles.sectionTitle, { color: colors.grey }]}>{'Type d’escalade'}</Text>
          <View style={styles.segmentedRow}>
            {availableClimbingTypes.map((value) => {
              const isActive = climbingType === value
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.7}
                  onPress={() => setClimbingType(value)}
                  style={[
                    styles.segmentButton,
                    { backgroundColor: isActive ? colors.primary : colors.white, borderColor: isActive ? colors.primary : colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: isActive ? colors.white : colors.black }]}>{value}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.grey }]}>Profil de voie</Text>
          <View style={styles.segmentedWrapRow}>
            {ROUTE_PROFILES.map((value) => {
              const isActive = routeProfile === value
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.7}
                  onPress={() => setRouteProfile(value)}
                  style={[
                    styles.segmentWrapButton,
                    { backgroundColor: isActive ? colors.primary : colors.white, borderColor: isActive ? colors.primary : colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: isActive ? colors.white : colors.black }]}>{value}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.grey }]}>Résultat</Text>
          <View style={styles.segmentedRow}>
            {ATTEMPT_STATUSES.map((value) => {
              const isActive = status === value
              return (
                <TouchableOpacity
                  key={value}
                  activeOpacity={0.7}
                  onPress={() => setStatus(value)}
                  style={[
                    styles.segmentButton,
                    { backgroundColor: isActive ? colors.primary : colors.white, borderColor: isActive ? colors.primary : colors.cardBorder },
                  ]}
                >
                  <Text style={[styles.segmentText, { color: isActive ? colors.white : colors.black }]}>{value}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Enregistrer les modifications" onPress={saveAttempt} isClickable={isValid && !isSubmitting} />
        </View>
      </ScrollView>
      {isSubmitting ? (
        <View pointerEvents="none" style={[styles.loadingOverlay, { backgroundColor: colors.overlayLight }]}>
          <LoadingIndicator />
        </View>
      ) : null}

      <Modal
        visible={isIosDateModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsIosDateModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsIosDateModalVisible(false)}
          style={[styles.modalBackdrop, { backgroundColor: colors.overlayDark }]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={[styles.modalCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.black }]}>Choisir une date</Text>
            <DateTimePicker
              value={pendingIosDate}
              mode="date"
              display="inline"
              maximumDate={new Date()}
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setPendingIosDate(selectedDate)
                }
              }}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsIosDateModalVisible(false)}
                style={[styles.modalButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.black }]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setClimbedAt(pendingIosDate)
                  setIsIosDateModalVisible(false)
                }}
                style={[styles.modalButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.modalButtonText, { color: colors.white }]}>Valider</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  sectionTitle: {
    marginTop: 4,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  segmentedWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentWrapButton: {
    minWidth: '48%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateButton: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  actions: {
    marginTop: 14,
    alignItems: 'center',
    width: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  retryBtn: {
    margin: 20,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '800',
  },
})
