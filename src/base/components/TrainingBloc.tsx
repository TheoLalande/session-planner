import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LightColors } from '../constants/theme'
import { SecondaryRoundButton } from './SecondaryRoundButton'
import { TrainingBlocItem } from './TrainingBlocItem'
import { useTrainingStore } from '../store/trainingStore'
import { useRouter } from 'expo-router'
import { haptic } from '../utils/haptics'
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist'
import { TrainingExercise } from '../types/trainingTypes'

type TrainingBlocProps = {
  blocId: number
  title: string
  onPressAddExercise: () => void
  onDeleteBloc: () => void
}

export const TrainingBloc = ({ blocId, title, onPressAddExercise, onDeleteBloc }: TrainingBlocProps) => {
  const exercises = useTrainingStore((state) => state.blocs.find((b) => b.id === blocId)?.exercises || [])
  const ensureExerciseIds = useTrainingStore((state) => state.ensureExerciseIds)
  const renameBloc = useTrainingStore((state) => state.renameBloc)
  const duplicateExerciseInBloc = useTrainingStore((state) => state.duplicateExerciseInBloc)
  const reorderExercisesInBloc = useTrainingStore((state) => state.reorderExercisesInBloc)
  const router = useRouter()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(title)
  const hasMissingExerciseIds = useMemo(
    () => exercises.some((exercise) => Number(exercise.data?.id ?? 0) <= 0),
    [exercises],
  )

  useEffect(() => {
    if (hasMissingExerciseIds) {
      ensureExerciseIds()
    }
  }, [ensureExerciseIds, hasMissingExerciseIds])

  const renderExerciseItem = ({ item, getIndex, drag, isActive }: RenderItemParams<TrainingExercise>) => {
    return (
      <View style={[styles.exerciseRow, isActive && styles.activeExerciseRow]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ flex: 1 }}
          onPress={async () => {
            const index = getIndex()
            if (index == null || index < 0) return
            await haptic('tap')
            router.push({
              pathname: '/create-exercice',
              params: {
                mode: 'edit-bloc',
                blocId: String(blocId),
                exerciseIndex: String(index),
              },
            })
          }}
        >
          <TrainingBlocItem exercise={item} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => {
            const index = getIndex()
            if (index == null || index < 0) return
            await haptic('tap')
            duplicateExerciseInBloc(blocId, index)
          }}
          style={styles.duplicateButton}
        >
          <MaterialCommunityIcons name="content-duplicate" size={18} color={LightColors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onLongPress={() => {
            drag()
            haptic('tap')
          }}
          delayLongPress={120}
          style={styles.dragHandleButton}
        >
          <MaterialCommunityIcons name="drag-vertical" size={20} color={LightColors.grey} />
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {isEditingTitle ? (
          <TextInput
            style={styles.titleInput}
            value={localTitle}
            onChangeText={setLocalTitle}
            autoFocus
            onBlur={() => {
              const trimmed = localTitle.trim()
              const nextTitle = trimmed || title
              setLocalTitle(nextTitle)
              renameBloc(blocId, nextTitle)
              setIsEditingTitle(false)
            }}
            returnKeyType="done"
            onSubmitEditing={() => {
              const trimmed = localTitle.trim()
              const nextTitle = trimmed || title
              setLocalTitle(nextTitle)
              renameBloc(blocId, nextTitle)
              setIsEditingTitle(false)
            }}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.titlePressable}
            onPress={() => {
              setLocalTitle(title)
              setIsEditingTitle(true)
            }}
          >
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
          </TouchableOpacity>
        )}
        <View style={styles.headerActions}>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{exercises.length}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={async () => {
              await haptic('tap')
              onDeleteBloc()
            }}
            style={styles.deleteButton}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={LightColors.danger} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ width: '100%' }}>
        <View style={styles.square}>
          <View style={styles.exercisesContainer}>
            <DraggableFlatList
              data={exercises}
              keyExtractor={(item, index) => {
                const exerciseId = Number(item.data?.id ?? 0)
                if (exerciseId > 0) {
                  return `${blocId}-${item.type}-${exerciseId}`
                }
                return `${blocId}-${item.type}-tmp-${index}`
              }}
              renderItem={renderExerciseItem}
              onDragEnd={({ data }) => {
                reorderExercisesInBloc(blocId, data)
              }}
              scrollEnabled={false}
              activationDistance={1000}
              containerStyle={{ width: '100%' }}
            />
          </View>
          <SecondaryRoundButton blocId={blocId} onPress={onPressAddExercise} color={LightColors.primary} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  square: {
    width: '100%',
    backgroundColor: LightColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
    padding: 12,
    minHeight: 100,
    justifyContent: 'center',
    shadowColor: LightColors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  titlePressable: {
    flex: 1,
    paddingLeft: 4,
    paddingRight: 8,
  },
  title: {
    color: LightColors.black,
    fontSize: 17,
    fontWeight: '700',
  },
  titleInput: {
    flex: 1,
    color: LightColors.black,
    fontSize: 17,
    paddingLeft: 4,
    paddingRight: 8,
    fontWeight: '700',
    borderBottomWidth: 1,
    borderBottomColor: LightColors.primary,
  },
  countBadge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightColors.badgeBackground,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: LightColors.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LightColors.softDangerBackground,
    borderWidth: 1,
    borderColor: LightColors.softDangerBorder,
  },
  exercisesContainer: {
    width: '100%',
  },
  exerciseRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  activeExerciseRow: {
    backgroundColor: LightColors.activeRowBackground,
  },
  duplicateButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: LightColors.headerButtonBackground,
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
  },
  dragHandleButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: LightColors.headerButtonBackground,
    borderWidth: 1,
    borderColor: LightColors.cardBorder,
  },
})
