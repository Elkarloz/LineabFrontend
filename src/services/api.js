import axios from 'axios'

const API_URL = "https://lineab-backend.vercel.app/api"

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
}

// Places API
export const placesAPI = {
  getAll: (params) => api.get('/places', { params }),
  getById: (id) => api.get(`/places/${id}`),
  create: (data) => api.post('/places', data),
  update: (id, data) => api.put(`/places/${id}`, data),
  delete: (id) => api.delete(`/places/${id}`),
  getStats: (groupBy = 'tipo') => api.get('/places/stats', { params: { group: groupBy } })
}

// Routes API
export const routesAPI = {
  calculateRoute: (origin, destination) => 
    api.post('/routes/calculate', { origin, destination }),
  calculateDistance: (lat1, lng1, lat2, lng2) =>
    api.post('/routes/distance', { lat1, lng1, lat2, lng2 }),
  findNearbyPlaces: (lat, lng, radius = 1000) =>
    api.get('/routes/nearby', { params: { lat, lng, radius } }),
  getPointInfo: (lat, lng) =>
    api.get('/routes/point-info', { params: { lat, lng } }),
  calculateMultipleRoutes: (origin, destinations) =>
    api.post('/routes/multiple', { origin, destinations })
}

export default api

