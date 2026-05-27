import { ExerciseType } from '../types/trainingTypes'

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  warmup: 'Échauffement',
  climbing: 'Escalade',
  renforcement: 'Renforcement',
  strength: 'Force',
  stretching: 'Étirements',
  gainage: 'Gainage',
  hangboard: 'Hangboard',
}

export const QUICK_LOG_EXERCISE_TYPES: ExerciseType[] = [
  'climbing',
  'gainage',
  'renforcement',
  'strength',
  'warmup',
  'stretching',
  'hangboard',
]

export function getExerciseTypeLabel(type: ExerciseType): string {
  return EXERCISE_TYPE_LABELS[type] ?? type
}
