import { IPlannedTraining } from '../types/trainingTypes'
import { TrainingExercise } from '../types/trainingTypes'
import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

type TrainingRow = {
  id: string
  title: string
  description: string | null
  transition_seconds_between_timers: number | null
}

type BlockRow = {
  id: string
  plan_id: string
  title: string
  description: string | null
  bloc_type: string | null
  position: number
}

type ExerciseRow = {
  id: string
  block_id: string
  exercise_type: TrainingExercise['type']
  title: string | null
  description: string | null
  notes: string | null
  picture_url: string | null
  payload_json: unknown
  position: number
}

async function getCurrentUserId() {
  const session = await getSession()
  const userId = session.user?.id
  if (!userId) {
    throw new Error('Utilisateur non connecté')
  }
  return userId
}

function normalizeExerciseFromRow(row: ExerciseRow): TrainingExercise {
  const payload = row.payload_json && typeof row.payload_json === 'object' ? (row.payload_json as Record<string, unknown>) : {}
  const data = {
    ...payload,
    title: row.title ?? String(payload.title ?? ''),
    description: row.description ?? String(payload.description ?? ''),
    picture: row.picture_url ?? String(payload.picture ?? ''),
    notes: row.notes ?? String(payload.notes ?? ''),
    id: typeof payload.id === 'number' ? payload.id : row.position + 1,
  } as TrainingExercise['data']
  return {
    type: row.exercise_type,
    data,
  } as TrainingExercise
}

function getExerciseInsertPayload(
  userId: string,
  blockId: string,
  exercise: TrainingExercise,
  position: number,
) {
  return {
    user_id: userId,
    block_id: blockId,
    exercise_type: exercise.type,
    title: exercise.data.title ?? '',
    description: exercise.data.description ?? '',
    notes: exercise.data.notes ?? '',
    picture_url: exercise.data.picture ?? '',
    payload_json: exercise.data,
    position,
  }
}

export async function fetchTrainings(): Promise<IPlannedTraining[]> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { data: plansData, error: plansError } = await supabase
    .from('training_plans')
    .select('id,title,description,transition_seconds_between_timers')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (plansError) {
    throw new Error(plansError.message)
  }

  const plans = (plansData ?? []) as TrainingRow[]
  if (plans.length === 0) {
    return []
  }

  const planIds = plans.map((plan) => plan.id)
  const { data: blocksData, error: blocksError } = await supabase
    .from('training_plan_blocks')
    .select('id,plan_id,title,description,bloc_type,position')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .in('plan_id', planIds)
    .order('position', { ascending: true })

  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const blocks = (blocksData ?? []) as BlockRow[]
  const blockIds = blocks.map((block) => block.id)

  let exercises: ExerciseRow[] = []
  if (blockIds.length > 0) {
    const { data: exercisesData, error: exercisesError } = await supabase
      .from('training_plan_exercises')
      .select('id,block_id,exercise_type,title,description,notes,picture_url,payload_json,position')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('block_id', blockIds)
      .order('position', { ascending: true })

    if (exercisesError) {
      throw new Error(exercisesError.message)
    }

    exercises = (exercisesData ?? []) as ExerciseRow[]
  }

  const exercisesByBlockId = new Map<string, ExerciseRow[]>()
  exercises.forEach((exercise) => {
    const current = exercisesByBlockId.get(exercise.block_id) ?? []
    current.push(exercise)
    exercisesByBlockId.set(exercise.block_id, current)
  })

  const blocksByPlanId = new Map<string, IPlannedTraining['blocs']>()
  blocks.forEach((block) => {
    const current = blocksByPlanId.get(block.plan_id) ?? []
    const blockExercises = (exercisesByBlockId.get(block.id) ?? []).map(normalizeExerciseFromRow)
    current.push({
      id: block.position + 1,
      title: block.title,
      description: block.description ?? undefined,
      blocType: (block.bloc_type as any) ?? undefined,
      exercises: blockExercises,
    })
    blocksByPlanId.set(block.plan_id, current)
  })

  return plans.map((plan) => ({
    id: plan.id,
    title: plan.title ?? '',
    description: plan.description ?? '',
    blocs: blocksByPlanId.get(plan.id) ?? [],
    transitionSecondsBetweenTimers: typeof plan.transition_seconds_between_timers === 'number' ? plan.transition_seconds_between_timers : 5,
  }))
}

export async function createTraining(
  payload: Pick<IPlannedTraining, 'title' | 'description' | 'blocs' | 'transitionSecondsBetweenTimers'>,
): Promise<IPlannedTraining> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { data: planData, error: planError } = await supabase
    .from('training_plans')
    .insert({
      user_id: userId,
      title: payload.title,
      description: payload.description,
      transition_seconds_between_timers: payload.transitionSecondsBetweenTimers,
    })
    .select('id,title,description,transition_seconds_between_timers')
    .single()

  if (planError || !planData) {
    throw new Error(planError?.message ?? "Erreur lors de la création de l'entrainement")
  }

  const plan = planData as TrainingRow
  if (payload.blocs.length > 0) {
    const blocksToInsert = payload.blocs.map((bloc, index) => ({
      user_id: userId,
      plan_id: plan.id,
      title: bloc.title,
      description: bloc.description ?? '',
      bloc_type: bloc.blocType ?? null,
      position: index,
    }))

    const { data: insertedBlocks, error: blocksError } = await supabase
      .from('training_plan_blocks')
      .insert(blocksToInsert)
      .select('id,position')

    if (blocksError) {
      throw new Error(blocksError.message)
    }

    const blockIdByPosition = new Map<number, string>()
    ;(insertedBlocks ?? []).forEach((block: any) => {
      blockIdByPosition.set(block.position, block.id)
    })

    const exercisesToInsert = payload.blocs.flatMap((bloc, blockIndex) => {
      const blockId = blockIdByPosition.get(blockIndex)
      if (!blockId) {
        return []
      }
      return bloc.exercises.map((exercise, exerciseIndex) => getExerciseInsertPayload(userId, blockId, exercise, exerciseIndex))
    })

    if (exercisesToInsert.length > 0) {
      const { error: exercisesError } = await supabase.from('training_plan_exercises').insert(exercisesToInsert)
      if (exercisesError) {
        throw new Error(exercisesError.message)
      }
    }
  }

  return {
    id: plan.id,
    title: plan.title ?? '',
    description: plan.description ?? '',
    blocs: payload.blocs,
    transitionSecondsBetweenTimers: typeof plan.transition_seconds_between_timers === 'number' ? plan.transition_seconds_between_timers : payload.transitionSecondsBetweenTimers ?? 5,
  }
}

export async function updateTrainingById(
  trainingId: string,
  payload: Pick<IPlannedTraining, 'title' | 'description' | 'blocs' | 'transitionSecondsBetweenTimers'>,
): Promise<void> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { error: planError } = await supabase
    .from('training_plans')
    .update({
      title: payload.title,
      description: payload.description,
      transition_seconds_between_timers: payload.transitionSecondsBetweenTimers,
    })
    .eq('id', trainingId)
    .eq('user_id', userId)

  if (planError) {
    throw new Error(planError.message)
  }

  const { data: existingBlocks, error: existingBlocksError } = await supabase
    .from('training_plan_blocks')
    .select('id')
    .eq('plan_id', trainingId)
    .eq('user_id', userId)

  if (existingBlocksError) {
    throw new Error(existingBlocksError.message)
  }

  const existingBlockIds = (existingBlocks ?? []).map((block: any) => block.id)
  if (existingBlockIds.length > 0) {
    // IMPORTANT : on fait un hard delete
    // sinon la contrainte unique (plan_id, position) peut rester bloquée si elle ne dépend pas de deleted_at.
    const { error: deleteExercisesError } = await supabase
      .from('training_plan_exercises')
      .delete()
      .in('block_id', existingBlockIds)
      .eq('user_id', userId)

    if (deleteExercisesError) {
      throw new Error(deleteExercisesError.message)
    }
  }

  const { error: deleteBlocksError } = await supabase
    .from('training_plan_blocks')
    .delete()
    .eq('plan_id', trainingId)
    .eq('user_id', userId)

  if (deleteBlocksError) {
    throw new Error(deleteBlocksError.message)
  }

  if (payload.blocs.length === 0) {
    return
  }

  const blocksToInsert = payload.blocs.map((bloc, index) => ({
    user_id: userId,
    plan_id: trainingId,
    title: bloc.title,
    description: bloc.description ?? '',
    bloc_type: bloc.blocType ?? null,
    position: index,
  }))

  const { data: insertedBlocks, error: blocksError } = await supabase.from('training_plan_blocks').insert(blocksToInsert).select('id,position')
  if (blocksError) {
    throw new Error(blocksError.message)
  }

  const blockIdByPosition = new Map<number, string>()
  ;(insertedBlocks ?? []).forEach((block: any) => {
    blockIdByPosition.set(block.position, block.id)
  })

  const exercisesToInsert = payload.blocs.flatMap((bloc, blockIndex) => {
    const blockId = blockIdByPosition.get(blockIndex)
    if (!blockId) {
      return []
    }
    return bloc.exercises.map((exercise, exerciseIndex) => getExerciseInsertPayload(userId, blockId, exercise, exerciseIndex))
  })

  if (exercisesToInsert.length === 0) {
    return
  }

  const { error: exercisesError } = await supabase.from('training_plan_exercises').insert(exercisesToInsert)
  if (exercisesError) {
    throw new Error(exercisesError.message)
  }
}

export async function deleteTrainingById(trainingId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const deletedAt = new Date().toISOString()

  const { data: existingBlocks, error: existingBlocksError } = await supabase
    .from('training_plan_blocks')
    .select('id')
    .eq('plan_id', trainingId)
    .eq('user_id', userId)
    .is('deleted_at', null)

  if (existingBlocksError) {
    throw new Error(existingBlocksError.message)
  }

  const existingBlockIds = (existingBlocks ?? []).map((block: any) => block.id)
  if (existingBlockIds.length > 0) {
    const { error: deleteExercisesError } = await supabase
      .from('training_plan_exercises')
      .update({ deleted_at: deletedAt })
      .in('block_id', existingBlockIds)
      .eq('user_id', userId)
      .is('deleted_at', null)
    if (deleteExercisesError) {
      throw new Error(deleteExercisesError.message)
    }
  }

  const { error: deleteBlocksError } = await supabase
    .from('training_plan_blocks')
    .update({ deleted_at: deletedAt })
    .eq('plan_id', trainingId)
    .eq('user_id', userId)
    .is('deleted_at', null)
  if (deleteBlocksError) {
    throw new Error(deleteBlocksError.message)
  }

  const { error: deletePlanError } = await supabase
    .from('training_plans')
    .update({ deleted_at: deletedAt })
    .eq('id', trainingId)
    .eq('user_id', userId)
    .is('deleted_at', null)
  if (deletePlanError) {
    throw new Error(deletePlanError.message)
  }
}
