import React, { useEffect, useMemo, useState } from 'react'
import { Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { ActivityIndicator, Dialog, Portal, TextInput } from 'react-native-paper'
import { MaterialIcons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAppTheme } from '../providers/themeProvider'
import { TextField } from './TextField'
import { GradeStepper } from './GradeStepper'
import type { ClimbingRouteGrade, ClimbingRouteStars, ClimbingRouteType, IClimbingRouteLabelPayload } from '../types/climbingRoutesTypes'
import { ClimbingSpotEnum } from '../types/climbingRoutesTypes'

type ClimbingSpotType = IClimbingRouteLabelPayload['climbingType']

const CLIMBING_TYPES: ClimbingSpotType[] = ['bloc', 'falaise', 'grande voie']

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

const FACADE_OPTIONS: string[] = Object.values(ClimbingSpotEnum) as string[]

function getFacadeSuggestions(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return FACADE_OPTIONS.slice(0, 8)
  return FACADE_OPTIONS.filter((v) => v.toLowerCase().includes(q)).slice(0, 8)
}

function toStars(value: number | string | undefined | null): ClimbingRouteStars {
  const next = typeof value === 'number' ? value : Number(value ?? 0)
  const safe = Math.max(1, Math.min(5, Math.floor(next)))
  return (Number.isFinite(safe) ? safe : 3) as ClimbingRouteStars
}

export type ClimbingRouteAddModalProps = {
  visible: boolean
  onDismiss: () => void
  onAddRoute: (payload: IClimbingRouteLabelPayload) => Promise<void>
}

export function ClimbingRouteAddModal({ visible, onDismiss, onAddRoute }: ClimbingRouteAddModalProps) {
  const { colors } = useAppTheme()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const verticalGap = 56
  const dialogMaxHeight = Math.max(320, height - insets.top - insets.bottom - verticalGap * 2)

  const [facadeName, setFacadeName] = useState('')
  const [climbingType, setClimbingType] = useState<ClimbingSpotType>('falaise')
  const [isFacadePickerOpen, setIsFacadePickerOpen] = useState(false)
  const [facadeSearch, setFacadeSearch] = useState('')
  const [routeName, setRouteName] = useState('')
  const [routeGrade, setRouteGrade] = useState<ClimbingRouteGrade>('6a')
  const [routeProfile, setRouteProfile] = useState<ClimbingRouteType>('autre')
  const [likedStars, setLikedStars] = useState<ClimbingRouteStars>(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const facadeSuggestions = useMemo(() => getFacadeSuggestions(facadeSearch), [facadeSearch])

  const reset = () => {
    setFacadeName('')
    setClimbingType('falaise')
    setIsFacadePickerOpen(false)
    setFacadeSearch('')
    setRouteName('')
    setRouteGrade('6a')
    setRouteProfile('autre')
    setLikedStars(3)
    setIsSubmitting(false)
    setError(null)
  }

  useEffect(() => {
    if (!visible) return
    reset()
  }, [visible])

  const submit = async () => {
    if (isSubmitting) return
    setError(null)

    const facadeNameTrimmed = facadeName.trim()
    const routeNameTrimmed = routeName.trim()

    if (!facadeNameTrimmed || !climbingType || !routeNameTrimmed || !routeGrade) {
      setError('Veuillez saisir nom de falaise, type, nom et cotation.')
      return
    }

    try {
      setIsSubmitting(true)
      await onAddRoute({
        facadeName: facadeNameTrimmed,
        climbingType,
        routeName: routeNameTrimmed,
        routeGrade,
        routeProfile,
        likedStars,
      })
      setIsSubmitting(false)
      onDismiss()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={() => onDismiss()}
        style={[
          styles.dialog,
          {
            backgroundColor: colors.white,
            marginTop: insets.top + verticalGap,
            marginBottom: insets.bottom + verticalGap,
            maxHeight: dialogMaxHeight,
          },
        ]}
      >
        <Dialog.Title style={[styles.dialogTitle, { color: colors.black }]}>Ajouter une voie</Dialog.Title>
        <Dialog.Content>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            <View style={[styles.formCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}>
              {error ? <Text style={[styles.modalError, { color: colors.danger }]}>{error}</Text> : null}

              <Text style={[styles.fieldLabel, { color: colors.grey }]}>Falaise</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setIsFacadePickerOpen(true)
                  setFacadeSearch('')
                }}
                style={[styles.facadeDisplay, { backgroundColor: colors.white, borderColor: colors.lightGrey }]}
              >
                <View style={styles.facadeRow}>
                  <MaterialIcons name="place" size={20} color={facadeName ? colors.primary : colors.grey} />
                  <Text style={[styles.facadeText, { color: facadeName ? colors.black : colors.grey }]} numberOfLines={1}>
                    {facadeName || 'Nom de la falaise'}
                  </Text>
                  <MaterialIcons name={isFacadePickerOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={colors.grey} />
                </View>
              </TouchableOpacity>

              {isFacadePickerOpen ? (
                <View style={[styles.facadeDropdown, { borderColor: colors.cardBorder, backgroundColor: colors.white }]}>
                  <Text style={[styles.suggestionLabel, { color: colors.grey }]}>Rechercher</Text>
                  <TextInput
                    mode="flat"
                    value={facadeSearch}
                    onChangeText={setFacadeSearch}
                    placeholder="Tape un nom..."
                    textColor={colors.black}
                    style={[styles.facadeSearchInput, { backgroundColor: colors.white, borderColor: colors.lightGrey }]}
                  />

                  {facadeSuggestions.length > 0 ? (
                    <View style={[styles.suggestionsBox, { borderColor: colors.cardBorder, backgroundColor: colors.white, marginBottom: 0 }]}>
                      {facadeSuggestions.map((s) => (
                        <TouchableOpacity
                          key={s}
                          activeOpacity={0.7}
                          onPress={() => {
                            Keyboard.dismiss()
                            setFacadeName(s)
                            setIsFacadePickerOpen(false)
                          }}
                          style={[styles.suggestionItem, { borderBottomColor: colors.cardBorder }]}
                        >
                          <Text style={{ color: colors.black, fontWeight: '700', fontSize: 13 }}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: colors.grey, fontWeight: '700', fontSize: 13, paddingVertical: 10 }}>Aucun résultat</Text>
                  )}
                </View>
              ) : null}

              <Text style={[styles.fieldLabel, { color: colors.grey, marginTop: 10 }]}>Type</Text>
              <View style={styles.typeRow}>
                {CLIMBING_TYPES.map((t) => {
                  const isActive = climbingType === t
                  return (
                    <TouchableOpacity
                      key={t}
                      activeOpacity={0.7}
                      onPress={() => setClimbingType(t)}
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

              <Text style={[styles.fieldLabel, { color: colors.grey, marginTop: 10 }]}>Nom de la voie</Text>
              <TextField placeholder="Nom de la voie" value={routeName} onChangeText={setRouteName} type="text" />

              <GradeStepper value={routeGrade} onChange={(next) => setRouteGrade(toClimbingGrade(next))} />

              <Text style={[styles.fieldLabel, { color: colors.grey, marginTop: 10 }]}>Profil</Text>
              <View style={styles.profileGrid}>
                {PROFILE_OPTIONS.map((p) => {
                  const isActive = routeProfile === p
                  return (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.7}
                      onPress={() => setRouteProfile(p)}
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

              <Text style={[styles.fieldLabel, { color: colors.grey, marginTop: 10 }]}>Stars</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const nn = toStars(n)
                  const isActive = likedStars >= nn
                  return (
                    <TouchableOpacity
                      key={n}
                      activeOpacity={0.7}
                      onPress={() => setLikedStars(nn)}
                      style={[
                        styles.starButton,
                        {
                          backgroundColor: isActive ? colors.secondary : colors.white,
                          borderColor: isActive ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <MaterialIcons name="star" size={22} color={isActive ? colors.primary : colors.lightGrey} />
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </ScrollView>
        </Dialog.Content>

        <Dialog.Actions>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              reset()
              onDismiss()
            }}
            disabled={isSubmitting}
            style={[styles.modalActionButton, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
          >
            <Text style={[styles.modalActionText, { color: colors.black }]}>Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={submit}
            disabled={isSubmitting}
            style={[styles.modalActionButton, { backgroundColor: colors.primary, borderColor: colors.primary, opacity: isSubmitting ? 0.6 : 1 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator animating={true} color={colors.white} />
            ) : (
              <Text style={[styles.modalActionText, { color: colors.white }]}>Ajouter</Text>
            )}
          </TouchableOpacity>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    width: '92%',
    maxWidth: 460,
    alignSelf: 'center',
    marginVertical: 20,
  },
  dialogTitle: {
    fontWeight: '800',
    fontSize: 16,
  },
  scrollContent: {
    paddingTop: 6,
    paddingBottom: 10,
    alignItems: 'stretch',
    flexGrow: 1,
  },
  scrollView: {
    maxHeight: '100%',
  },
  formCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignSelf: 'stretch',
  },
  modalError: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  facadeDisplay: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  facadeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  facadeText: {
    flex: 1,
    fontWeight: '700',
    fontSize: 14,
  },
  facadeDropdown: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  facadeSearchInput: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
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
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: 90,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
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
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  starButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
  },
  modalActionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
})
