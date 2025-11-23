import { useState, useEffect } from 'react'
import api from '../services/api'
import './UsersPage.css'

interface UserDetails {
  user_id: string
  user_name: string
  user_shortname: string
  email: string
  user_type: string
  broker: string
  exchanges: string[]
  products: string[]
  order_types: string[]
  avatar_url?: string
  api_key: string
  access_token: string
  public_token?: string
  enctoken?: string
  login_time?: string
  meta?: {
    profile: any
    margins: any
  }
}

const UsersPage = () => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'holdings' | 'orders' | 'trades' | 'mf'>('profile')
  const [holdings, setHoldings] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [trades, setTrades] = useState<any[]>([])
  const [mfHoldings, setMfHoldings] = useState<any[]>([])
  const [mfOrders, setMfOrders] = useState<any[]>([])
  const [mfSips, setMfSips] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    fetchUserDetails()
  }, [])

  useEffect(() => {
    if (userDetails && activeTab !== 'profile') {
      fetchTabData()
    }
  }, [activeTab, userDetails])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get<UserDetails>('/api/broker/user-details')
      setUserDetails(response.data)
    } catch (error: any) {
      console.error('Failed to fetch user details:', error)
      setError(error.response?.data?.detail || 'Failed to fetch user details. Please ensure your Kite account is connected.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTabData = async () => {
    if (!userDetails) return
    
    setLoadingData(true)
    try {
      switch (activeTab) {
        case 'holdings':
          const holdingsRes = await api.get('/api/broker/holdings')
          setHoldings(holdingsRes.data.holdings || [])
          break
        case 'orders':
          const ordersRes = await api.get('/api/broker/orders')
          setOrders(ordersRes.data.orders || [])
          break
        case 'trades':
          const tradesRes = await api.get('/api/broker/trades')
          setTrades(tradesRes.data.trades || [])
          break
        case 'mf':
          const [mfHoldingsRes, mfOrdersRes, mfSipsRes] = await Promise.all([
            api.get('/api/broker/mf/holdings'),
            api.get('/api/broker/mf/orders'),
            api.get('/api/broker/mf/sips')
          ])
          setMfHoldings(mfHoldingsRes.data.holdings || [])
          setMfOrders(mfOrdersRes.data.orders || [])
          setMfSips(mfSipsRes.data.sips || [])
          break
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${activeTab} data:`, error)
    } finally {
      setLoadingData(false)
    }
  }

  const formatCurrency = (value: number): string => {
    return `₹ ${value.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-IN')
  }

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading user details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="users-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchUserDetails} className="retry-btn">Retry</button>
        </div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="users-page">
        <div className="error-container">
          <h2>No User Details</h2>
          <p>User details not available. Please connect your Kite account first.</p>
        </div>
      </div>
    )
  }

  const margins = userDetails.meta?.margins || {}
  const equity = margins.equity || {}
  const commodity = margins.commodity || {}

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>User Details</h1>
        <button onClick={fetchUserDetails} className="refresh-btn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M17 10C17 13.866 13.866 17 10 17M17 10C17 6.13401 13.866 3 10 3M17 10H3M3 10C3 6.13401 6.13401 3 10 3M3 10C3 13.866 6.13401 17 10 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-btn ${activeTab === 'holdings' ? 'active' : ''}`}
          onClick={() => setActiveTab('holdings')}
        >
          Holdings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button 
          className={`tab-btn ${activeTab === 'trades' ? 'active' : ''}`}
          onClick={() => setActiveTab('trades')}
        >
          Trades
        </button>
        <button 
          className={`tab-btn ${activeTab === 'mf' ? 'active' : ''}`}
          onClick={() => setActiveTab('mf')}
        >
          Mutual Funds
        </button>
      </div>

      <div className="users-content">
        {activeTab === 'profile' && (
          <>
        {/* Profile Section */}
        <div className="user-section">
          <h2 className="section-title">Profile Information</h2>
          <div className="user-profile-card">
            {userDetails.avatar_url && (
              <div className="avatar-container">
                <img src={userDetails.avatar_url} alt="User Avatar" className="user-avatar" />
              </div>
            )}
            <div className="profile-grid">
              <div className="profile-item">
                <label>User ID</label>
                <span>{userDetails.user_id}</span>
              </div>
              <div className="profile-item">
                <label>User Name</label>
                <span>{userDetails.user_name}</span>
              </div>
              <div className="profile-item">
                <label>Short Name</label>
                <span>{userDetails.user_shortname}</span>
              </div>
              <div className="profile-item">
                <label>Email</label>
                <span>{userDetails.email}</span>
              </div>
              <div className="profile-item">
                <label>User Type</label>
                <span>{userDetails.user_type}</span>
              </div>
              <div className="profile-item">
                <label>Broker</label>
                <span>{userDetails.broker}</span>
              </div>
              {userDetails.login_time && (
                <div className="profile-item">
                  <label>Login Time</label>
                  <span>{new Date(userDetails.login_time).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="user-section">
          <h2 className="section-title">Account Details</h2>
          <div className="account-grid">
            <div className="account-card">
              <h3>Equity Margins</h3>
              <div className="margin-details">
                <div className="margin-item">
                  <label>Available</label>
                  <span className="value-positive">
                    {equity.available ? formatCurrency(equity.available.net || equity.available.cash || 0) : 'N/A'}
                  </span>
                </div>
                <div className="margin-item">
                  <label>Utilised</label>
                  <span className="value-negative">
                    {equity.utilised ? formatCurrency(equity.utilised.debits || 0) : 'N/A'}
                  </span>
                </div>
                <div className="margin-item">
                  <label>Net</label>
                  <span className="value-positive">
                    {equity.net ? formatCurrency(equity.net) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="account-card">
              <h3>Commodity Margins</h3>
              <div className="margin-details">
                <div className="margin-item">
                  <label>Available</label>
                  <span className="value-positive">
                    {commodity.available ? formatCurrency(commodity.available.net || commodity.available.cash || 0) : 'N/A'}
                  </span>
                </div>
                <div className="margin-item">
                  <label>Utilised</label>
                  <span className="value-negative">
                    {commodity.utilised ? formatCurrency(commodity.utilised.debits || 0) : 'N/A'}
                  </span>
                </div>
                <div className="margin-item">
                  <label>Net</label>
                  <span className="value-positive">
                    {commodity.net ? formatCurrency(commodity.net) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Capabilities Section */}
        <div className="user-section">
          <h2 className="section-title">Trading Capabilities</h2>
          <div className="capabilities-grid">
            <div className="capability-card">
              <h3>Exchanges</h3>
              <div className="tags-container">
                {userDetails.exchanges.map((exchange, index) => (
                  <span key={index} className="tag">{exchange}</span>
                ))}
              </div>
            </div>
            <div className="capability-card">
              <h3>Products</h3>
              <div className="tags-container">
                {userDetails.products.map((product, index) => (
                  <span key={index} className="tag">{product}</span>
                ))}
              </div>
            </div>
            <div className="capability-card">
              <h3>Order Types</h3>
              <div className="tags-container">
                {userDetails.order_types.map((orderType, index) => (
                  <span key={index} className="tag">{orderType}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* API Information Section (Collapsible) */}
        <div className="user-section">
          <details className="api-details">
            <summary className="section-title">API Information (Click to expand)</summary>
            <div className="api-info">
              <div className="api-item">
                <label>API Key</label>
                <span className="api-value">{userDetails.api_key || 'N/A'}</span>
              </div>
              <div className="api-item">
                <label>Access Token</label>
                <span className="api-value">{userDetails.access_token ? `${userDetails.access_token.substring(0, 20)}...` : 'N/A'}</span>
              </div>
              {userDetails.public_token && (
                <div className="api-item">
                  <label>Public Token</label>
                  <span className="api-value">{userDetails.public_token}</span>
                </div>
              )}
              {userDetails.enctoken && (
                <div className="api-item">
                  <label>Encrypted Token</label>
                  <span className="api-value">{userDetails.enctoken.substring(0, 30)}...</span>
                </div>
              )}
            </div>
          </details>
        </div>
        </>
        )}

        {activeTab === 'holdings' && (
          <div className="user-section">
            <h2 className="section-title">Equity Holdings</h2>
            {loadingData ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading holdings...</p>
              </div>
            ) : holdings.length === 0 ? (
              <p>No holdings found.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trading Symbol</th>
                      <th>Exchange</th>
                      <th>Quantity</th>
                      <th>Average Price</th>
                      <th>Last Price</th>
                      <th>P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding, index) => (
                      <tr key={index}>
                        <td>{holding.tradingsymbol}</td>
                        <td>{holding.exchange}</td>
                        <td>{holding.quantity}</td>
                        <td>{formatCurrency(holding.average_price || 0)}</td>
                        <td>{formatCurrency(holding.last_price || 0)}</td>
                        <td className={holding.pnl >= 0 ? 'value-positive' : 'value-negative'}>
                          {formatCurrency(holding.pnl || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="user-section">
            <h2 className="section-title">All Orders</h2>
            {loadingData ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr key={index}>
                        <td>{order.order_id}</td>
                        <td>{order.tradingsymbol}</td>
                        <td>{order.transaction_type}</td>
                        <td>{order.quantity}</td>
                        <td>{order.price ? formatCurrency(order.price) : 'Market'}</td>
                        <td>{order.status}</td>
                        <td>{order.order_timestamp ? formatDate(order.order_timestamp) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="user-section">
            <h2 className="section-title">All Trades</h2>
            {loadingData ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading trades...</p>
              </div>
            ) : trades.length === 0 ? (
              <p>No trades found.</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trade ID</th>
                      <th>Order ID</th>
                      <th>Symbol</th>
                      <th>Type</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((trade, index) => (
                      <tr key={index}>
                        <td>{trade.trade_id}</td>
                        <td>{trade.order_id}</td>
                        <td>{trade.tradingsymbol}</td>
                        <td>{trade.transaction_type}</td>
                        <td>{trade.quantity}</td>
                        <td>{formatCurrency(trade.price || 0)}</td>
                        <td>{trade.fill_timestamp ? formatDate(trade.fill_timestamp) : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mf' && (
          <>
            <div className="user-section">
              <h2 className="section-title">Mutual Fund Holdings</h2>
              {loadingData ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading MF holdings...</p>
                </div>
              ) : mfHoldings.length === 0 ? (
                <p>No mutual fund holdings found.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Fund Name</th>
                        <th>Folio</th>
                        <th>Quantity</th>
                        <th>Average Price</th>
                        <th>Last Price</th>
                        <th>P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mfHoldings.map((holding, index) => (
                        <tr key={index}>
                          <td>{holding.fund || holding.tradingsymbol}</td>
                          <td>{holding.folio || 'N/A'}</td>
                          <td>{holding.quantity}</td>
                          <td>{formatCurrency(holding.average_price || 0)}</td>
                          <td>{formatCurrency(holding.last_price || 0)}</td>
                          <td className={holding.pnl >= 0 ? 'value-positive' : 'value-negative'}>
                            {formatCurrency(holding.pnl || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="user-section">
              <h2 className="section-title">Mutual Fund Orders</h2>
              {loadingData ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading MF orders...</p>
                </div>
              ) : mfOrders.length === 0 ? (
                <p>No mutual fund orders found.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Fund</th>
                        <th>Type</th>
                        <th>Amount/Quantity</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mfOrders.map((order, index) => (
                        <tr key={index}>
                          <td>{order.order_id}</td>
                          <td>{order.tradingsymbol}</td>
                          <td>{order.transaction_type}</td>
                          <td>{order.quantity || formatCurrency(order.amount || 0)}</td>
                          <td>{order.status}</td>
                          <td>{order.order_timestamp ? formatDate(order.order_timestamp) : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="user-section">
              <h2 className="section-title">Mutual Fund SIPs</h2>
              {loadingData ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading SIPs...</p>
                </div>
              ) : mfSips.length === 0 ? (
                <p>No SIPs found.</p>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>SIP ID</th>
                        <th>Fund</th>
                        <th>Amount</th>
                        <th>Frequency</th>
                        <th>Instalments</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mfSips.map((sip, index) => (
                        <tr key={index}>
                          <td>{sip.sip_id}</td>
                          <td>{sip.tradingsymbol}</td>
                          <td>{formatCurrency(sip.amount || 0)}</td>
                          <td>{sip.frequency}</td>
                          <td>{sip.instalments || 'N/A'}</td>
                          <td>{sip.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UsersPage

