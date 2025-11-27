import { useState } from 'react'
import './DashboardPage.css'

interface MarketIndex {
  name: string
  value: string
  change: string
  percentChange: string
  isPositive: boolean
  gainers: number
  losers: number
  neutral: number
  chartData: number[] // Mock data for sparkline
}

const marketIndices: MarketIndex[] = [
  {
    name: 'NIFTY',
    value: '26,215.55',
    change: '10.25',
    percentChange: '0.04%',
    isPositive: true,
    gainers: 23,
    losers: 26,
    neutral: 1,
    chartData: [26200, 26210, 26205, 26220, 26215, 26230, 26225, 26215]
  },
  {
    name: 'BANKNIFTY',
    value: '59,737.30',
    change: '209.25',
    percentChange: '0.35%',
    isPositive: true,
    gainers: 5,
    losers: 7,
    neutral: 0,
    chartData: [59500, 59600, 59550, 59700, 59650, 59750, 59737]
  },
  {
    name: 'FINNIFTY',
    value: '27,946.20',
    change: '146.70',
    percentChange: '0.53%',
    isPositive: true,
    gainers: 13,
    losers: 6,
    neutral: 0,
    chartData: [27800, 27850, 27900, 27880, 27920, 27950, 27946]
  },
  {
    name: 'SENSEX',
    value: '85,150.25',
    change: '250.50',
    percentChange: '0.30%',
    isPositive: true,
    gainers: 20,
    losers: 10,
    neutral: 0,
    chartData: [85000, 85100, 85050, 85200, 85150]
  },
  {
    name: 'MIDCPNIFTY',
    value: '12,150.75',
    change: '-45.20',
    percentChange: '-0.37%',
    isPositive: false,
    gainers: 15,
    losers: 35,
    neutral: 0,
    chartData: [12200, 12180, 12190, 12160, 12150]
  },
  {
    name: 'BANKEX',
    value: '54,300.10',
    change: '120.40',
    percentChange: '0.22%',
    isPositive: true,
    gainers: 8,
    losers: 2,
    neutral: 0,
    chartData: [54200, 54250, 54220, 54300, 54300]
  }
]

const commodityIndices: MarketIndex[] = [
  {
    name: 'CRUDEOIL',
    value: '6,450.00',
    change: '55.00',
    percentChange: '0.86%',
    isPositive: true,
    gainers: 0,
    losers: 0,
    neutral: 0,
    chartData: [6400, 6420, 6410, 6440, 6450]
  },
  {
    name: 'NATURALGAS',
    value: '245.50',
    change: '-2.10',
    percentChange: '-0.85%',
    isPositive: false,
    gainers: 0,
    losers: 0,
    neutral: 0,
    chartData: [250, 248, 249, 246, 245]
  },
  {
    name: 'GOLD',
    value: '72,500.00',
    change: '350.00',
    percentChange: '0.48%',
    isPositive: true,
    gainers: 0,
    losers: 0,
    neutral: 0,
    chartData: [72200, 72300, 72250, 72400, 72500]
  },
  {
    name: 'SILVER',
    value: '84,200.00',
    change: '600.00',
    percentChange: '0.72%',
    isPositive: true,
    gainers: 0,
    losers: 0,
    neutral: 0,
    chartData: [83800, 84000, 83900, 84100, 84200]
  }
]

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('Markets')

  return (
    <div className="dashboard-page">
      {/* Sub Navigation */}
      <div className="dashboard-nav">
        {['Home', 'Markets', 'Commodities', 'Index Contributors', 'Find Strategy'].map((tab) => (
          <button
            key={tab}
            className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Market Overview Cards */}
      <div className="market-overview">
        {(activeTab === 'Commodities' ? commodityIndices : marketIndices).map((index) => (
          <div key={index.name} className="market-card">
            <div className="market-card-header">
              <h3>{index.name}</h3>
              <div className="market-chart-placeholder">
                {/* SVG Sparkline Placeholder */}
                <svg width="100" height="40" viewBox="0 0 100 40">
                  <path
                    d={`M0 30 Q 20 ${index.isPositive ? 10 : 35}, 40 ${index.isPositive ? 15 : 25} T 100 ${index.isPositive ? 5 : 35}`}
                    fill="none"
                    stroke={index.isPositive ? '#22c55e' : '#ef4444'}
                    strokeWidth="2"
                  />
                  <linearGradient id={`grad-${index.name}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={index.isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={index.isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                  <path
                    d={`M0 30 Q 20 ${index.isPositive ? 10 : 35}, 40 ${index.isPositive ? 15 : 25} T 100 ${index.isPositive ? 5 : 35} V 40 H 0 Z`}
                    fill={`url(#grad-${index.name})`}
                    stroke="none"
                  />
                </svg>
              </div>
            </div>

            <div className="market-values">
              <span className={`current-value ${index.isPositive ? 'positive' : 'negative'}`}>
                {index.value}
              </span>
              <span className="change-value">
                {index.isPositive ? '↗' : '↘'} {index.change}
              </span>
            </div>

            <div className="market-stats">
              <div className="stat-item">
                <span className="dot green"></span>
                <span>{index.gainers} Gainers</span>
              </div>
              <div className="stat-item">
                <span className="dot red"></span>
                <span>{index.losers} Losers</span>
              </div>
              <div className="stat-item">
                <span className="dot grey"></span>
                <span>{index.neutral} Neutral</span>
              </div>
            </div>

            <div className="market-actions">
              <button className="action-link">Option Chain &gt;</button>
              <button className="action-link">Combined Chart &gt;</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DashboardPage
