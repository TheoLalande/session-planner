import { create } from 'zustand'
import { createClimbingAttempt, fetchClimbingAttempts } from '../api/climbingAttemptsService'

export type ClimbingAttemptStatus = 'success' | 'fail'

export type ClimbingAttempt = {
  id: string
  createdAt: number
  routeLabel: string
  status: ClimbingAttemptStatus
}

type ClimbingAttemptsState = {
  attempts: ClimbingAttempt[]
  isLoadingAttempts: boolean
  loadAttempts: () => Promise<void>
  addAttempt: (payload: { routeLabel: string; status: ClimbingAttemptStatus; createdAt?: number }) => Promise<void>
}

export const useClimbingAttemptsStore = create<ClimbingAttemptsState>()((set) => ({
  attempts: [],
  isLoadingAttempts: false,
  loadAttempts: async () => {
    set({ isLoadingAttempts: true })
    try {
      const attempts = await fetchClimbingAttempts()
      set({ attempts })
    } finally {
      set({ isLoadingAttempts: false })
    }
  },
  addAttempt: async ({ routeLabel, status, createdAt }) => {
    const attempt = await createClimbingAttempt({ routeLabel, status, createdAt })
    set((state) => ({
      attempts: [...state.attempts, attempt],
    }))
  },
}))

