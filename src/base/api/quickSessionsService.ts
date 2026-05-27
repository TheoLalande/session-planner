import { ExerciseType } from '../types/trainingTypes'
import { getSession } from './authService'
import { getSupabaseDb } from './supabaseClient'

export const QUICK_LOG_PLAN_TITLE = '__quick_log__'
export const QUICK_LOG_SESSION_DISPLAY_TITLE = 'Séance rapide'

async function getCurrentUserId() {
  const session = await getSession()
  const userId = session.user?.id
  if (!userId) {
    throw new Error('Utilisateur non connecté')
  }
  return userId
}

export function isQuickLogTrainingTitle(title: string): boolean {
  return title === QUICK_LOG_PLAN_TITLE
}

export async function fetchQuickLogPlanId(): Promise<string | null> {
  const db = getSupabaseDb()
  const userId = await getCurrentUserId()

  const { data, error } = await db
    .from('training_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('title', QUICK_LOG_PLAN_TITLE)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data?.id ?? null
}

async function getOrCreateQuickLogPlanId(): Promise<string> {
  const db = getSupabaseDb()
  const userId = await getCurrentUserId()

  const { data: existing, error: fetchError } = await db
    .from('training_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('title', QUICK_LOG_PLAN_TITLE)
    .is('deleted_at', null)
    .maybeSingle()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  if (existing?.id) {
    return existing.id
  }

  const { data: created, error: createError } = await db
    .from('training_plans')
    .insert({
      user_id: userId,
      title: QUICK_LOG_PLAN_TITLE,
      description: '',
      is_archived: true,
    })
    .select('id')
    .single()

  if (createError || !created?.id) {
    throw new Error(createError?.message ?? "Impossible de préparer l'enregistrement rapide")
  }

  return created.id
}

export async function createQuickSession(blockType: ExerciseType, completedAt?: Date): Promise<void> {
  const db = getSupabaseDb()
  const userId = await getCurrentUserId()
  const planId = await getOrCreateQuickLogPlanId()
  const performedAt = completedAt ?? new Date()

  const { error } = await db.from('completed_sessions').insert({
    user_id: userId,
    training_plan_id: planId,
    completed_at: performedAt.toISOString(),
    completed_block_types: [blockType],
  })

  if (error) {
    throw new Error(error.message)
  }
}
