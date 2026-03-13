const getDefaultBaseUrl = (): string => {
  const deviceType = process.env.EXPO_PUBLIC_DEVICE_TYPE

  let baseUrl = ''
  switch (deviceType) {
    case 'ios':
      baseUrl = process.env.EXPO_PUBLIC_IOS_GATEWAY_URL || ''
      break
    case 'android':
      baseUrl = process.env.EXPO_PUBLIC_ANDROID_GATEWAY_URL || ''
      break
    case 'hardware':
      baseUrl = process.env.EXPO_PUBLIC_HARDWARE_GATEWAY_URL || ''
      break
    default:
      baseUrl = 'http://localhost:1312'
      break
  }
  return baseUrl
}

export const GatewayConfig = {
  baseUrl: getDefaultBaseUrl(),
  timeout: 30000,
  endpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      'resend-verification': '/auth/resend-verification',
      'forgot-password': '/auth/forgot-password',
    },
    profile: {
      users: '/users',
      byEmail: '/users/by-email',
      update: '/users/update',
    },
  },
  defaultHeaders: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
}

export const buildApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${GatewayConfig.baseUrl}${cleanEndpoint}`
}

export const getAuthEndpoint = (endpoint: keyof typeof GatewayConfig.endpoints.auth): string => {
  const endPointValue = buildApiUrl(GatewayConfig.endpoints.auth[endpoint])
  return endPointValue
}
