import axios, { type AxiosError } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // Offline guard for write operations
  if (
    !navigator.onLine &&
    config.method &&
    ['post', 'patch', 'put', 'delete'].includes(config.method.toLowerCase())
  ) {
    return Promise.reject(new Error('OFFLINE'))
  }
  return config
})

// Handle 401 globally — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      // Avoid redirect loop on the login page itself
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
