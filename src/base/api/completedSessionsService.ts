import { ExerciseType, ITrainingBloc } from '../types/trainingTypes'
import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

export type CompletedSession = {
  id: string
  trainingId: string
  completedAt: number
  blockTypes: ExerciseType[]
}

type CompletedSessionRow = {
  id: string
  training_plan_id: string
  completed_at: string
  completed_block_types: unknown
}

async function getCurrentUserId() {
  const session = await getSession()
  const userId = session.user?.id
  if (!userId) {
    throw new Error('Utilisateur non connecté')
  }
  return userId
}

function getCompletedBlockTypes(blocs: ITrainingBloc[]): ExerciseType[] {
  const foundTypes: ExerciseType[] = []
  const seen = new Set<string>()

  blocs.forEach((bloc) => {
    const byBlocType = bloc.blocType
    if (byBlocType && !seen.has(byBlocType)) {
      seen.add(byBlocType)
      foundTypes.push(byBlocType)
      return
    }
    bloc.exercises.forEach((exercise) => {
      if (!seen.has(exercise.type)) {
        seen.add(exercise.type)
        foundTypes.push(exercise.type)
      }
    })
  })

  return foundTypes
}

export async function createCompletedSession(payload: { trainingId: string; blocs: ITrainingBloc[]; completedAt?: string }) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const completedAt = payload.completedAt ?? new Date().toISOString()
  const blockTypes = getCompletedBlockTypes(payload.blocs)

  const { error } = await supabase.from('completed_sessions').insert({
    user_id: userId,
    training_plan_id: payload.trainingId,
    completed_at: completedAt,
    completed_block_types: blockTypes,
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchCompletedSessions(payload: { startAt?: number; endAt?: number } = {}): Promise<CompletedSession[]> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  let query = supabase
    .from('completed_sessions')
    .select('id,training_plan_id,completed_at,completed_block_types')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true })

  if (typeof payload.startAt === 'number') {
    query = query.gte('completed_at', new Date(payload.startAt).toISOString())
  }
  if (typeof payload.endAt === 'number') {
    query = query.lte('completed_at', new Date(payload.endAt).toISOString())
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as CompletedSessionRow[]).map((row) => {
    const rawTypes = Array.isArray(row.completed_block_types) ? row.completed_block_types : []
    const blockTypes = rawTypes.filter((item): item is ExerciseType => {
      return item === 'warmup' || item === 'cooldown' || item === 'stretching' || item === 'climbing' || item === 'hangboard'
    })
    return {
      id: row.id,
      trainingId: row.training_plan_id,
      completedAt: new Date(row.completed_at).getTime(),
      blockTypes,
    }
  })
}
