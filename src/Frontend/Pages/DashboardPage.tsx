import { useState, useEffect } from 'react'
import { Area, Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import api from '../services/api'
import './DashboardPage.css'

interface DashboardStats {
  available_balance: number
  number_trades: number
  today_pnl: number
  total_balance: number
  weekly_pnl: number
  monthly_pnl: number
}

interface KPICardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  highlighted?: boolean
}

const KPICard: React.FC<KPICardProps> = ({ title, value, description, icon, highlighted }) => {
  return (
    <div className={`kpi-card ${highlighted ? 'highlighted' : ''}`}>
      <div className="kpi-header">
        <h3 className="kpi-title">{title}</h3>
        <div className="kpi-icon">{icon}</div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-description">{description}</div>
    </div>
  )
}

const DashboardPage = () => {
  const [chartView, setChartView] = useState<'cumulative' | 'daily' | 'both'>('both')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get<DashboardStats>('/api/portfolio/dashboard-stats')
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
      // Set default values on error
      setStats({
        available_balance: 0,
        number_trades: 0,
        today_pnl: 0,
        total_balance: 0,
        weekly_pnl: 0,
        monthly_pnl: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Format currency with Indian number formatting
  const formatCurrency = (value: number): string => {
    return `₹ ${value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
  }

  // Sample data for the performance chart
  const performanceData = [
    { date: '23 Oct', netDaily: -2000, cumulative: -2000 },
    { date: '24 Oct', netDaily: -1500, cumulative: -3500 },
    { date: '25 Oct', netDaily: -1000, cumulative: -4500 },
    { date: '26 Oct', netDaily: 1000, cumulative: -3500 },
    { date: '27 Oct', netDaily: 6000, cumulative: 2500 },
    { date: '28 Oct', netDaily: -3000, cumulative: -500 },
    { date: '29 Oct', netDaily: -7000, cumulative: -7500 },
    { date: '30 Oct', netDaily: 5000, cumulative: -2500 },
    { date: '31 Oct', netDaily: -2000, cumulative: -4500 },
    { date: '01 Nov', netDaily: 1000, cumulative: -3500 },
    { date: '02 Nov', netDaily: -1000, cumulative: -4500 },
    { date: '03 Nov', netDaily: -3000, cumulative: -7500 },
  ]

  // Custom function to get color based on value
  const getBarColor = (value: number) => {
    return value >= 0 ? '#27AE60' : '#E74C3C'
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <div className="kpi-grid">
        <KPICard
          title="Available Balance"
          value={stats ? formatCurrency(stats.available_balance) : '₹ 0.00'}
          description="Total Available balance"
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="2" fill="#27AE60" fillOpacity="0.2"/>
              <path d="M16 12V20M12 16H20" stroke="#27AE60" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 14H24" stroke="#27AE60" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
        <KPICard
          title="Number Trades"
          value={stats ? stats.number_trades.toString() : '0'}
          description="Today Number of Trades"
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="6" y="6" width="20" height="20" rx="2" fill="#F39C12" fillOpacity="0.2"/>
              <path d="M12 12H20M12 16H20M12 20H16" stroke="#F39C12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
          highlighted
        />
        <KPICard
          title="Profit & Loss (P&L)"
          value={stats ? formatCurrency(stats.today_pnl) : '₹ 0.00'}
          description="Today Total Profit & Loss"
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M4 20L12 12L18 18L28 8" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M28 8H22V14" stroke="#27AE60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
        />
        <KPICard
          title="Total Balance"
          value={stats ? formatCurrency(stats.total_balance) : '₹ 0.00'}
          description="Total Available balance + Profit"
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="6" y="6" width="20" height="20" rx="2" fill="#3498DB" fillOpacity="0.2"/>
              <path d="M12 12H20M12 16H20M12 20H20" stroke="#3498DB" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
        />
        <KPICard
          title="Weekly P&L"
          value={stats ? formatCurrency(stats.weekly_pnl) : '₹ 0.00'}
          description="Weekly P&L"
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" stroke="#27AE60" strokeWidth="2" fill="#27AE60" fillOpacity="0.2"/>
              <path d="M16 8V16L20 20" stroke="#27AE60" strokeWidth="2" strokeLinecap="round"/>
              <text x="16" y="18" textAnchor="middle" fontSize="8" fill="#27AE60" fontWeight="bold">WEEK</text>
            </svg>
          }
        />
        <KPICard
          title="Monthly (P&L)"
          value={stats ? formatCurrency(stats.monthly_pnl) : '₹ 0.00'}
          description="Monthly Profit & Loss"
          icon={
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" stroke="#FF6B9D" strokeWidth="2" fill="#FF6B9D" fillOpacity="0.2"/>
              <path d="M16 8V16L20 20" stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round"/>
              <text x="16" y="18" textAnchor="middle" fontSize="8" fill="#FF6B9D" fontWeight="bold">MONTH</text>
            </svg>
          }
        />
      </div>

      <div className="performance-card">
        <div className="performance-header">
          <h2 className="performance-title">Performance</h2>
          <div className="performance-controls">
            <button
              className={`chart-toggle ${chartView === 'cumulative' ? 'active' : ''}`}
              onClick={() => setChartView('cumulative')}
            >
              Cumulative P/L
            </button>
            <button
              className={`chart-toggle ${chartView === 'daily' ? 'active' : ''}`}
              onClick={() => setChartView('daily')}
            >
              Net Daily P/L
            </button>
            <button
              className={`chart-toggle ${chartView === 'both' ? 'active' : ''}`}
              onClick={() => setChartView('both')}
            >
              Both
            </button>
          </div>
        </div>
        <div className="performance-chart">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={performanceData} margin={{ top: 10, right: 80, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis
                yAxisId="left"
                label={{ value: 'Net Daily Profit and Loss', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                stroke="#666"
                domain={[-8000, 8000]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: 'Cumulative Profit and Loss', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                stroke="#666"
                domain={[-20000, 20000]}
              />
              <defs>
                <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E74C3C" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#E74C3C" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Tooltip />
              {(chartView === 'cumulative' || chartView === 'both') && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulative"
                  fill="url(#colorCumulative)"
                  fillOpacity={0.3}
                  stroke="#E74C3C"
                  strokeWidth={2}
                  name="Cumulative P/L"
                />
              )}
              {(chartView === 'daily' || chartView === 'both') && (
                <Bar yAxisId="left" dataKey="netDaily" name="Net Daily P/L">
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.netDaily)} />
                  ))}
                </Bar>
              )}
              <Legend />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="performance-footer">
          <span className="performance-help">What's this? Learn more.</span>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
