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

const sanitizeUser = (rawUser: any): User => {
  const source = rawUser?.user || rawUser?.profile?.data || rawUser?.profile || rawUser || {}
  const usernameCandidate =
    source.username ||
    source.display_name ||
    source.name ||
    source.client_id ||
    source.user_id ||
    'Fyers User'
  const emailCandidate =
    source.email ||
    source.email_id ||
    `${(source.client_id || usernameCandidate || 'fyers').toString().toLowerCase()}@fyers.local`
  const rawId = source.id || source.client_id || source.user_id || Date.now()
  let numericId: number
  if (typeof rawId === 'number' && Number.isFinite(rawId)) {
    numericId = rawId
  } else {
    const parsed = parseInt(String(rawId).replace(/\D/g, ''), 10)
    numericId = Number.isFinite(parsed) ? parsed : Date.now()
  }
  return {
    id: numericId,
    username: String(usernameCandidate),
    email: String(emailCandidate),
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      // Prefer Fyers session if available
      const fyersSessionStr = localStorage.getItem('fyers_session')
      if (fyersSessionStr) {
        try {
          const fyersSession = JSON.parse(fyersSessionStr)
          if (fyersSession.fyers_authenticated) {
            setToken(storedToken)
            setUser(sanitizeUser(fyersSession))
            return
          }
        } catch (e) {
          // Invalid Fyers session, continue with other auth modes
        }
      }

      // Then check for stored Kite session
      const kiteSessionStr = localStorage.getItem('kite_session')
      if (kiteSessionStr) {
        try {
          const kiteSession = JSON.parse(kiteSessionStr)
          if (kiteSession.kite_authenticated && kiteSession.user) {
            setToken(storedToken)
            setUser(kiteSession.user)
            return
          }
        } catch (e) {
          // Invalid kite session, continue with regular auth
        }
      }
      
      // Regular authentication
      setToken(storedToken)
      fetchUserInfo(storedToken)
    }
  }, [])

  const fetchUserInfo = async (authToken: string) => {
    // Skip if it's a Kite token
    if (authToken.startsWith('kite_')) {
      return
    }
    
    try {
      const userData = await authService.getCurrentUser(authToken)
      setUser(userData)
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      // Don't remove token if it's a Kite or Fyers session
      const kiteSessionStr = localStorage.getItem('kite_session')
      const fyersSessionStr = localStorage.getItem('fyers_session')
      if (!kiteSessionStr && !fyersSessionStr) {
        localStorage.removeItem('token')
        setToken(null)
      }
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
    localStorage.removeItem('kite_session')
    localStorage.removeItem('fyers_session')
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

