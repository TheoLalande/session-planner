import { create } from 'zustand'
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

export const useTrainingStore = create<TrainingState>((set) => ({
  blocs: [],
  trainings: [],
  editingBlocId: null,
  addBloc: (title: string) =>
    set((state) => {
      const id = state.blocs.length ? state.blocs[state.blocs.length - 1].id + 1 : 1
      return {
        blocs: [...state.blocs, { id, title, exercises: [] }],
      }
    }),
  setEditingBlocId: (id) => set({ editingBlocId: id }),
  addExerciseToBloc: (blocId, exercise) =>
    set((state) => ({
      blocs: state.blocs.map((bloc) =>
        bloc.id === blocId ? { ...bloc, exercises: [...bloc.exercises, exercise] } : bloc,
      ),
    })),
  removeBloc: (blocId) =>
    set((state) => ({
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
        trainings: [...state.trainings, newTraining],
        blocs: [],
      }
    }),
}))

