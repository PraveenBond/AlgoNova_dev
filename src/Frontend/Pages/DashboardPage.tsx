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

interface BuildUpItem {
  name: string
  prevClose: string
  ltp: string
  changePercent: string
  newOI: string
  oldOI: string
  oiChange: string
  isPositive: boolean
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

const longBuildUpData: BuildUpItem[] = [
  { name: 'ABB', prevClose: '5,221.50', ltp: '5,252.50', changePercent: '(0.59%)', newOI: '27.97L', oldOI: '27.91L', oiChange: '6.50K', isPositive: true },
  { name: 'ASHOKLEY', prevClose: '150.04', ltp: '156.90', changePercent: '(4.57%)', newOI: '12.87Cr', oldOI: '11.45Cr', oiChange: '1.42Cr', isPositive: true },
  { name: 'ASIANPAINT', prevClose: '2,889.20', ltp: '2,892.00', changePercent: '(0.10%)', newOI: '1.08Cr', oldOI: '1.06Cr', oiChange: '1.47L', isPositive: true },
  { name: 'BAJAJFINSV', prevClose: '2,099.60', ltp: '2,123.80', changePercent: '(1.15%)', newOI: '1.85Cr', oldOI: '1.84Cr', oiChange: '1.30L', isPositive: true },
  { name: 'BANKBARODA', prevClose: '289.70', ltp: '290.10', changePercent: '(0.14%)', newOI: '9.75Cr', oldOI: '9.31Cr', oiChange: '44.11L', isPositive: true },
  { name: 'BANKNIFTY', prevClose: '59,817.20', ltp: '60,066.80', changePercent: '(0.42%)', newOI: '15.78L', oldOI: '14.39L', oiChange: '1.40L', isPositive: true },
  { name: 'BDL', prevClose: '1,498.00', ltp: '1,507.00', changePercent: '(0.60%)', newOI: '45.90L', oldOI: '44.93L', oiChange: '97.18K', isPositive: true },
  { name: 'BHEL', prevClose: '280.00', ltp: '285.00', changePercent: '(1.79%)', newOI: '50.00L', oldOI: '48.00L', oiChange: '2.00L', isPositive: true },
  { name: 'CANBK', prevClose: '580.00', ltp: '585.00', changePercent: '(0.86%)', newOI: '20.00L', oldOI: '19.00L', oiChange: '1.00L', isPositive: true },
]

const shortBuildUpData: BuildUpItem[] = [
  { name: 'ADANIENSOL', prevClose: '995.85', ltp: '988.65', changePercent: '(-0.72%)', newOI: '1.91Cr', oldOI: '1.91Cr', oiChange: '66.15K', isPositive: false },
  { name: 'ADANIENT', prevClose: '2,326.40', ltp: '2,259.60', changePercent: '(-2.87%)', newOI: '1.72Cr', oldOI: '1.51Cr', oiChange: '20.82L', isPositive: false },
  { name: 'ADANIGREEN', prevClose: '1,040.80', ltp: '1,039.90', changePercent: '(-0.09%)', newOI: '2.19Cr', oldOI: '2.16Cr', oiChange: '2.84L', isPositive: false },
  { name: 'ADANIPORTS', prevClose: '1,517.50', ltp: '1,516.30', changePercent: '(-0.08%)', newOI: '2.41Cr', oldOI: '2.40Cr', oiChange: '66.03K', isPositive: false },
  { name: 'ALKEM', prevClose: '5,798.50', ltp: '5,743.50', changePercent: '(-0.95%)', newOI: '16.13L', oldOI: '15.85L', oiChange: '28.75K', isPositive: false },
  { name: 'AMBER', prevClose: '7,052.00', ltp: '6,975.00', changePercent: '(-1.09%)', newOI: '11.65L', oldOI: '11.17L', oiChange: '48.50K', isPositive: false },
  { name: 'AMBUJACEM', prevClose: '553.95', ltp: '551.40', changePercent: '(-0.46%)', newOI: '4.66Cr', oldOI: '4.62Cr', oiChange: '4.01L', isPositive: false },
  { name: 'APOLLOHOSP', prevClose: '6,200.00', ltp: '6,150.00', changePercent: '(-0.81%)', newOI: '15.00L', oldOI: '14.50L', oiChange: '50.00K', isPositive: false },
  { name: 'AXISBANK', prevClose: '1,100.00', ltp: '1,090.00', changePercent: '(-0.91%)', newOI: '3.00Cr', oldOI: '2.90Cr', oiChange: '10.00L', isPositive: false },
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

      {/* Build Up Section (Scrollable Cards) */}
      <div className="buildup-section">
        <BuildUpCard title="Long Build Up" data={longBuildUpData} />
        <BuildUpCard title="Short Build Up" data={shortBuildUpData} />
      </div>
    </div>
  )
}

const BuildUpCard = ({ title, data }: { title: string; data: BuildUpItem[] }) => {
  return (
    <div className="buildup-card">
      <div className="buildup-header">
        <button className="nav-arrow">&lt;</button>
        <h3>{title}</h3>
        <button className="nav-arrow">&gt;</button>
      </div>
      <div className="buildup-table-container">
        <table className="buildup-table">
          <thead>
            <tr>
              <th>Name <span className="sort-icon">◆</span></th>
              <th>Prev Close / LTP(Change%) <span className="sort-icon">◆</span></th>
              <th>New OI <span className="sort-icon">◆</span></th>
              <th>Old OI <span className="sort-icon">◆</span></th>
              <th>OI(Change) <span className="sort-icon">◆</span></th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="fw-medium">{item.name}</td>
                <td>
                  <div className="price-cell">
                    <span>{item.prevClose}</span>
                    <span className={item.isPositive ? 'text-green' : 'text-red'}>
                      {item.ltp} {item.changePercent}
                    </span>
                  </div>
                </td>
                <td>{item.newOI}</td>
                <td>{item.oldOI}</td>
                <td>{item.oiChange}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="buildup-footer">
        <button className="expand-btn">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default DashboardPage
