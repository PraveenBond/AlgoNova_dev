import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../Component/AuthContext'
import api from '../services/api'
import './LoginPage.css'

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [kiteLoading, setKiteLoading] = useState(false)
  const [requestToken, setRequestToken] = useState('')
  const [showTokenForm, setShowTokenForm] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  // Extract request_token from URL if present and show form
  useEffect(() => {
    const urlToken = searchParams.get('request_token')
    const error = searchParams.get('error')
    
    // If we have request_token in URL, extract it and show form
    if (urlToken) {
      setRequestToken(urlToken)
      setShowTokenForm(true)
      // Clean up URL
      window.history.replaceState({}, '', '/login')
    } else if (error) {
      setError(decodeURIComponent(error))
      window.history.replaceState({}, '', '/login')
    }
  }, [searchParams])

  const handleKiteCallback = async (requestToken: string) => {
    setKiteLoading(true)
    setError('')
    
    try {
      // Call backend to process request_token and generate access_token
      const response = await api.get('/api/broker/callback', {
        params: { 
          request_token: requestToken,
          status: searchParams.get('status'),
          action: searchParams.get('action')
        }
      })
      
      if (response.data.success) {
        // Token stored automatically by backend
        // Create a simple session for the app using Kite profile
        const profile = response.data.data?.profile
        if (profile) {
          // Store Kite session info
          const kiteSession = {
            token: `kite_${Date.now()}`,
            user: {
              id: profile.user_id || profile.userId || 'kite_user',
              username: profile.user_name || profile.userName || profile.email || 'Kite User',
              email: profile.email || `${profile.user_id || 'user'}@kite.local`
            },
            kite_authenticated: true
          }
          localStorage.setItem('token', kiteSession.token)
          localStorage.setItem('kite_session', JSON.stringify(kiteSession))
          
          // Reload to update auth context
          window.location.href = '/'
          return
        }
        
        // Fallback: just navigate
        setTimeout(() => {
          navigate('/')
        }, 500)
      } else {
        setError('Failed to process Kite login')
        setKiteLoading(false)
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process Kite login')
      setKiteLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKiteLogin = async () => {
    setError('')
    
    try {
      const response = await api.get('/api/broker/login-url')
      if (response.data.success && response.data.login_url) {
        // Open Kite login in a new window/tab
        window.open(response.data.login_url, '_blank')
        // Show the token form
        setShowTokenForm(true)
      } else {
        setError('Failed to get Kite login URL')
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect to Kite')
    }
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!requestToken.trim()) {
      setError('Please enter a request token')
      return
    }
    
    await handleKiteCallback(requestToken.trim())
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img 
            src="/logo/AlgoNova-Photoroom.png" 
            alt="AlgoNova AI Logo" 
            className="login-logo"
          />
          <h1>AlgoNova AI</h1>
          <h2>Welcome Back</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        
        {kiteLoading && (
          <div className="kite-loading-message">
            <div className="loading-spinner-small"></div>
            <p>Processing Kite login... Please wait</p>
          </div>
        )}

        {!kiteLoading && (
          <div className="login-options">
            {/* Kite Login Option */}
            <div className="kite-login-section">
              <h3>Connect with Kite</h3>
              <p className="kite-description">
                Login with your Zerodha Kite account to access trading features
              </p>
              
              {!showTokenForm ? (
                <button
                  type="button"
                  onClick={handleKiteLogin}
                  className="kite-login-btn"
                >
                  Open Kite Login
                </button>
              ) : (
                <form onSubmit={handleTokenSubmit} className="token-form">
                  <div className="form-group">
                    <label htmlFor="request_token">Enter Request Token</label>
                    <p className="token-instruction">
                      After logging into Kite, copy the <code>request_token</code> from the URL and paste it here.
                      <br />
                      <small>Example: The token from URL like <code>?request_token=ABC123...</code></small>
                    </p>
                    <input
                      type="text"
                      id="request_token"
                      value={requestToken}
                      onChange={(e) => setRequestToken(e.target.value)}
                      required
                      placeholder="Paste your request token here"
                      className="token-input"
                    />
                  </div>
                  <div className="token-form-actions">
                    <button type="submit" disabled={kiteLoading} className="kite-login-btn">
                      {kiteLoading ? 'Processing...' : 'Submit & Login'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTokenForm(false)
                        setRequestToken('')
                        setError('')
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            

           
          </div>
        )}

        
      </div>
    </div>
  )
}

export default LoginPage

