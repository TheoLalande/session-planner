import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

export type ClimbingAttemptStatus = 'success' | 'fail'
export type ClimbingAttempt = {
  id: string
  createdAt: number
  routeLabel: string
  status: ClimbingAttemptStatus
}

type ClimbingAttemptRow = {
  id: string
  route_label: string
  status: ClimbingAttemptStatus
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

export async function fetchClimbingAttempts(): Promise<ClimbingAttempt[]> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('climbing_attempts')
    .select('id,route_label,status,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as ClimbingAttemptRow[]).map((row) => ({
    id: row.id,
    routeLabel: row.route_label,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  }))
}

export async function createClimbingAttempt(payload: { routeLabel: string; status: ClimbingAttemptStatus; createdAt?: number }): Promise<ClimbingAttempt> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const createdAt = payload.createdAt ?? Date.now()

  const { data, error } = await supabase
    .from('climbing_attempts')
    .insert({
      user_id: userId,
      route_label: payload.routeLabel,
      status: payload.status,
      created_at: new Date(createdAt).toISOString(),
    })
    .select('id,route_label,status,created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const row = data as ClimbingAttemptRow
  return {
    id: row.id,
    routeLabel: row.route_label,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  }
}
