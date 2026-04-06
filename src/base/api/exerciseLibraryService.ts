import { ExerciseType, IExerciseLibraryItem, TrainingExercise } from '../types/trainingTypes'
import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

type ExerciseLibraryRow = {
  id: string
  user_id: string
  exercise_type: ExerciseType
  title: string | null
  description: string | null
  notes: string | null
  picture_url: string | null
  payload_json: unknown
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

function normalizeRow(row: ExerciseLibraryRow): IExerciseLibraryItem {
  const payload = row.payload_json && typeof row.payload_json === 'object' ? (row.payload_json as TrainingExercise['data']) : ({} as TrainingExercise['data'])
  return {
    id: row.id,
    userId: row.user_id,
    exerciseType: row.exercise_type,
    title: row.title ?? '',
    description: row.description ?? '',
    notes: row.notes ?? '',
    pictureUrl: row.picture_url ?? '',
    payloadJson: payload,
    createdAt: row.created_at,
  }
}

export function toTrainingExerciseFromLibrary(item: IExerciseLibraryItem): TrainingExercise {
  return {
    type: item.exerciseType,
    data: {
      ...item.payloadJson,
      title: item.title || String((item.payloadJson as any)?.title ?? ''),
      description: item.description || String((item.payloadJson as any)?.description ?? ''),
      notes: item.notes || String((item.payloadJson as any)?.notes ?? ''),
      picture: item.pictureUrl || String((item.payloadJson as any)?.picture ?? ''),
    } as TrainingExercise['data'],
  } as TrainingExercise
}

export function getExerciseCategoryIdFromLibraryItem(item: IExerciseLibraryItem): string {
  const payload = item.payloadJson as any
  return String(payload?.exerciseCategoryId ?? '').trim()
}

export function getExerciseCategoryNameFromLibraryItem(item: IExerciseLibraryItem): string {
  const payload = item.payloadJson as any
  return String(payload?.exerciseCategoryName ?? '').trim()
}

export async function fetchExerciseLibrary(): Promise<IExerciseLibraryItem[]> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('exercise_library')
    .select('id,user_id,exercise_type,title,description,notes,picture_url,payload_json,created_at')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as ExerciseLibraryRow[]).map(normalizeRow)
}

export async function fetchExerciseLibraryItemById(id: string): Promise<IExerciseLibraryItem | null> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('exercise_library')
    .select('id,user_id,exercise_type,title,description,notes,picture_url,payload_json,created_at')
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!data) {
    return null
  }
  return normalizeRow(data as ExerciseLibraryRow)
}

export async function createExerciseLibraryItem(exercise: TrainingExercise): Promise<IExerciseLibraryItem> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const payload = exercise.data as any

  const { data, error } = await supabase
    .from('exercise_library')
    .insert({
      user_id: userId,
      exercise_type: exercise.type,
      title: payload?.title ?? payload?.exerciceType ?? '',
      description: payload?.description ?? '',
      notes: payload?.notes ?? '',
      picture_url: payload?.picture ?? '',
      payload_json: payload,
    })
    .select('id,user_id,exercise_type,title,description,notes,picture_url,payload_json,created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible d'enregistrer l'exercice")
  }

  return normalizeRow(data as ExerciseLibraryRow)
}

export async function updateExerciseLibraryItem(id: string, exercise: TrainingExercise): Promise<IExerciseLibraryItem> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const payload = exercise.data as any

  const { data, error } = await supabase
    .from('exercise_library')
    .update({
      exercise_type: exercise.type,
      title: payload?.title ?? payload?.exerciceType ?? '',
      description: payload?.description ?? '',
      notes: payload?.notes ?? '',
      picture_url: payload?.picture ?? '',
      payload_json: payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select('id,user_id,exercise_type,title,description,notes,picture_url,payload_json,created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? "Impossible de mettre à jour l'exercice")
  }

  return normalizeRow(data as ExerciseLibraryRow)
}
