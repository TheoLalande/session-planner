import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { LightColors } from '../constants/theme'
import { SecondaryRoundButton } from './SecondaryRoundButton'
import { TrainingBlocItem } from './TrainingBlocItem'
import { useTrainingStore } from '../store/trainingStore'
import { useRouter } from 'expo-router'

type TrainingBlocProps = {
  blocId: number
  title: string
  onPressAddExercise: () => void
  onDeleteBloc: () => void
}

export const TrainingBloc = ({ blocId, title, onPressAddExercise, onDeleteBloc }: TrainingBlocProps) => {
  const exercises = useTrainingStore((state) => state.blocs.find((b) => b.id === blocId)?.exercises || [])
  const renameBloc = useTrainingStore((state) => state.renameBloc)
  const router = useRouter()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [localTitle, setLocalTitle] = useState(title)

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
              {exercises.map((exercise, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/create-exercice',
                      params: {
                        mode: 'edit-bloc',
                        blocId: String(blocId),
                        exerciseIndex: String(index),
                      },
                    })
                  }
                >
                  <TrainingBlocItem exercise={exercise} />
                </TouchableOpacity>
              ))}
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
  deleteBackground: {
    flex: 1,
    backgroundColor: '#ff3b30',
    borderRadius: 12,
  },
})
