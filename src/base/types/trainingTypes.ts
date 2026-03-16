export type ClimbingGrades = '5c+' | '6a' | '6a+' | '6b' | '6+b' | '6c' | '6c+' | '7a' | '7a+' | '7b' | '7b+' | '7c' | '7c+' | '8a'
export type ExerciceTypes = 'hangboard' | 'climbing' | 'warmup' | 'cooldown' | 'stretching'

export interface ITraining {
  id: number
  title: string
  description: string
}

export interface IWorkout {
  name: string
  tool: string
  weight: number
  restingTime: number
  repetitions: number
  sets: number
  notes: string
}

export interface ICommonWorkout {
  id: number
  title: string
  description: string
  picture: string
}

export interface Ihangboard extends ICommonWorkout {
  holdType: string
  restingTime: number
  holdTime: number
  sets: number
  notes: string
}

export interface IWarmUp extends ICommonWorkout {
  exerciceType: string
  picture: string
  notes: string
  duration: number
}

export interface ICooldown extends IWarmUp {}

export interface IStretching extends IWarmUp {}

export interface IClimbing extends ICommonWorkout {
  grade: ClimbingGrades
  restingTime: number
  attempts: number
  notes: string
}

export interface ITraining extends ICommonWorkout {
  workouts: IWorkout[]
}

export type TrainingExercise =
  | { type: 'hangboard'; data: Ihangboard }
  | { type: 'climbing'; data: IClimbing }
  | { type: 'warmup'; data: IWarmUp }
  | { type: 'cooldown'; data: ICooldown }
  | { type: 'stretching'; data: IStretching }

export interface ITrainingBloc {
  id: number
  title: string
  exercises: TrainingExercise[]
}
