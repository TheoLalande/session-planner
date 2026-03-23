export interface IApiError {
  message: string
  status?: number
}

export interface IRegisterData {
  nickname: string
  lastName: string
  firstName: string
  email: string
  password: string
}

export interface IAuthUser {
  id: string
  email: string | null
}

export interface IRegisterResponse {
  user: IAuthUser | null
  accessToken: string | null
  refreshToken: string | null
}

export interface ILoginRequest {
  email: string
  password: string
}

export interface ILoginResponse {
  user: IAuthUser
  accessToken: string
  refreshToken: string
}

export interface IResendVerificationRequest {
  email: string
}

export interface IResendVerificationResponse {
  ok: boolean
}

export interface IForgotPasswordRequest {
  email: string
}

export interface IForgotPasswordResponse {
  ok: boolean
}

export interface ISessionResponse {
  user: IAuthUser | null
  accessToken: string | null
  refreshToken: string | null
}
