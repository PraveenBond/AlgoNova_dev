import { useEffect, useState } from 'react'
import api from '../services/api'
import './DashboardPage.css'

interface BrokerStatus {
  connected: boolean
  message: string
}

const DashboardPage = () => {
  const [brokerStatus, setBrokerStatus] = useState<BrokerStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrokerStatus()
  }, [])

  const fetchBrokerStatus = async () => {
    try {
      const response = await api.get<BrokerStatus>('/api/broker/status')
      setBrokerStatus(response.data)
    } catch (error) {
      console.error('Failed to fetch broker status:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-page">
      <h1>Dashboard</h1>
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h2>Broker Connection</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div>
              <p className={brokerStatus?.connected ? 'status-connected' : 'status-disconnected'}>
                {brokerStatus?.connected ? '✓ Connected' : '✗ Disconnected'}
              </p>
              <p className="status-message">{brokerStatus?.message}</p>
            </div>
          )}
        </div>
        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button onClick={() => window.location.href = '/broker/connect'}>
              Connect Broker
            </button>
            <button onClick={() => window.location.href = '/orders'}>
              Place Order
            </button>
            <button onClick={() => window.location.href = '/strategies'}>
              Manage Strategies
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage

