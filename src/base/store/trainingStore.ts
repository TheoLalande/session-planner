import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import { IPlannedTraining, ITrainingBloc, TrainingExercise } from '../types/trainingTypes'

function getNextExerciseDataId(blocs: ITrainingBloc[]) {
  const maxId = blocs.reduce((acc, bloc) => {
    return bloc.exercises.reduce((innerAcc, exercise) => {
      return Math.max(innerAcc, Number(exercise.data?.id ?? 0))
    }, acc)
  }, 0)
  return maxId + 1
}

function withExerciseDataId(exercise: TrainingExercise, nextId: number): TrainingExercise {
  const currentId = Number(exercise.data?.id ?? 0)
  if (currentId > 0) {
    return exercise
  }
  return {
    ...exercise,
    data: {
      ...exercise.data,
      id: nextId,
    },
  } as TrainingExercise
}

type TrainingState = {
  blocs: ITrainingBloc[]
  trainings: IPlannedTraining[]
  editingBlocId: number | null
  editingTrainingId: number | null
  ensureExerciseIds: () => void
  clearEditingTraining: () => void
  addBloc: (title: string) => void
  addBlocWithMeta: (title: string, description: string, blocType: ITrainingBloc['blocType']) => void
  setEditingBlocId: (id: number | null) => void
  startEditingTraining: (trainingId: number) => void
  renameBloc: (blocId: number, title: string) => void
  addExerciseToBloc: (blocId: number, exercise: TrainingExercise) => void
  removeExerciseFromBloc: (blocId: number, exerciseIndex: number) => void
  moveExerciseInBloc: (blocId: number, fromIndex: number, toIndex: number) => void
  reorderExercisesInBloc: (blocId: number, exercises: TrainingExercise[]) => void
  duplicateExerciseInBloc: (blocId: number, exerciseIndex: number) => void
  updateExerciseInBloc: (blocId: number, exerciseIndex: number, exercise: TrainingExercise) => void
  updateExerciseInTraining: (
    trainingId: number,
    blocId: number,
    exerciseIndex: number,
    exercise: TrainingExercise,
  ) => void
  removeBloc: (blocId: number) => void
   removeTraining: (trainingId: number) => void
  saveTraining: (title: string, description: string) => void
  updateTraining: (title: string, description: string) => void
}

const secureStoreStorage = {
  getItem: async (name: string) => {
    const value = await SecureStore.getItemAsync(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await SecureStore.setItemAsync(name, value)
  },
  removeItem: async (name: string) => {
    await SecureStore.deleteItemAsync(name)
  },
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      blocs: [],
      trainings: [],
      editingBlocId: null,
      editingTrainingId: null,
      clearEditingTraining: () =>
        set(() => ({
          blocs: [],
          editingBlocId: null,
          editingTrainingId: null,
        })),
      ensureExerciseIds: () =>
        set((state) => {
          let nextId = getNextExerciseDataId(state.blocs)
          let hasChanges = false

          const nextBlocs = state.blocs.map((bloc) => {
            const nextExercises = bloc.exercises.map((exercise) => {
              const currentId = Number(exercise.data?.id ?? 0)
              if (currentId > 0) {
                return exercise
              }
              hasChanges = true
              const exerciseWithId = {
                ...exercise,
                data: {
                  ...exercise.data,
                  id: nextId++,
                },
              } as TrainingExercise
              return exerciseWithId
            })
            return { ...bloc, exercises: nextExercises }
          })

          if (!hasChanges) {
            return state
          }

          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      addBloc: (title: string) =>
        set((state) => {
          const id = state.blocs.length ? state.blocs[state.blocs.length - 1].id + 1 : 1
          const nextBlocs = [...state.blocs, { id, title, exercises: [] }]

          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      addBlocWithMeta: (title, description, blocType) =>
        set((state) => {
          const id = state.blocs.length ? state.blocs[state.blocs.length - 1].id + 1 : 1
          const nextBlocs = [
            ...state.blocs,
            {
              id,
              title,
              description: description.trim() || undefined,
              blocType: blocType ?? undefined,
              exercises: [],
            },
          ]

          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      setEditingBlocId: (id) =>
        set((state) => ({
          ...state,
          editingBlocId: id,
        })),
      startEditingTraining: (trainingId) =>
        set((state) => {
          const training = state.trainings.find((t) => t.id === trainingId)
          if (!training) {
            return state
          }
          return {
            ...state,
            editingTrainingId: trainingId,
            blocs: training.blocs,
          }
        }),
      renameBloc: (blocId, title) =>
        set((state) => {
          const nextBlocs = state.blocs.map((bloc) => (bloc.id === blocId ? { ...bloc, title } : bloc))
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      addExerciseToBloc: (blocId, exercise) =>
        set((state) => {
          const exerciseWithId = withExerciseDataId(exercise, getNextExerciseDataId(state.blocs))
          const nextBlocs = state.blocs.map((bloc) =>
            bloc.id === blocId ? { ...bloc, exercises: [...bloc.exercises, exerciseWithId] } : bloc,
          )
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      removeExerciseFromBloc: (blocId, exerciseIndex) =>
        set((state) => {
          const nextBlocs = state.blocs.map((bloc) => {
            if (bloc.id !== blocId) {
              return bloc
            }
            if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
              return bloc
            }
            const nextExercises = bloc.exercises.filter((_, index) => index !== exerciseIndex)
            return {
              ...bloc,
              exercises: nextExercises,
            }
          })
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      moveExerciseInBloc: (blocId, fromIndex, toIndex) =>
        set((state) => {
          const nextBlocs = state.blocs.map((bloc) => {
            if (bloc.id !== blocId) {
              return bloc
            }
            if (
              fromIndex < 0 ||
              toIndex < 0 ||
              fromIndex >= bloc.exercises.length ||
              toIndex >= bloc.exercises.length ||
              fromIndex === toIndex
            ) {
              return bloc
            }

            const nextExercises = [...bloc.exercises]
            const [movedExercise] = nextExercises.splice(fromIndex, 1)
            nextExercises.splice(toIndex, 0, movedExercise)

            return {
              ...bloc,
              exercises: nextExercises,
            }
          })
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      reorderExercisesInBloc: (blocId, exercises) =>
        set((state) => {
          const nextBlocs = state.blocs.map((bloc) => {
            if (bloc.id !== blocId) {
              return bloc
            }
            return {
              ...bloc,
              exercises,
            }
          })
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      duplicateExerciseInBloc: (blocId, exerciseIndex) =>
        set((state) => {
          const nextBlocs = state.blocs.map((bloc) => {
            if (bloc.id !== blocId) {
              return bloc
            }
            if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
              return bloc
            }
            const source = bloc.exercises[exerciseIndex]
            const duplicated: TrainingExercise = {
              ...source,
              data: { ...(source as any).data, id: getNextExerciseDataId(state.blocs) },
            } as TrainingExercise

            const nextExercises = [...bloc.exercises]
            nextExercises.splice(exerciseIndex + 1, 0, duplicated)
            return {
              ...bloc,
              exercises: nextExercises,
            }
          })
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      updateExerciseInBloc: (blocId, exerciseIndex, exercise) =>
        set((state) => {
          const nextBlocs = state.blocs.map((bloc) => {
            if (bloc.id !== blocId) {
              return bloc
            }
            if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
              return bloc
            }
            const updatedExercises = [...bloc.exercises]
            updatedExercises[exerciseIndex] = exercise
            return {
              ...bloc,
              exercises: updatedExercises,
            }
          })
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      updateExerciseInTraining: (trainingId, blocId, exerciseIndex, exercise) =>
        set((state) => ({
          ...state,
          trainings: state.trainings.map((training) => {
            if (training.id !== trainingId) {
              return training
            }
            return {
              ...training,
              blocs: training.blocs.map((bloc) => {
                if (bloc.id !== blocId) {
                  return bloc
                }
                if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
                  return bloc
                }
                const updatedExercises = [...bloc.exercises]
                updatedExercises[exerciseIndex] = exercise
                return {
                  ...bloc,
                  exercises: updatedExercises,
                }
              }),
            }
          }),
        })),
      removeBloc: (blocId) =>
        set((state) => {
          const nextBlocs = state.blocs.filter((bloc) => bloc.id !== blocId)
          const nextTrainings =
            state.editingTrainingId == null
              ? state.trainings
              : state.trainings.map((training) =>
                  training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training,
                )

          return {
            ...state,
            blocs: nextBlocs,
            trainings: nextTrainings,
          }
        }),
      removeTraining: (trainingId) =>
        set((state) => ({
          ...state,
          trainings: state.trainings.filter((training) => training.id !== trainingId),
        })),
      saveTraining: (title, description) =>
        set((state) => {
          const id = state.trainings.length ? state.trainings[state.trainings.length - 1].id + 1 : 1
          const newTraining: IPlannedTraining = {
            id,
            title,
            description,
            blocs: state.blocs,
          }
          return {
            ...state,
            trainings: [...state.trainings, newTraining],
            blocs: [],
            editingTrainingId: null,
          }
        }),
      updateTraining: (title, description) =>
        set((state) => {
          if (state.editingTrainingId == null) {
            return state
          }
          return {
            ...state,
            trainings: state.trainings.map((training) =>
              training.id === state.editingTrainingId
                ? {
                    ...training,
                    title,
                    description,
                    blocs: state.blocs,
                  }
                : training,
            ),
            blocs: [],
            editingTrainingId: null,
          }
        }),
    }),
    {
      name: 'training-storage',
      storage: createJSONStorage(() => secureStoreStorage as never),
      partialize: (state) => ({
        blocs: state.blocs,
        trainings: state.trainings,
      }),
    },
  ),
)

