import axios from 'axios'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_BACKEND_URL ||
  'http://192.168.1.18:8000'

const ApiClient = () => {
  const instance = axios.create({
    baseURL: API_BASE_URL.replace(/\/$/, '')
  })

  instance.interceptors.request.use(async request => {
    const accessToken = window.localStorage.getItem('accessToken')

    if (accessToken) {
      request.headers = {
        Authorization: `Bearer ${accessToken}`
      }
    }

    return request
  })
  instance.interceptors.response.use(
    response => response,
    error => {
      if (error.response && error.response.status === 401) {
        const requestUrl = String(error?.config?.url || '')
        const isLoginRequest = requestUrl.includes('v2/auth/login')

        if (!isLoginRequest) {
          window.localStorage.clear()
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )
  return instance
}

export default ApiClient()

// local IP
// http://192.168.50.81:4000/
// http://192.168.18.77:4000/
// Stagging IP
