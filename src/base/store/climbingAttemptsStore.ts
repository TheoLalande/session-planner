import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ClimbingAttemptStatus = 'success' | 'fail'

export type ClimbingAttempt = {
  id: string
  createdAt: number
  routeLabel: string
  status: ClimbingAttemptStatus
}

type ClimbingAttemptsState = {
  attempts: ClimbingAttempt[]
  addAttempt: (payload: { routeLabel: string; status: ClimbingAttemptStatus; createdAt?: number }) => void
  clearAttempts: () => void
}

export const useClimbingAttemptsStore = create<ClimbingAttemptsState>()(
  persist(
    (set) => ({
      attempts: [],
      addAttempt: ({ routeLabel, status, createdAt }) =>
        set((state) => {
          const nextAttempt: ClimbingAttempt = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            createdAt: createdAt ?? Date.now(),
            routeLabel,
            status,
          }

          const nextAttempts = [...state.attempts, nextAttempt]
          const maxAttempts = 5000

          return {
            attempts: nextAttempts.length > maxAttempts ? nextAttempts.slice(nextAttempts.length - maxAttempts) : nextAttempts,
          }
        }),
      clearAttempts: () => set({ attempts: [] }),
    }),
    {
      name: 'climbing-attempts',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)

