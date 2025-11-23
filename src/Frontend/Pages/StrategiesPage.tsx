import { useState, useEffect } from 'react'
import api from '../services/api'
import './StrategiesPage.css'

interface Strategy {
  id: number
  name: string
  description: string | null
  strategy_config: Record<string, any>
  is_active: boolean
  created_at: string
}

const StrategiesPage = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStrategies()
  }, [])

  const fetchStrategies = async () => {
    try {
      const response = await api.get<Strategy[]>('/api/strategies')
      setStrategies(response.data)
    } catch (error) {
      console.error('Failed to fetch strategies:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStrategy = async (id: number, isActive: boolean) => {
    try {
      const endpoint = isActive ? 'disable' : 'enable'
      await api.post(`/api/strategies/${id}/${endpoint}`)
      fetchStrategies() // Refresh list
    } catch (error) {
      console.error('Failed to toggle strategy:', error)
    }
  }

  if (loading) {
    return <div className="strategies-page">Loading...</div>
  }

  return (
    <div className="strategies-page">
      <h1>Strategies</h1>
      <div className="strategies-list">
        {strategies.length === 0 ? (
          <div className="no-strategies">No strategies found</div>
        ) : (
          strategies.map((strategy) => (
            <div key={strategy.id} className="strategy-card">
              <div className="strategy-header">
                <h2>{strategy.name}</h2>
                <button
                  onClick={() => toggleStrategy(strategy.id, strategy.is_active)}
                  className={`toggle-btn ${strategy.is_active ? 'active' : 'inactive'}`}
                >
                  {strategy.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
              {strategy.description && <p className="strategy-description">{strategy.description}</p>}
              <div className="strategy-status">
                Status: <span className={strategy.is_active ? 'status-active' : 'status-inactive'}>
                  {strategy.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="strategy-config">
                <strong>Config:</strong>
                <pre>{JSON.stringify(strategy.strategy_config, null, 2)}</pre>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default StrategiesPage

