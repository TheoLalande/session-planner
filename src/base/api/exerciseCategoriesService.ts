import { IExerciseCategory } from '../types/trainingTypes'
import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

type ExerciseCategoryRow = {
  id: string
  user_id: string
  name: string
  created_at: string
}

async function getCurrentUserId() {
  const session = await getSession()
  const userId = session.user?.id
  if (!userId) {
    throw new Error('Utilisateur non connecté')
  }
  return userId
}

function normalizeRow(row: ExerciseCategoryRow): IExerciseCategory {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    createdAt: row.created_at,
  }
}

export async function fetchExerciseCategories(): Promise<IExerciseCategory[]> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('exercise_categories')
    .select('id,user_id,name,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as ExerciseCategoryRow[]).map(normalizeRow)
}

export async function createExerciseCategory(name: string): Promise<IExerciseCategory> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const clean = name.trim()
  if (!clean) {
    throw new Error('Nom invalide')
  }
  const { data, error } = await supabase
    .from('exercise_categories')
    .insert({
      user_id: userId,
      name: clean,
    })
    .select('id,user_id,name,created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Impossible de créer le type')
  }

  return normalizeRow(data as ExerciseCategoryRow)
}
