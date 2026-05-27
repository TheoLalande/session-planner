import React, { useMemo, useState } from 'react'
import { Alert, Modal, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Button, Surface, Text } from 'react-native-paper'
import DateTimePicker, { DateTimePickerAndroid } from './AppDatePicker'
import { createQuickSession } from '../api/quickSessionsService'
import { QUICK_LOG_EXERCISE_TYPES, getExerciseTypeLabel } from '../constants/exerciseTypeLabels'
import { useAppTheme } from '../providers/themeProvider'
import { ExerciseType } from '../types/trainingTypes'
import { haptic } from '../utils/haptics'
import { Fonts } from '../constants/theme'

function getTypeColor(type: ExerciseType, colors: ReturnType<typeof useAppTheme>['colors']) {
  if (type === 'warmup') return colors.warmup
  if (type === 'renforcement') return colors.renforcement
  if (type === 'strength') return colors.strength
  if (type === 'gainage') return colors.gainage
  if (type === 'stretching') return colors.stretching
  if (type === 'hangboard') return colors.hangboard
  return colors.climbing
}

export function QuickSessionLogForm() {
  const { colors } = useAppTheme()
  const styles = createStyles()
  const [selectedType, setSelectedType] = useState<ExerciseType | null>(null)
  const [sessionDate, setSessionDate] = useState<Date>(() => new Date())
  const [pendingIosDate, setPendingIosDate] = useState<Date>(() => new Date())
  const [isIosDateModalVisible, setIsIosDateModalVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formattedSessionDate = useMemo(
    () => sessionDate.toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    [sessionDate],
  )

  const canSubmit = selectedType !== null && !isSubmitting

  const openDatePicker = async () => {
    await haptic('tap')
    if (Platform.OS === 'android' || Platform.OS === 'web') {
      DateTimePickerAndroid.open({
        value: sessionDate,
        mode: 'date',
        is24Hour: true,
        maximumDate: new Date(),
        onChange: (_, selectedDate) => {
          if (selectedDate) {
            setSessionDate(selectedDate)
          }
        },
      })
      return
    }

    setPendingIosDate(sessionDate)
    setIsIosDateModalVisible(true)
  }

  const handleSelectType = async (type: ExerciseType) => {
    await haptic('tap')
    setSelectedType(type)
  }

  const handleSubmit = async () => {
    if (!selectedType || isSubmitting) {
      return
    }
    await haptic('tap')
    setIsSubmitting(true)
    try {
      await createQuickSession(selectedType, sessionDate)
      await haptic('success')
      Alert.alert(
        'Séance enregistrée',
        `${getExerciseTypeLabel(selectedType)} ajouté à tes stats pour le ${formattedSessionDate}.`,
      )
      setSelectedType(null)
      setSessionDate(new Date())
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’enregistrer la séance')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Surface style={[styles.card, { backgroundColor: colors.white, borderColor: colors.cardBorder }]} elevation={0}>
        <Text style={[styles.fieldLabel, { color: colors.grey }]}>Date de la séance</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openDatePicker}
          disabled={isSubmitting}
          style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
        >
          <MaterialCommunityIcons name="calendar-outline" size={20} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.black }]}>{formattedSessionDate}</Text>
        </TouchableOpacity>

        <Text style={[styles.fieldLabel, { color: colors.grey }]}>Type de séance</Text>
        <View style={styles.chipsGrid}>
          {QUICK_LOG_EXERCISE_TYPES.map((type) => {
            const typeColor = getTypeColor(type, colors)
            const isSelected = selectedType === type
            return (
              <TouchableOpacity
                key={type}
                activeOpacity={0.75}
                disabled={isSubmitting}
                onPress={() => handleSelectType(type)}
                style={[
                  styles.chip,
                  {
                    borderColor: isSelected ? typeColor : colors.cardBorder,
                    backgroundColor: isSelected ? `${typeColor}28` : colors.background,
                    opacity: isSubmitting ? 0.55 : 1,
                  },
                ]}
              >
                <View style={[styles.chipDot, { backgroundColor: typeColor }]} />
                <Text style={[styles.chipLabel, { color: colors.black }]}>{getExerciseTypeLabel(type)}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
          buttonColor={colors.primary}
          contentStyle={styles.submitButtonContent}
        >
          Enregistrer la séance
        </Button>
      </Surface>

      <Modal visible={isIosDateModalVisible} transparent animationType="fade" onRequestClose={() => setIsIosDateModalVisible(false)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsIosDateModalVisible(false)}
          style={[styles.modalBackdrop, { backgroundColor: colors.overlayDark }]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[styles.modalCard, { backgroundColor: colors.white, borderColor: colors.cardBorder }]}
          >
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
                  setSessionDate(pendingIosDate)
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
    </>
  )
}

const createStyles = () =>
  StyleSheet.create({
    card: {
      borderRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 10,
    },
    fieldLabel: {
      fontSize: 13,
      fontFamily: Fonts.poppins.medium,
      marginTop: 4,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    dateText: {
      fontSize: 15,
      fontFamily: Fonts.poppins.medium,
    },
    chipsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    chipDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    chipLabel: {
      fontSize: 13,
      fontFamily: Fonts.poppins.medium,
    },
    submitButtonContent: {
      minHeight: 44,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalCard: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 16,
      gap: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontFamily: Fonts.poppins.medium,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    modalButton: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: 14,
      fontFamily: Fonts.poppins.medium,
    },
  })
