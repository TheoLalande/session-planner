import * as SecureStore from 'expo-secure-store'

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export async function storeAccessToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token)
  } catch (error) {
    throw new Error("Erreur lors du stockage du token d'accès")
  }
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
  } catch (error) {
    return null
  }
}

export async function storeRefreshToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token)
  } catch (error) {
    throw new Error('Erreur lors du stockage du token de rafraîchissement')
  }
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  } catch (error) {
    return null
  }
}

export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await Promise.all([storeAccessToken(accessToken), storeRefreshToken(refreshToken)])
  } catch (error) {
    throw new Error('Erreur lors du stockage des tokens')
  }
}

export async function clearTokens(): Promise<void> {
  try {
    await Promise.all([SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY), SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)])
  } catch (error) {
    throw new Error('Erreur lors de la suppression des tokens')
  }
}

export async function hasAccessToken(): Promise<boolean> {
  const token = await getAccessToken()
  return token !== null
}
