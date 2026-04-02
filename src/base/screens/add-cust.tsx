import React, { useEffect, useMemo, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { TextField } from '../components'
import { PrimaryButton } from '../components/PrimaryButton'
import LoadingIndicator from '../components/LoadingIndicator'
import { useAppTheme } from '../providers/themeProvider'
import { getSession } from '../api/authService'
import { getSupabaseClient } from '../api/supabaseClient'
import DateTimePicker from '@react-native-community/datetimepicker'

type ClimbingType = 'bloc' | 'voie' | 'grande voie'
type RouteProfile = 'dalle' | 'verticale' | 'devers' | 'toit'
type AttemptStatus = 'Réussi' | 'Echoué'
type LocationType = 'salle' | 'exterieur'

const CLIMBING_TYPES: ClimbingType[] = ['bloc', 'voie', 'grande voie']
const ROUTE_PROFILES: RouteProfile[] = ['dalle', 'verticale', 'devers', 'toit']
const ATTEMPT_STATUSES: AttemptStatus[] = ['Réussi', 'Echoué']
const LOCATION_TYPES: LocationType[] = ['salle', 'exterieur']

export default function AddCustomExercise() {
  const { colors } = useAppTheme()
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
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false)
  const [notes, setNotes] = useState('')
  const [notesTouched, setNotesTouched] = useState(false)
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

  const formattedClimbedAt = useMemo(() => {
    return climbedAt.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }, [climbedAt])

  const isValid = useMemo(() => {
    const count = Number(attemptCount)
    const hasRouteName = locationType === 'salle' ? true : routeName.trim().length > 0
    return hasRouteName && grade.trim().length > 0 && Number.isFinite(count) && count >= 1
  }, [attemptCount, grade, locationType, routeName])

  const saveAttempt = async () => {
    if (!isValid || isSubmitting) return
    setIsSubmitting(true)
    try {
      const session = await getSession()
      const userId = session.user?.id
      if (!userId) {
        throw new Error('Utilisateur non connecté')
      }
      const supabase = getSupabaseClient()
      const count = Math.max(1, Math.floor(Number(attemptCount)))
      const routeNameToSave = locationType === 'salle' ? 'SAE' : routeName.trim()
      const { error } = await supabase.from('climbing_attempts').insert({
        user_id: userId,
        source: 'ad_hoc',
        status,
        route_name: routeNameToSave,
        grade: grade.trim(),
        climbing_type: climbingType,
        route_profile: routeProfile,
        location_type: locationType,
        attempt_count: count,
        completed_at: climbedAt.toISOString(),
        notes: notesTouched ? notes.trim() : null,
      })
      if (error) {
        throw new Error(error.message)
      }
      Alert.alert('Ajout réussi', 'Ta voie a bien été enregistrée.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ])
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’enregistrer la voie')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.primary }]}>Ajouter une voie réalisée</Text>
        <Text style={[styles.subtitle, { color: colors.grey }]}>Ajoute une voie faite en dehors d’un entraînement.</Text>

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
            onPress={() => setIsDatePickerVisible(true)}
            style={[styles.dateButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.dateText, { color: colors.black }]}>{formattedClimbedAt}</Text>
          </TouchableOpacity>
          {isDatePickerVisible ? (
            <DateTimePicker
              value={climbedAt}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, selectedDate) => {
                setIsDatePickerVisible(false)
                if (selectedDate) {
                  setClimbedAt(selectedDate)
                }
              }}
            />
          ) : null}

          <TextField
            placeholder="Notes (optionnel)"
            type="text"
            value={notes}
            onChangeText={(value) => {
              setNotesTouched(true)
              setNotes(value)
            }}
          />

          <Text style={[styles.sectionTitle, { color: colors.grey }]}>Type d'escalade</Text>
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
          <PrimaryButton title="Enregistrer la voie" onPress={saveAttempt} isClickable={isValid && !isSubmitting} />
        </View>
      </ScrollView>
      {isSubmitting ? (
        <View pointerEvents="none" style={[styles.loadingOverlay, { backgroundColor: colors.overlayLight }]}>
          <LoadingIndicator />
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
})
