import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../Component/AuthContext'
import api, { API_ORIGIN } from '../services/api'
import './LoginPage.css'

const buildFyersUser = (profilePayload: any) => {
  const profileData = profilePayload?.data || profilePayload || {}
  const rawId = profileData.client_id || profileData.user_id || profileData.id || Date.now()
  const username =
    profileData.display_name ||
    profileData.name ||
    profileData.client_name ||
    profileData.client_id ||
    'Fyers User'
  const email =
    profileData.email ||
    profileData.email_id ||
    `${(profileData.client_id || 'fyers').toString().toLowerCase()}@fyers.local`
  const numericId =
    typeof rawId === 'number' && Number.isFinite(rawId)
      ? rawId
      : (() => {
        const parsed = parseInt(String(rawId).replace(/\D/g, ''), 10)
        return Number.isFinite(parsed) ? parsed : Date.now()
      })()

  return {
    id: numericId,
    username: String(username),
    email: String(email)
  }
}

const LoginPage = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [kiteLoading, setKiteLoading] = useState(false)
  const [fyersLoading, setFyersLoading] = useState(false)
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
        // Create a simple session for the app using rofile
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

  const handleFyersLogin = async () => {
    setError('')
    setFyersLoading(true)

    let fyersPopup: Window | null = null
    let popupMonitor: number | undefined

    const backendOrigin = API_ORIGIN

    const removeListeners = () => {
      if (popupMonitor) {
        window.clearInterval(popupMonitor)
        popupMonitor = undefined
      }
      window.removeEventListener('message', messageHandler)
    }

    const finalize = () => {
      removeListeners()
      if (fyersPopup && !fyersPopup.closed) {
        fyersPopup.close()
      }
      setFyersLoading(false)
    }

    function messageHandler(event: MessageEvent<any>) {
      if (event.origin !== backendOrigin) {
        return
      }
      const payload = event.data
      if (!payload || payload.provider !== 'fyers') {
        return
      }

      finalize()

      if (payload.success) {
        const fyersProfile = payload.data?.profile || {}
        const sessionToken = payload.data?.access_token || `fyers_${Date.now()}`
        const fyersSession = {
          token: sessionToken,
          profile: fyersProfile,
          user: buildFyersUser(fyersProfile),
          fyers_authenticated: true
        }
        localStorage.setItem('token', sessionToken)
        localStorage.setItem('fyers_session', JSON.stringify(fyersSession))
        window.location.href = '/'
      } else {
        setError(payload.error || 'Failed to connect to Fyers')
      }
    }

    window.addEventListener('message', messageHandler)

    try {
      const response = await api.get('/api/fyers/login-url')
      if (response.data.success && response.data.login_url) {
        fyersPopup = window.open(
          response.data.login_url,
          'fyers-login',
          'width=520,height=720,top=120,left=160'
        )

        if (!fyersPopup) {
          throw new Error('Popup blocked. Please allow popups for this site.')
        }

        popupMonitor = window.setInterval(() => {
          if (fyersPopup && fyersPopup.closed) {
            removeListeners()
            setFyersLoading(false)
            setError('Fyers login window was closed before completion.')
          }
        }, 400)
      } else {
        throw new Error('Failed to get Fyers login URL')
      }
    } catch (err: any) {
      finalize()
      setError(err.response?.data?.detail || err.message || 'Failed to connect to Fyers')
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

            {/* Fyers Login Option */}
            <div className="kite-login-section" style={{ marginTop: '1.5rem' }}>
              <h3>Connect with Fyers</h3>
              <p className="kite-description">
                Login with your Fyers account to access trading features
              </p>
              <button
                type="button"
                onClick={handleFyersLogin}
                className="kite-login-btn"
                disabled={fyersLoading}
                style={{ background: '#0d6efd' }}
              >
                {fyersLoading ? 'Opening Fyers Login...' : 'Open Fyers Login'}
              </button>
            </div>




          </div>
        )}


      </div>
    </div>
  )
}

export default LoginPage

