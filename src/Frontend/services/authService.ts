import api from './api'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  username: string
  email: string
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await api.post<LoginResponse>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async register(username: string, email: string, password: string): Promise<User> {
    const response = await api.post<User>('/api/auth/register', {
      username,
      email,
      password,
    })
    return response.data
  },

  async getCurrentUser(token: string): Promise<User> {
    const response = await api.get<User>('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },
}

