import { useState, useEffect } from 'react'
import api from '../services/api'
import './BrokerConnectPage.css'

interface BrokerStatus {
  connected: boolean
  message: string
}

const BrokerConnectPage = () => {
  const [apiKey, setApiKey] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [status, setStatus] = useState<BrokerStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await api.get<BrokerStatus>('/api/broker/status')
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to fetch broker status:', error)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      await api.post('/api/broker/connect', {
        api_key: apiKey,
        access_token: accessToken,
      })
      setMessage('Broker connected successfully!')
      setApiKey('')
      setAccessToken('')
      fetchStatus()
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to connect broker')
    } finally {
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
          <form onSubmit={handleConnect} className="connect-form">
            {message && (
              <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}
            <div className="form-group">
              <label htmlFor="api-key">API Key</label>
              <input
                type="text"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder="Enter your Kite API Key"
              />
            </div>
            <div className="form-group">
              <label htmlFor="access-token">Access Token</label>
              <input
                type="text"
                id="access-token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                required
                placeholder="Enter your Kite Access Token"
              />
            </div>
            <button type="submit" disabled={loading} className="connect-btn">
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default BrokerConnectPage

