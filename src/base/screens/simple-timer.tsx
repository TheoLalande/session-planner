import React, { useMemo } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTrainingStore } from '../store/trainingStore'
import { ExerciseTimer } from '../components/ExerciseTimer'

type TimerConfig = {
  initialDurationSeconds: number
  hasNextExercise: boolean
  nextIndex: number | null
  exerciseTitle: string
  exerciseImage: string | null
  autoStart: boolean
}

export default function SimpleTimer() {
  const { trainingId, timeIndex } = useLocalSearchParams<{ trainingId?: string; timeIndex?: string }>()
  const router = useRouter()
  const trainings = useTrainingStore((state) => state.trainings)

  const { initialDurationSeconds, hasNextExercise, nextIndex, exerciseTitle, exerciseImage, autoStart } = useMemo((): TimerConfig => {
    const trainingIdNum = trainingId ? Number(trainingId) : NaN
    const indexNum = timeIndex ? Number(timeIndex) : 0

    const training = trainings.find((t) => t.id === trainingIdNum)
    if (!training || Number.isNaN(trainingIdNum)) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null as number | null,
        exerciseTitle: 'Exercice',
        exerciseImage: null as string | null,
        autoStart: false,
      }
    }

    const timeExercises = training.blocs
      .flatMap((bloc) => bloc.exercises)
      .filter((exercise) => exercise.type === 'warmup' || exercise.type === 'cooldown' || exercise.type === 'stretching')

    if (timeExercises.length === 0 || indexNum < 0 || indexNum >= timeExercises.length) {
      return {
        initialDurationSeconds: 60,
        hasNextExercise: false,
        nextIndex: null,
        exerciseTitle: 'Exercice',
        exerciseImage: null,
        autoStart: false,
      }
    }

    const currentExercise = timeExercises[indexNum]

    // Gestion de la durée selon l'unité choisie (minutes ou secondes)
    let durationValue = 'duration' in currentExercise.data ? currentExercise.data.duration : 1
    let durationUnit = 'durationUnit' in currentExercise.data && currentExercise.data.durationUnit ? currentExercise.data.durationUnit : 'seconds'

    if (Number.isNaN(durationValue) || durationValue <= 0) {
      durationValue = 1
    }

    const durationInSeconds = durationUnit === 'minutes' ? durationValue * 60 : durationValue

    const hasNext = indexNum + 1 < timeExercises.length

    let title = currentExercise.data && 'title' in currentExercise.data ? currentExercise.data.title : ''
    if (!title) {
      if (currentExercise.type === 'warmup') title = 'Échauffement'
      else if (currentExercise.type === 'cooldown') title = 'Retour au calme'
      else if (currentExercise.type === 'stretching') title = 'Étirement'
      else title = 'Exercice'
    }

    const image = currentExercise.data && 'picture' in currentExercise.data && currentExercise.data.picture ? currentExercise.data.picture : null

    const autoStart = indexNum > 0

    return {
      initialDurationSeconds: durationInSeconds,
      hasNextExercise: hasNext,
      nextIndex: hasNext ? indexNum + 1 : null,
      exerciseTitle: title,
      exerciseImage: image,
      autoStart,
    }
  }, [trainingId, timeIndex, trainings])

  return (
    <ExerciseTimer
      title={exerciseTitle}
      imageUri={exerciseImage}
      initialSeconds={initialDurationSeconds}
      autoStart={autoStart}
      hasNextExercise={hasNextExercise}
      onNextExercise={
        hasNextExercise && nextIndex !== null && trainingId
          ? () =>
              router.replace({
                pathname: '/simple-timer',
                params: {
                  trainingId,
                  timeIndex: String(nextIndex),
                },
              })
          : undefined
      }
    />
  )
}
