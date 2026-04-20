const API_URL = import.meta.env.VITE_SERVER_URL 
  ? import.meta.env.VITE_SERVER_URL.replace('ws://', 'http://').replace('wss://', 'https://')
  : 'http://localhost:8080'

export function getToken() {
  return localStorage.getItem('newhere_token')
}

export function setToken(token: string) {
  localStorage.setItem('newhere_token', token)
}

export function clearToken() {
  localStorage.removeItem('newhere_token')
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any)
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'API request failed')
  }

  return data
}

export const api = {
  login: (data: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => fetchApi('/auth/me', { method: 'GET' }),
  getDevices: () => fetchApi('/devices', { method: 'GET' }),
  deleteDevice: (id: string) => fetchApi(`/devices/${id}`, { method: 'DELETE' })
}
