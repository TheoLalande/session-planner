import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

export type ClimbingAttemptStatus = 'success' | 'fail'
export type ClimbingAttemptSource = 'planned' | 'ad_hoc'

export type ClimbingAttempt = {
  id: string
  createdAt: number
  routeName: string
  grade: string
  routeLabel: string
  status: ClimbingAttemptStatus
  source: ClimbingAttemptSource
}

type ClimbingAttemptRow = {
  id: string
  route_name: string
  grade: string
  status: ClimbingAttemptStatus
  source: ClimbingAttemptSource | null
  performed_at: string | null
  created_at: string
}

function extractGradeFromRouteLabel(routeLabel: string) {
  const parts = routeLabel.split(' · ')
  return (parts[parts.length - 1] ?? '').trim()
}

function extractRouteNameFromRouteLabel(routeLabel: string) {
  const parts = routeLabel.split(' · ')
  if (parts.length <= 1) return routeLabel.trim()
  return parts.slice(0, parts.length - 1).join(' · ').trim()
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
    .select('id,route_name,grade,status,source,performed_at,created_at')
    .eq('user_id', userId)
    .order('performed_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data as ClimbingAttemptRow[]).map((row) => ({
    id: row.id,
    routeName: row.route_name,
    grade: row.grade,
    routeLabel: `${row.route_name} · ${row.grade}`,
    status: row.status,
    source: row.source === 'planned' ? 'planned' : 'ad_hoc',
    createdAt: new Date(row.performed_at ?? row.created_at).getTime(),
  }))
}

export async function createClimbingAttempt(payload: { routeLabel: string; status: ClimbingAttemptStatus; createdAt?: number }): Promise<ClimbingAttempt> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()
  const createdAt = payload.createdAt ?? Date.now()
  const routeName = extractRouteNameFromRouteLabel(payload.routeLabel)
  const grade = extractGradeFromRouteLabel(payload.routeLabel)

  const { data, error } = await supabase
    .from('climbing_attempts')
    .insert({
      user_id: userId,
      source: 'planned',
      route_name: routeName,
      grade,
      climbing_type: 'bloc',
      route_profile: 'verticale',
      location_type: 'salle',
      attempt_count: 1,
      status: payload.status,
      performed_at: new Date(createdAt).toISOString(),
    })
    .select('id,route_name,grade,status,source,performed_at,created_at')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const row = data as ClimbingAttemptRow
  return {
    id: row.id,
    routeName: row.route_name,
    grade: row.grade,
    routeLabel: `${row.route_name} · ${row.grade}`,
    status: row.status,
    source: row.source === 'planned' ? 'planned' : 'ad_hoc',
    createdAt: new Date(row.performed_at ?? row.created_at).getTime(),
  }
}

export type AdHocClimbingAttemptDetail = {
  id: string
  routeName: string
  grade: string
  climbingType: string
  routeProfile: string
  locationType: string
  attemptCount: number
  performedAt: string
  notes: string | null
  status: ClimbingAttemptStatus
}

type AdHocDetailRow = {
  id: string
  route_name: string
  grade: string
  climbing_type: string
  route_profile: string
  location_type: string
  attempt_count: number
  performed_at: string | null
  created_at: string
  notes: string | null
  status: ClimbingAttemptStatus
  source: string | null
}

function mapAdHocDetailRow(row: AdHocDetailRow): AdHocClimbingAttemptDetail {
  return {
    id: row.id,
    routeName: row.route_name,
    grade: row.grade,
    climbingType: row.climbing_type,
    routeProfile: row.route_profile,
    locationType: row.location_type,
    attemptCount: row.attempt_count,
    performedAt: row.performed_at ?? row.created_at,
    notes: row.notes,
    status: row.status,
  }
}

export async function fetchAdHocClimbingAttemptsDetail(): Promise<AdHocClimbingAttemptDetail[]> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('climbing_attempts')
    .select(
      'id,route_name,grade,climbing_type,route_profile,location_type,attempt_count,performed_at,created_at,notes,status,source',
    )
    .eq('user_id', userId)
    .eq('source', 'ad_hoc')
    .order('performed_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data as AdHocDetailRow[]).map(mapAdHocDetailRow)
}

export async function fetchAdHocClimbingAttemptById(attemptId: string): Promise<AdHocClimbingAttemptDetail | null> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('climbing_attempts')
    .select(
      'id,route_name,grade,climbing_type,route_profile,location_type,attempt_count,performed_at,created_at,notes,status,source',
    )
    .eq('user_id', userId)
    .eq('id', attemptId)
    .eq('source', 'ad_hoc')
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return mapAdHocDetailRow(data as AdHocDetailRow)
}

export async function updateAdHocClimbingAttempt(
  attemptId: string,
  payload: {
    routeName: string
    grade: string
    climbingType: string
    routeProfile: string
    locationType: string
    attemptCount: number
    performedAt: Date
    notes: string | null
    status: ClimbingAttemptStatus
  },
): Promise<void> {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('climbing_attempts')
    .update({
      route_name: payload.routeName,
      grade: payload.grade.trim(),
      climbing_type: payload.climbingType,
      route_profile: payload.routeProfile,
      location_type: payload.locationType,
      attempt_count: payload.attemptCount,
      performed_at: payload.performedAt.toISOString(),
      notes: payload.notes,
      status: payload.status,
    })
    .eq('id', attemptId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
