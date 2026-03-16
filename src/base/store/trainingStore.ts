import { create } from 'zustand'
import { ExerciceTypes, ITrainingBloc, TrainingExercise } from '../types/trainingTypes'

type TrainingState = {
  blocs: ITrainingBloc[]
  editingBlocId: number | null
  addBloc: (title: string) => void
  setEditingBlocId: (id: number | null) => void
  addExerciseToBloc: (blocId: number, exercise: TrainingExercise) => void
}

export const useTrainingStore = create<TrainingState>((set) => ({
  blocs: [],
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
}))

