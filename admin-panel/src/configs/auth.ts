const AUTH_BASE_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_BACKEND_URL ||
    'http://192.168.1.18:8000').replace(/\/$/, '')

export default {
  meEndpoint: '/auth/me',
  loginEndpoint: `${AUTH_BASE_URL}/v2/auth/login`,
  registerEndpoint: '/jwt/register',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken' // logout | refreshToken
}
