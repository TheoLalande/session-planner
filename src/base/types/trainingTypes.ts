export type ClimbingGrades = '5c+' | '6a' | '6a+' | '6b' | '6+b' | '6c' | '6c+' | '7a' | '7a+' | '7b' | '7b+' | '7c' | '7c+' | '8a'

export type ExerciseType = 'hangboard' | 'climbing' | 'warmup' | 'cooldown' | 'stretching'

export type ExerciceTypes = ExerciseType

export type TimeUnit = 'minutes' | 'seconds'
export type QuantityMode = 'time' | 'reps'

export interface ICommonWorkout {
  id: number
  title: string
  description: string
  picture: string
  notes: string
}

export interface Ihangboard extends ICommonWorkout {
  holdType: string
  restingTime: number
  holdTime: number
  sets: number
}

export type IHangboard = Ihangboard

export interface IClimbing extends ICommonWorkout {
  grade: ClimbingGrades
  restingTime: number
  attempts: number
}

export interface IWarmUp extends ICommonWorkout {
  exerciceType: string
  mode: QuantityMode
  duration: number
  durationUnit: TimeUnit
  repetitions: number
}

export interface ICooldown extends IWarmUp {}
export interface IStretching extends IWarmUp {}

export type TrainingExercise =
  | { type: 'hangboard'; data: Ihangboard }
  | { type: 'climbing'; data: IClimbing }
  | { type: 'warmup'; data: IWarmUp }
  | { type: 'cooldown'; data: ICooldown }
  | { type: 'stretching'; data: IStretching }

export interface ITrainingBloc {
  id: number
  title: string
  description?: string
  blocType?: ExerciseType
  exercises: TrainingExercise[]
}

export interface IPlannedTraining {
  id: number
  title: string
  description: string
  blocs: ITrainingBloc[]
}
