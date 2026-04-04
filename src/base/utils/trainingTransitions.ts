import { IPlannedTraining } from '../types/trainingTypes'

export function getBlocIndexForFlatExerciseIndex(training: IPlannedTraining, flatIndex: number): number | null {
  let flat = 0
  for (let b = 0; b < training.blocs.length; b++) {
    const count = training.blocs[b].exercises.length
    if (flatIndex >= flat && flatIndex < flat + count) {
      return b
    }
    flat += count
  }
  return null
}

export function getTransitionSecondsBeforeNextExercise(training: IPlannedTraining, fromFlatIndex: number): number {
  const exercises = training.blocs.flatMap((bloc) => bloc.exercises)
  const toIndex = fromFlatIndex + 1
  const betweenTimers = training.transitionSecondsBetweenTimers ?? 5
  if (toIndex >= exercises.length) {
    return betweenTimers
  }
  const fromBloc = getBlocIndexForFlatExerciseIndex(training, fromFlatIndex)
  const toBloc = getBlocIndexForFlatExerciseIndex(training, toIndex)
  if (fromBloc !== null && toBloc !== null && fromBloc !== toBloc) {
    const v = training.transitionSecondsBetweenBlocs
    if (typeof v === 'number') {
      return v
    }
    return betweenTimers
  }
  return betweenTimers
}
