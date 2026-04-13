import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const memoryStorage = new Map<string, string>()

const getFromWebStorage = (key: string): string | null => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return memoryStorage.get(key) ?? null
  }
  const value = window.localStorage.getItem(key)
  return value ?? null
}

const setToWebStorage = (key: string, value: string) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    memoryStorage.set(key, value)
    return
  }
  window.localStorage.setItem(key, value)
}

const removeFromWebStorage = (key: string) => {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    memoryStorage.delete(key)
    return
  }
  window.localStorage.removeItem(key)
}

export async function setPersistentItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    setToWebStorage(key, value)
    return
  }
  await SecureStore.setItemAsync(key, value)
}

export async function getPersistentItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return getFromWebStorage(key)
  }
  const value = await SecureStore.getItemAsync(key)
  return value ?? null
}

export async function removePersistentItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    removeFromWebStorage(key)
    return
  }
  await SecureStore.deleteItemAsync(key)
}
