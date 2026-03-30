import { getSession } from './authService'
import { getSupabaseClient } from './supabaseClient'

export type ClimbingAttemptStatus = 'success' | 'fail'

function sanitizeField(value: string): string {
  return value.trim().replace(/\|\|/g, '/').replace(/ · /g, ' . ').replace(/·/g, '.')
}

export function buildClimbingRouteLabel(payload: {
  facadeName?: string
  climbingType?: string
  routeType?: string
  routeName: string
  routeGrade: string
  routeProfile?: string
  likedStars?: number
}): string {
  const facadeName = sanitizeField(payload.facadeName ?? '')
  const climbingType = sanitizeField(payload.climbingType ?? payload.routeType ?? '')
  const routeName = sanitizeField(payload.routeName)
  const routeGrade = sanitizeField(payload.routeGrade)
  const routeProfile = sanitizeField(payload.routeProfile ?? '')
  const likedStars = String(Math.max(0, Math.min(5, Math.floor(payload.likedStars ?? 0))))

  return `${facadeName} || ${climbingType} || ${routeName} || ${routeProfile} || ${likedStars} · ${routeGrade}`
}

async function getCurrentUserId() {
  const session = await getSession()
  const userId = session.user?.id
  if (!userId) {
    throw new Error('Utilisateur non connecté')
  }
  return userId
}

export async function addClimbingRouteAttempts(payload: {
  facadeName: string
  routeType: string
  routeName: string
  routeGrade: string
  routeProfile?: string
  likedStars?: number
  successCount: number
  failCount: number
  createdAt?: number
}) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const routeType = payload.routeType.trim()
  const routeName = payload.routeName.trim()
  const routeGrade = payload.routeGrade.trim()
  const facadeName = payload.facadeName.trim()
  if (!routeType || !routeName || !routeGrade || !facadeName) return

  const successCount = Math.max(0, Math.floor(payload.successCount))
  const failCount = Math.max(0, Math.floor(payload.failCount))

  if (successCount === 0 && failCount === 0) return

  const createdAt = payload.createdAt ?? Date.now()
  const createdAtIso = new Date(createdAt).toISOString()

  const routeLabel = buildClimbingRouteLabel({
    facadeName,
    climbingType: routeType,
    routeName,
    routeGrade,
    routeProfile: payload.routeProfile ?? '',
    likedStars: payload.likedStars ?? 0,
  })

  const rows: Array<{ user_id: string; route_label: string; status: ClimbingAttemptStatus; created_at: string }> = []

  for (let i = 0; i < successCount; i++) {
    rows.push({ user_id: userId, route_label: routeLabel, status: 'success', created_at: createdAtIso })
  }
  for (let i = 0; i < failCount; i++) {
    rows.push({ user_id: userId, route_label: routeLabel, status: 'fail', created_at: createdAtIso })
  }

  const { error } = await supabase.from('climbing_attempts').insert(rows)
  if (error) throw new Error(error.message)
}

export async function renameClimbingRouteLabel(payload: { oldRouteLabel: string; newRouteLabel: string }) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const oldRouteLabel = payload.oldRouteLabel.trim()
  const newRouteLabel = payload.newRouteLabel.trim()
  if (!oldRouteLabel || !newRouteLabel) return
  if (oldRouteLabel === newRouteLabel) return

  const { error } = await supabase
    .from('climbing_attempts')
    .update({ route_label: newRouteLabel })
    .eq('user_id', userId)
    .eq('route_label', oldRouteLabel)

  if (error) throw new Error(error.message)
}

export async function deleteClimbingRouteLabel(routeLabel: string) {
  const supabase = getSupabaseClient()
  const userId = await getCurrentUserId()

  const routeLabelTrimmed = routeLabel.trim()
  if (!routeLabelTrimmed) return

  const { error } = await supabase.from('climbing_attempts').delete().eq('user_id', userId).eq('route_label', routeLabelTrimmed)
  if (error) throw new Error(error.message)
}

