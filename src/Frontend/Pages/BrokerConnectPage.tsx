import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import './BrokerConnectPage.css'

interface BrokerStatus {
  connected: boolean
  message: string
}

interface LoginUrlResponse {
  login_url: string
}

const BrokerConnectPage = () => {
  const [status, setStatus] = useState<BrokerStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchStatus()
    
    // Check for callback status
    const callbackStatus = searchParams.get('status')
    const callbackMessage = searchParams.get('message')
    
    if (callbackStatus === 'success') {
      setMessage('Broker connected successfully!')
      fetchStatus()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (callbackStatus === 'error') {
      setMessage(callbackMessage || 'Failed to connect broker')
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

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
      // Redirect to Kite login page
      window.location.href = response.data.login_url
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
            </div>
            <button 
              type="button" 
              onClick={handleConnect} 
              disabled={loading || (status?.connected === true)} 
              className="connect-btn"
            >
              {loading ? 'Connecting...' : status?.connected ? 'Already Connected' : 'Connect with Kite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrokerConnectPage

