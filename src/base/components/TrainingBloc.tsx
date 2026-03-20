import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
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
            // On déclenche le haptique sans await pour ne pas perturber la gesture drag
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
      <Swipeable
        containerStyle={{ width: '100%' }}
        overshootLeft={false}
        overshootRight={false}
        onSwipeableOpen={(direction) => {
          if (direction === 'left' || direction === 'right') {
            onDeleteBloc()
          }
        }}
        renderLeftActions={() => <View style={styles.deleteBackground} />}
        renderRightActions={() => <View style={styles.deleteBackground} />}
      >
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
                activationDistance={8}
                containerStyle={{ width: '100%' }}
              />
            </View>
            <SecondaryRoundButton blocId={blocId} onPress={onPressAddExercise} color={LightColors.primary} />
          </View>
        </View>
      </Swipeable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'flex-start',
  },
  square: {
    width: '100%',
    backgroundColor: LightColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LightColors.primary,
    padding: 12,
    minHeight: 100,
    justifyContent: 'center',
  },
  title: {
    color: LightColors.black,
    fontSize: 16,
    paddingLeft: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  titleInput: {
    color: LightColors.black,
    fontSize: 16,
    paddingLeft: 12,
    textAlign: 'center',
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: LightColors.primary,
  },
  exercisesContainer: {
    width: '100%',
  },
  exerciseRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeExerciseRow: {
    opacity: 0.85,
  },
  duplicateButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
  },
  dragHandleButton: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 10,
  },
  deleteBackground: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 12,
  },
})
