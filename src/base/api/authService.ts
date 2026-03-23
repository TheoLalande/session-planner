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
  ISessionResponse,
} from '../types/authTypes'
import { getSupabaseClient, getSupabaseRedirectTo } from './supabaseClient'

export async function register(registerData: IRegisterData): Promise<IRegisterResponse> {
  const supabase = getSupabaseClient()
  const redirectTo = getSupabaseRedirectTo()

  const signUpOptions: { data: { nickname: string; firstName: string; lastName: string }; emailRedirectTo?: string } = {
    data: {
      nickname: registerData.nickname,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
    },
  }

  if (redirectTo) {
    signUpOptions.emailRedirectTo = redirectTo
  }

  const { data, error } = await supabase.auth.signUp({
    email: registerData.email,
    password: registerData.password,
    options: signUpOptions,
  })

  if (error) {
    throw {
      message: error.message,
    } as IApiError
  }

  return {
    user: data.user ? { id: data.user.id, email: data.user.email ?? null } : null,
    accessToken: data.session?.access_token ?? null,
    refreshToken: data.session?.refresh_token ?? null,
  }
}

export async function login(loginData: ILoginRequest): Promise<ILoginResponse> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginData.email,
    password: loginData.password,
  })

  if (error) {
    throw {
      message: error.message,
    } as IApiError
  }

  if (!data.session) {
    throw {
      message: 'Session introuvable après la connexion',
    } as IApiError
  }

  if (!data.user) {
    throw {
      message: 'Utilisateur introuvable après la connexion',
    } as IApiError
  }

  return {
    user: { id: data.user.id, email: data.user.email ?? null },
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  }
}

export async function resendVerificationEmail(email: string): Promise<IResendVerificationResponse> {
  const supabase = getSupabaseClient()

  const requestData: IResendVerificationRequest = { email }
  const { error } = await supabase.auth.resend({ type: 'signup', email: requestData.email })

  if (error) {
    throw {
      message: error.message,
    } as IApiError
  }

  return { ok: true }
}

export async function forgotPassword(email: string): Promise<IForgotPasswordResponse> {
  const supabase = getSupabaseClient()

  const requestData: IForgotPasswordRequest = { email }
  const redirectTo = getSupabaseRedirectTo()

  const { error } = await supabase.auth.resetPasswordForEmail(requestData.email, redirectTo ? { redirectTo } : undefined)

  if (error) {
    throw {
      message: error.message,
    } as IApiError
  }

  return { ok: true }
}

export async function getSession(): Promise<ISessionResponse> {
  const supabase = getSupabaseClient()

  const { data } = await supabase.auth.getSession()
  const session = data.session

  if (!session) return { user: null, accessToken: null, refreshToken: null }

  return {
    user: session.user ? { id: session.user.id, email: session.user.email ?? null } : null,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  }
}

export async function logout(): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.auth.signOut()
}
