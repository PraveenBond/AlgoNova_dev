import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import './BrokerConnectPage.css'

interface BrokerStatus {
  connected: boolean
  message: string
}

interface LoginUrlResponse {
  success: boolean
  login_url: string
}

interface CallbackResponse {
  success: boolean
  message: string
  data?: {
    profile: any
    access_token: string
  }
}

const BrokerConnectPage = () => {
  const [status, setStatus] = useState<BrokerStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if this is a callback from Kite - extract request_token from URL
    const requestToken = searchParams.get('request_token')
    const action = searchParams.get('action')
    const statusParam = searchParams.get('status')
    
    if (requestToken) {
      // This is a callback from Kite - process it immediately
      handleKiteCallback(requestToken, action, statusParam)
    } else {
      // Normal page load
      fetchStatus()
    }
  }, [searchParams])
  
  const handleKiteCallback = async (requestToken: string, action: string | null, statusParam: string | null) => {
    setLoading(true)
    setMessage('Processing request token...')
    
    try {
      // If we're on 127.0.0.1, we need to use the backend URL directly
      const apiBaseUrl = window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:8000' 
        : undefined
      
      const axiosConfig = apiBaseUrl ? {
        baseURL: apiBaseUrl,
        headers: { 'Content-Type': 'application/json' }
      } : {}
      
      // Use the callback endpoint to generate access_token from request_token
      const response = await api.get<CallbackResponse>('/api/broker/callback', {
        params: {
          request_token: requestToken,
          action: action,
          status: statusParam
        },
        ...axiosConfig
      })
      
      if (response.data.success && response.data.data?.access_token) {
        setMessage('Successfully connected! Access token generated and stored.')
        
        // Redirect to profile page
        setTimeout(() => {
          // If on 127.0.0.1, redirect to localhost
          if (window.location.hostname === '127.0.0.1') {
            window.location.href = `http://localhost:3000/profile`
          } else {
            navigate('/profile')
          }
        }, 1500)
      } else {
        setMessage(response.data.message || 'Failed to connect')
        setLoading(false)
      }
    } catch (error: any) {
      console.error('Callback error:', error)
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to process Kite callback'
      setMessage(`Error: ${errorMsg}. Make sure backend is running on http://localhost:8000`)
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    try {
      const response = await api.get<BrokerStatus>('/api/broker/status')
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to fetch broker status:', error)
    }
  }

  const handleConnect = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await api.get<LoginUrlResponse>('/api/broker/login-url')
      if (response.data.success && response.data.login_url) {
        // Redirect to Kite login page
        window.location.href = response.data.login_url
      } else {
        setMessage('Failed to get login URL')
        setLoading(false)
      }
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to get login URL')
      setLoading(false)
    }
  }


  return (
    <div className="broker-connect-page">
      <h1>Broker Connection</h1>
      <div className="broker-connect-container">
        <div className="status-section">
          <h2>Connection Status</h2>
          {status && (
            <div className={`status-indicator ${status.connected ? 'connected' : 'disconnected'}`}>
              {status.connected ? '✓ Connected' : '✗ Disconnected'}
            </div>
          )}
          {status && <p className="status-message">{status.message}</p>}
        </div>
        <div className="connect-section">
          <h2>Connect Kite Account</h2>
          <div className="connect-form">
            {message && (
              <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            <div className="form-group">
              <p className="info-text">
                Click the button below to connect your Kite account. You will be redirected to Kite's login page.
                After successful authentication, you will be redirected back to this page.
              </p>
              <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '0.9rem'}}>
                <p style={{margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#856404'}}>⚠️ Important Configuration:</p>
                <p style={{margin: '0', color: '#856404'}}>
                  Make sure your Kite app redirect URL is set to: <strong>http://localhost:3000/broker/connect</strong>
                </p>
                <p style={{margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#856404'}}>
                  Update it at: <a href="https://kite.trade/apps/" target="_blank" rel="noopener noreferrer" style={{color: '#0066cc'}}>https://kite.trade/apps/</a>
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={handleConnect} 
              disabled={loading || (status?.connected === true)} 
              className="connect-btn"
            >
              {loading ? 'Connecting...' : status?.connected ? 'Already Connected' : 'Connect with Kite'}
            </button>
            
            <div style={{marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #ddd'}}>
              <button 
                type="button" 
                onClick={() => setShowTokenInput(!showTokenInput)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.9rem'
                }}
              >
                {showTokenInput ? 'Hide' : 'I have a request_token from URL'}
              </button>
              
              {showTokenInput && (
                <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666'}}>
                    If you have a <strong>request_token</strong> from the Kite redirect URL, paste it here:
                  </p>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#999'}}>
                    (This will automatically generate and store the access_token)
                  </p>
                  <textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Paste your request_token here (from URL like: ?request_token=XXXXX)"
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '0.5rem',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      // Process request_token to generate access_token
                      if (!accessToken.trim()) {
                        setMessage('Please enter a request_token')
                        return
                      }
                      setLoading(true)
                      setMessage('Processing request_token...')
                      try {
                        const response = await api.get('/api/broker/callback', {
                          params: { request_token: accessToken.trim() }
                        })
                        if (response.data.success) {
                          setMessage('Success! Access token generated and stored. Redirecting...')
                          setTimeout(() => navigate('/profile'), 1500)
                        }
                      } catch (error: any) {
                        setMessage(error.response?.data?.detail || 'Failed to process request_token')
                        setLoading(false)
                      }
                    }}
                    disabled={loading || !accessToken.trim()}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: loading || !accessToken.trim() ? 'not-allowed' : 'pointer',
                      opacity: loading || !accessToken.trim() ? 0.6 : 1
                    }}
                  >
                    {loading ? 'Processing...' : 'Process Request Token'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrokerConnectPage

