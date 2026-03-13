import { GatewayConfig, getAuthEndpoint } from '../../../config'
import {
  IApiError,
  IForgotPasswordRequest,
  IForgotPasswordResponse,
  ILoginRequest,
  ILoginResponse,
  IRegisterData,
  IRegisterResponse,
  IResendVerificationRequest,
  IResendVerificationResponse,
} from '../types/authTypes'

export async function register(registerData: IRegisterData): Promise<IRegisterResponse> {
  try {
    const url = getAuthEndpoint('register')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)

    const response = await fetch(url, {
      method: 'POST',
      headers: GatewayConfig.defaultHeaders,
      body: JSON.stringify(registerData),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Erreur ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      }))

      throw {
        message: errorData.message || "Erreur lors de l'enregistrement",
        status: response.status,
      } as IApiError
    }

    const data: IRegisterResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        message: 'La requête a expiré. Veuillez réessayer.',
      } as IApiError
    }
    if (error && typeof error === 'object' && 'message' in error) {
      throw error as IApiError
    }

    throw {
      message: 'Erreur réseau. Vérifiez votre connexion.',
    } as IApiError
  }
}

export async function login(loginData: ILoginRequest): Promise<ILoginResponse> {
  try {
    const url = getAuthEndpoint('login')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)

    const response = await fetch(url, {
      method: 'POST',
      headers: GatewayConfig.defaultHeaders,
      body: JSON.stringify(loginData),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Erreur ${response.status}: ${response.statusText}`,
      }))
      throw {
        message: errorData.message || 'Erreur lors de la connexion',
        status: response.status,
      } as IApiError
    }
    const data: ILoginResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        message: 'La requête a expiré. Veuillez réessayer.',
      } as IApiError
    }
    if (error && typeof error === 'object' && 'message' in error) {
      throw error as IApiError
    }

    throw {
      message: 'Erreur réseau. Vérifiez votre connexion.',
    } as IApiError
  }
}

export async function resendVerificationEmail(email: string): Promise<IResendVerificationResponse> {
  try {
    const url = getAuthEndpoint('resend-verification')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)

    const requestData: IResendVerificationRequest = { email }

    const response = await fetch(url, {
      method: 'POST',
      headers: GatewayConfig.defaultHeaders,
      body: JSON.stringify(requestData),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Erreur ${response.status}: ${response.statusText}`,
      }))

      throw {
        message: errorData.message || "Erreur lors de l'envoi de l'email",
        status: response.status,
      } as IApiError
    }

    const data: IResendVerificationResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        message: 'La requête a expiré. Veuillez réessayer.',
      } as IApiError
    }
    if (error && typeof error === 'object' && 'message' in error) {
      throw error as IApiError
    }

    throw {
      message: 'Erreur réseau. Vérifiez votre connexion.',
    } as IApiError
  }
}

export async function forgotPassword(email: string): Promise<IForgotPasswordResponse> {
  try {
    const url = getAuthEndpoint('forgot-password')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GatewayConfig.timeout)
    const requestData: IForgotPasswordRequest = { email }
    const response = await fetch(url, {
      method: 'POST',
      headers: GatewayConfig.defaultHeaders,
      body: JSON.stringify(requestData),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `Erreur ${response.status}: ${response.statusText}`,
      }))
      throw {
        message: errorData.message || 'Erreur lors de la réinitialisation de mot de passe',
      } as IApiError
    }
    const data: IForgotPasswordResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw {
        message: 'La requête a expiré. Veuillez réessayer.',
      } as IApiError
    }
    if (error && typeof error === 'object' && 'message' in error) {
      throw error as IApiError
    }

    throw {
      message: 'Erreur réseau. Vérifiez votre connexion.',
    } as IApiError
  }
}
