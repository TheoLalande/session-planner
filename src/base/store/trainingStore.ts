import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import * as SecureStore from 'expo-secure-store'
import { IPlannedTraining, ITrainingBloc, TrainingExercise } from '../types/trainingTypes'

type TrainingState = {
  blocs: ITrainingBloc[]
  trainings: IPlannedTraining[]
  editingBlocId: number | null
  addBloc: (title: string) => void
  setEditingBlocId: (id: number | null) => void
  addExerciseToBloc: (blocId: number, exercise: TrainingExercise) => void
  removeBloc: (blocId: number) => void
  saveTraining: (title: string, description: string) => void
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
      addExerciseToBloc: (blocId, exercise) =>
        set((state) => ({
          ...state,
          blocs: state.blocs.map((bloc) =>
            bloc.id === blocId ? { ...bloc, exercises: [...bloc.exercises, exercise] } : bloc,
          ),
        })),
      removeBloc: (blocId) =>
        set((state) => ({
          ...state,
          blocs: state.blocs.filter((bloc) => bloc.id !== blocId),
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

