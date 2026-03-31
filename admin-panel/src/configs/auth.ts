const AUTH_BASE_URL =
  (process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_BACKEND_URL ||
    'http://localhost:8000')
    .trim()
    .replace(/\s+/g, '')
    .replace(/\/$/, '')

export default {
  meEndpoint: '/auth/me',
  loginEndpoint: `${AUTH_BASE_URL}/v2/auth/login`,
  registerEndpoint: '/jwt/register',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken' // logout | refreshToken
}
