import { GatewayConfig, buildApiUrl } from '../../../config'
import { IApiError } from '../types/authTypes'
import { IFirstVisitData, IUserExistsResponse } from '../types/profileTypes'

export async function checkUserExists(email: string, accessToken: string): Promise<IUserExistsResponse> {
  const url = buildApiUrl(`/users/by-email?email=${encodeURIComponent(email)}`)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...GatewayConfig.defaultHeaders,
      Authorization: `Bearer ${accessToken}`,
    },
    signal: controller.signal,
  })
  clearTimeout(timeoutId)

  if (!response.ok) {
    if (response.status === 404) {
      return { exists: false }
    }
    const errorData = await response.json().catch(() => ({
      message: `Erreur ${response.status}: ${response.statusText}`,
    }))
    throw {
      message: errorData.message || "Erreur lors de la vérification de l'utilisateur",
      status: response.status,
    } as IApiError
  }

  const data: IUserExistsResponse = await response.json()
  return data
}

export async function getUser(accessToken: string, email: string) {
  const url = buildApiUrl(`/users/by-email?email=${encodeURIComponent(email)}`)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...GatewayConfig.defaultHeaders,
      Authorization: `Bearer ${accessToken}`,
    },
    signal: controller.signal,
  })
  clearTimeout(timeoutId)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Erreur ${response.status}: ${response.statusText}`,
    }))
    throw {
      message: errorData.message || "Erreur lors de la récupération de l'utilisateur",
      status: response.status,
    } as IApiError
  }

  const data = await response.json()
  return data
}

export async function updateUser(userData: IFirstVisitData, accessToken: string) {
  const url = buildApiUrl(GatewayConfig.endpoints.profile.update)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)
  console.log('🚀 ~ updateUser ~ JSON.stringify(userData):', JSON.stringify(userData))

  const response = await fetch(url, {
    body: JSON.stringify(userData),
    method: 'PATCH',
    headers: {
      ...GatewayConfig.defaultHeaders,
      Authorization: `Bearer ${accessToken}`,
    },
    signal: controller.signal,
  })
  clearTimeout(timeoutId)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: `Erreur ${response.status}: ${response.statusText}`,
    }))
    throw {
      message: errorData.message || "Erreur lors de la mise à jour de l'utilisateur",
      status: response.status,
    } as IApiError
  }

  const data = await response.json()
  return data
}
