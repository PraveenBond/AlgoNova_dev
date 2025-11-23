import { useState, useEffect } from 'react'
import api from '../services/api'
import './PortfolioPage.css'

interface Position {
  id: number
  instrument_token: string
  quantity: number
  average_price: number
  last_price: number
  pnl: number
}

interface PnLResponse {
  total_pnl: number
  positions: Position[]
}

const PortfolioPage = () => {
  const [pnlData, setPnlData] = useState<PnLResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPnL()
  }, [])

  const fetchPnL = async () => {
    try {
      const response = await api.get<PnLResponse>('/api/portfolio/pnl')
      setPnlData(response.data)
    } catch (error) {
      console.error('Failed to fetch P&L:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="portfolio-page">Loading...</div>
  }

  return (
    <div className="portfolio-page">
      <h1>Portfolio</h1>
      <div className="pnl-summary">
        <div className="pnl-card">
          <h2>Total P&L</h2>
          <p className={`pnl-value ${pnlData && pnlData.total_pnl >= 0 ? 'positive' : 'negative'}`}>
            ₹{pnlData?.total_pnl.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>
      <div className="positions-section">
        <h2>Positions</h2>
        <div className="positions-table-container">
          <table className="positions-table">
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Quantity</th>
                <th>Avg Price</th>
                <th>Last Price</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {pnlData && pnlData.positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="no-positions">No open positions</td>
                </tr>
              ) : (
                pnlData?.positions.map((position) => (
                  <tr key={position.id}>
                    <td>{position.instrument_token}</td>
                    <td>{position.quantity}</td>
                    <td>₹{position.average_price.toFixed(2)}</td>
                    <td>₹{position.last_price.toFixed(2)}</td>
                    <td className={position.pnl >= 0 ? 'positive' : 'negative'}>
                      ₹{position.pnl.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default PortfolioPage

