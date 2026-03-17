import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import { IPlannedTraining, ITrainingBloc, TrainingExercise } from '../types/trainingTypes'

type TrainingState = {
  blocs: ITrainingBloc[]
  trainings: IPlannedTraining[]
  editingBlocId: number | null
  editingTrainingId: number | null
  addBloc: (title: string) => void
  setEditingBlocId: (id: number | null) => void
  startEditingTraining: (trainingId: number) => void
  renameBloc: (blocId: number, title: string) => void
  addExerciseToBloc: (blocId: number, exercise: TrainingExercise) => void
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
      addBloc: (title: string) =>
        set((state) => {
          const id = state.blocs.length ? state.blocs[state.blocs.length - 1].id + 1 : 1
          return {
            ...state,
            blocs: [...state.blocs, { id, title, exercises: [] }],
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
        set((state) => ({
          ...state,
          blocs: state.blocs.map((bloc) => (bloc.id === blocId ? { ...bloc, title } : bloc)),
        })),
      addExerciseToBloc: (blocId, exercise) =>
        set((state) => ({
          ...state,
          blocs: state.blocs.map((bloc) =>
            bloc.id === blocId ? { ...bloc, exercises: [...bloc.exercises, exercise] } : bloc,
          ),
        })),
      duplicateExerciseInBloc: (blocId, exerciseIndex) =>
        set((state) => ({
          ...state,
          blocs: state.blocs.map((bloc) => {
            if (bloc.id !== blocId) {
              return bloc
            }
            if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) {
              return bloc
            }
            const source = bloc.exercises[exerciseIndex]
            const duplicated: TrainingExercise = {
              ...source,
              data: { ...(source as any).data },
            } as TrainingExercise

            const nextExercises = [...bloc.exercises]
            nextExercises.splice(exerciseIndex + 1, 0, duplicated)
            return {
              ...bloc,
              exercises: nextExercises,
            }
          }),
        })),
      updateExerciseInBloc: (blocId, exerciseIndex, exercise) =>
        set((state) => ({
          ...state,
          blocs: state.blocs.map((bloc) => {
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
        })),
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
        set((state) => ({
          ...state,
          blocs: state.blocs.filter((bloc) => bloc.id !== blocId),
        })),
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

