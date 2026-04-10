import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const secureStoreAdapter = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key)
    return value ?? null
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value)
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key)
  },
}

let supabaseClient: SupabaseClient | null = null
const SUPABASE_SCHEMA_STORAGE_KEY = 'supabase_schema_mode'
let schemaOverride: 'public' | '__DEV__' = 'public'

export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase env vars: EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY')
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureStoreAdapter as any,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

export function getSupabaseRedirectTo(): string | undefined {
  const redirectTo = process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_TO
  if (typeof redirectTo !== 'string') return undefined
  if (!redirectTo.trim()) return undefined
  return redirectTo
}

export function getSupabaseSchemaName(): string {
  return schemaOverride
}

export async function initSupabaseSchemaPreference(): Promise<void> {
  try {
    const storedMode = await AsyncStorage.getItem(SUPABASE_SCHEMA_STORAGE_KEY)
    schemaOverride = storedMode === 'DEV' ? '__DEV__' : 'public'
  } catch {
    schemaOverride = 'public'
  }
}

export async function setSupabaseSchemaMode(mode: 'DEV' | 'PROD'): Promise<void> {
  schemaOverride = mode === 'DEV' ? '__DEV__' : 'public'
  await AsyncStorage.setItem(SUPABASE_SCHEMA_STORAGE_KEY, mode)
}

export async function getSupabaseSchemaMode(): Promise<'DEV' | 'PROD'> {
  try {
    const storedMode = await AsyncStorage.getItem(SUPABASE_SCHEMA_STORAGE_KEY)
    if (storedMode === 'DEV') {
      return 'DEV'
    }
  } catch {}
  return 'PROD'
}

export function getSupabaseDb() {
  const client = getSupabaseClient()
  return client.schema(getSupabaseSchemaName())
}

