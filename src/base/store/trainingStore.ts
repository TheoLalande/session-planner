import { create } from 'zustand'
import { IPlannedTraining, ITrainingBloc, TrainingExercise } from '../types/trainingTypes'
import { createTraining, deleteTrainingById, fetchTrainings, updateTrainingById } from '../api/trainingService'

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
  isLoadingTrainings: boolean
  editingBlocId: number | null
  editingTrainingId: string | null
  loadTrainings: () => Promise<void>
  ensureExerciseIds: () => void
  clearEditingTraining: () => void
  addBloc: (title: string) => void
  addBlocWithMeta: (title: string, description: string, blocType: ITrainingBloc['blocType']) => void
  setEditingBlocId: (id: number | null) => void
  startEditingTraining: (trainingId: string) => void
  renameBloc: (blocId: number, title: string) => void
  addExerciseToBloc: (blocId: number, exercise: TrainingExercise) => void
  removeExerciseFromBloc: (blocId: number, exerciseIndex: number) => void
  removeExerciseFromTraining: (trainingId: string, blocId: number, exerciseIndex: number) => Promise<void>
  moveExerciseInBloc: (blocId: number, fromIndex: number, toIndex: number) => void
  reorderExercisesInBloc: (blocId: number, exercises: TrainingExercise[]) => void
  duplicateExerciseInBloc: (blocId: number, exerciseIndex: number) => void
  updateExerciseInBloc: (blocId: number, exerciseIndex: number, exercise: TrainingExercise) => void
  updateExerciseInTraining: (
    trainingId: string,
    blocId: number,
    exerciseIndex: number,
    exercise: TrainingExercise,
  ) => Promise<void>
  removeBloc: (blocId: number) => void
  removeTraining: (trainingId: string) => Promise<void>
  saveTraining: (title: string, description: string, transitionSecondsBetweenTimers: number) => Promise<void>
  updateTraining: (title: string, description: string, transitionSecondsBetweenTimers: number) => Promise<void>
}

export const useTrainingStore = create<TrainingState>()((set, get) => ({
  blocs: [],
  trainings: [],
  isLoadingTrainings: false,
  editingBlocId: null,
  editingTrainingId: null,
  loadTrainings: async () => {
    set({ isLoadingTrainings: true })
    try {
      const trainings = await fetchTrainings()
      set({ trainings })
    } finally {
      set({ isLoadingTrainings: false })
    }
  },
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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

      return {
        ...state,
        blocs: nextBlocs,
        trainings: nextTrainings,
      }
    }),
  addExerciseToBloc: (blocId, exercise) =>
    set((state) => {
      const exerciseWithId = withExerciseDataId(exercise, getNextExerciseDataId(state.blocs))
      const nextBlocs = state.blocs.map((bloc) => (bloc.id === blocId ? { ...bloc, exercises: [...bloc.exercises, exerciseWithId] } : bloc))
      const nextTrainings =
        state.editingTrainingId == null
          ? state.trainings
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

      return {
        ...state,
        blocs: nextBlocs,
        trainings: nextTrainings,
      }
    }),
  removeExerciseFromTraining: async (trainingId, blocId, exerciseIndex) => {
    const state = get()
    const training = state.trainings.find((t) => t.id === trainingId)
    if (!training) return
    const nextBlocs = training.blocs.map((bloc) => {
      if (bloc.id !== blocId) return bloc
      if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) return bloc
      return { ...bloc, exercises: bloc.exercises.filter((_, idx) => idx !== exerciseIndex) }
    })
    const nextTraining = { ...training, blocs: nextBlocs }
    await updateTrainingById(trainingId, {
      title: nextTraining.title,
      description: nextTraining.description,
      blocs: nextTraining.blocs,
      transitionSecondsBetweenTimers: nextTraining.transitionSecondsBetweenTimers ?? 5,
    })
    set((current) => ({
      ...current,
      trainings: current.trainings.map((t) => (t.id === trainingId ? nextTraining : t)),
    }))
  },
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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

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
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

      return {
        ...state,
        blocs: nextBlocs,
        trainings: nextTrainings,
      }
    }),
  updateExerciseInTraining: async (trainingId, blocId, exerciseIndex, exercise) => {
    const state = get()
    const training = state.trainings.find((t) => t.id === trainingId)
    if (!training) return
    const nextBlocs = training.blocs.map((bloc) => {
      if (bloc.id !== blocId) return bloc
      if (exerciseIndex < 0 || exerciseIndex >= bloc.exercises.length) return bloc
      const updatedExercises = [...bloc.exercises]
      updatedExercises[exerciseIndex] = exercise
      return { ...bloc, exercises: updatedExercises }
    })
    const nextTraining = { ...training, blocs: nextBlocs }
    await updateTrainingById(trainingId, {
      title: nextTraining.title,
      description: nextTraining.description,
      blocs: nextTraining.blocs,
      transitionSecondsBetweenTimers: nextTraining.transitionSecondsBetweenTimers ?? 5,
    })
    set((current) => ({
      ...current,
      trainings: current.trainings.map((t) => (t.id === trainingId ? nextTraining : t)),
    }))
  },
  removeBloc: (blocId) =>
    set((state) => {
      const nextBlocs = state.blocs.filter((bloc) => bloc.id !== blocId)
      const nextTrainings =
        state.editingTrainingId == null
          ? state.trainings
          : state.trainings.map((training) => (training.id === state.editingTrainingId ? { ...training, blocs: nextBlocs } : training))

      return {
        ...state,
        blocs: nextBlocs,
        trainings: nextTrainings,
      }
    }),
  removeTraining: async (trainingId) => {
    await deleteTrainingById(trainingId)
    set((state) => ({
      ...state,
      trainings: state.trainings.filter((training) => training.id !== trainingId),
    }))
  },
  saveTraining: async (title, description, transitionSecondsBetweenTimers) => {
    const state = get()
    const savedTraining = await createTraining({
      title,
      description,
      blocs: state.blocs,
      transitionSecondsBetweenTimers,
    })
    set((current) => ({
      ...current,
      trainings: [...current.trainings, savedTraining],
      blocs: [],
      editingTrainingId: null,
    }))
  },
  updateTraining: async (title, description, transitionSecondsBetweenTimers) => {
    const state = get()
    if (state.editingTrainingId == null) {
      return
    }
    await updateTrainingById(state.editingTrainingId, {
      title,
      description,
      blocs: state.blocs,
      transitionSecondsBetweenTimers,
    })
    set((current) => ({
      ...current,
      trainings: current.trainings.map((training) =>
        training.id === current.editingTrainingId
          ? {
              ...training,
              title,
              description,
              blocs: current.blocs,
              transitionSecondsBetweenTimers,
            }
          : training,
      ),
      blocs: [],
      editingTrainingId: null,
    }))
  },
}))

