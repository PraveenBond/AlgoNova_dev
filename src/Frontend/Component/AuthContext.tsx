import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/authService'

interface User {
  id: number
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      // Fetch user info
      fetchUserInfo(storedToken)
    }
  }, [])

  const fetchUserInfo = async (authToken: string) => {
    try {
      const userData = await authService.getCurrentUser(authToken)
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      localStorage.removeItem('token')
      setToken(null)
    }
  }

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password)
    setToken(response.access_token)
    localStorage.setItem('token', response.access_token)
    await fetchUserInfo(response.access_token)
  }

  const register = async (username: string, email: string, password: string) => {
    await authService.register(username, email, password)
    // Auto-login after registration
    await login(username, password)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

