export default {
  meEndpoint: '/auth/me',
  loginEndpoint: 'http://localhost:4000/v2/auth/login',
  registerEndpoint: '/jwt/register',
  storageTokenKeyName: 'accessToken',
  onTokenExpiration: 'refreshToken' // logout | refreshToken
}
