import apiClient from 'src/utils/api-client'

const handleUserLogin = async (params: any) => {
  return await apiClient.post('v2/auth/login', params)
}

const getQrCode = async () => {
  return await apiClient.post('v2/auth/2fa/generate')
}

const enable2fa = async (params: any) => {
  return await apiClient.post('v2/auth/2fa/enable', params)
}

const disable2fa = async (params: any) => {
  return await apiClient.post('v2/auth/2fa/disable', params)
}

const get2faAuthentication = async (data: any) => {
  return await apiClient.post('v2/auth/2fa/authenticate', data)
}

const get2faAuthenticationforPreviewPassword = async (data: any) => {
  return await apiClient.post('v2/auth/2fa/authenticate-to-preview-passwords', data)
}

const requestPasswordReset = async (params: any) => {
  return await apiClient.post('v2/auth/forgot-password', params)
}

const resetPassword = async (params: any) => {
  return await apiClient.post('v2/auth/reset-password', params)
}

const changePassword = async (params: any) => {
  return await apiClient.post('v2/auth/change-password', params)
}

const handleUserLogout = async () => {
  return await apiClient.post('v2/auth/logout')
}

export {
  handleUserLogin,
  getQrCode,
  enable2fa,
  disable2fa,
  get2faAuthentication,
  changePassword,
  requestPasswordReset,
  resetPassword,
  handleUserLogout,
  get2faAuthenticationforPreviewPassword
}
