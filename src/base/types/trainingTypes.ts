export type ClimbingGrades = '5c+' | '6a' | '6a+' | '6b' | '6+b' | '6c' | '6c+' | '7a' | '7a+' | '7b' | '7b+' | '7c' | '7c+' | '8a'

export type ExerciseType = 'hangboard' | 'climbing' | 'warmup' | 'renforcement' | 'stretching'

export type ExerciceTypes = ExerciseType

export type TimeUnit = 'minutes' | 'seconds'
export type QuantityMode = 'time' | 'reps'
export type ClimbingSessionType = 'bloc' | 'voie' | 'grande voie'
export type ClimbingWallProfile = 'dalle' | 'verticale' | 'devers' | 'toit'

export interface ICommonWorkout {
  id: number
  libraryExerciseId?: string
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
  climbingType?: ClimbingSessionType
  routeProfile?: ClimbingWallProfile
}

export interface IWarmUp extends ICommonWorkout {
  exerciceType: string
  mode: QuantityMode
  duration: number
  durationUnit: TimeUnit
  repetitions: number
  leftRight: boolean
}

export interface IRenforcement extends IWarmUp {}
export interface IStretching extends IWarmUp {}

export type TrainingExercise =
  | { type: 'hangboard'; data: Ihangboard }
  | { type: 'climbing'; data: IClimbing }
  | { type: 'warmup'; data: IWarmUp }
  | { type: 'renforcement'; data: IRenforcement }
  | { type: 'stretching'; data: IStretching }

export interface ITrainingBloc {
  id: number
  title: string
  description?: string
  blocType?: ExerciseType
  exercises: TrainingExercise[]
}

export interface IPlannedTraining {
  id: string
  title: string
  description: string
  blocs: ITrainingBloc[]
  transitionSecondsBetweenTimers: number
  transitionSecondsBetweenBlocs: number
}

export interface IExerciseLibraryItem {
  id: string
  userId: string
  exerciseType: ExerciseType
  title: string
  description: string
  notes: string
  pictureUrl: string
  payloadJson: TrainingExercise['data']
  createdAt: string
}

export interface IExerciseCategory {
  id: string
  userId: string
  name: string
  createdAt: string
}
