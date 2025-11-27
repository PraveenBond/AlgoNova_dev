import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import './ProfilePage.css'

interface KiteProfile {
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
}

interface KiteProfileResponse {
  success: boolean
  data: KiteProfile
}

interface FyersProfile {
  client_id: string
  display_name: string
  email: string
  mobile?: string
  pan?: string
  poa?: string
  name?: string
}

interface FyersProfileResponse {
  success: boolean
  data: any
}

type BrokerMode = 'fyers' | 'kite' | 'none'

const normalizeFyersProfile = (raw: any): FyersProfile => {
  const data = raw?.data || raw || {}
  const clientId =
    data.client_id ||
    data.fy_id ||
    data.id ||
    data.uuid ||
    data.client_code ||
    'Unknown'

  const resolvedEmail =
    data.email ||
    data.email_id ||
    `${clientId.toString().toLowerCase()}@fyers.local`

  const resolvedMobile = data.mobile_number || data.mobile || data.phone || 'Not shared'
  const resolvedPan = data.PAN || data.pan || data.pan_number || 'Not shared'
  const accountType =
    data.account_type ||
    (data.ddpi_enabled ? 'DDPI Enabled' : undefined) ||
    data.poa_status ||
    'N/A'

  return {
    client_id: clientId,
    display_name: data.display_name || data.name || data.client_name || 'Fyers User',
    email: resolvedEmail,
    mobile: resolvedMobile,
    pan: resolvedPan,
    poa: accountType,
    name: data.name || data.display_name || data.client_name || 'Fyers User',
  }
}

const ProfilePage = () => {
  const [kiteProfile, setKiteProfile] = useState<KiteProfile | null>(null)
  const [fyersProfile, setFyersProfile] = useState<FyersProfile | null>(null)
  const [activeBroker, setActiveBroker] = useState<BrokerMode>('none')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFyersLoggedIn, setIsFyersLoggedIn] = useState(false)
  const [isKiteLoggedIn, setIsKiteLoggedIn] = useState(false)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const requestToken = searchParams.get('request_token')
    const fyersSessionStr = localStorage.getItem('fyers_session')
    const kiteSessionStr = localStorage.getItem('kite_session')

    let fyersAuth = false
    let kiteAuth = false

    if (fyersSessionStr) {
      try {
        const fyersSession = JSON.parse(fyersSessionStr)
        if (fyersSession.fyers_authenticated) {
          fyersAuth = true
          setFyersProfile(normalizeFyersProfile(fyersSession.profile))
        }
      } catch (e) {
        console.warn('Invalid Fyers session cache', e)
      }
    }

    if (kiteSessionStr) {
      kiteAuth = true
    }

    setIsFyersLoggedIn(fyersAuth)
    setIsKiteLoggedIn(kiteAuth)

    // Determine which broker to show initially
    if (fyersAuth && !kiteAuth) {
      setActiveBroker('fyers')
      fetchFyersProfile(false)
    } else if (kiteAuth && !fyersAuth) {
      setActiveBroker('kite')
      fetchKiteProfile(requestToken || undefined)
    } else if (fyersAuth && kiteAuth) {
      // If both are logged in, default to Fyers or keep current if set
      setActiveBroker((prev) => (prev === 'none' ? 'fyers' : prev))
      fetchFyersProfile(false)
      fetchKiteProfile(undefined)
    } else {
      // Neither logged in, but maybe trying to login to Kite via callback
      if (requestToken) {
        setActiveBroker('kite')
        fetchKiteProfile(requestToken)
      } else {
        setLoading(false)
      }
    }

    if (requestToken) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  const fetchKiteProfile = async (requestToken?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params = requestToken ? { request_token: requestToken } : {}
      const response = await api.get<KiteProfileResponse>('/api/broker/profile', { params })
      if (response.data.success) {
        setKiteProfile(response.data.data)
        setIsKiteLoggedIn(true)
        setActiveBroker((prev) => {
          if (prev === 'fyers') return prev;
          return 'kite';
        })
      } else {
        setError('Failed to fetch profile')
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err)
      setError(err.response?.data?.detail || 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchFyersProfile = async (refresh: boolean) => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get<FyersProfileResponse>('/api/fyers/profile', {
        params: { refresh },
      })
      if (response.data.success) {
        setFyersProfile(normalizeFyersProfile(response.data.data))
        setIsFyersLoggedIn(true)
        setActiveBroker((prev) => (prev === 'none' ? 'fyers' : prev))
      }
    } catch (err: any) {
      console.error('Failed to fetch Fyers profile:', err)
      setError(err.response?.data?.detail || 'Failed to fetch Fyers profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="loading-spinner">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error) {
    const isTokenError = error.toLowerCase().includes('token') || error.toLowerCase().includes('expired')
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error-message">
            <h2>Error Fetching Profile</h2>
            <p>{error}</p>
            {isTokenError && activeBroker === 'kite' && (
              <div className="token-help">
                <p><strong>Note:</strong> No valid access token found. You need to authenticate with Kite first.</p>
                <p>To fix this:</p>
                <ol>
                  <li>Go to <a href="/broker/connect" style={{ color: '#3498db' }}>Broker Connect</a> page</li>
                  <li>Click "Connect with Kite" button</li>
                  <li>Login with your Zerodha credentials</li>
                  <li>After successful login, the access token will be stored automatically</li>
                  <li>You can then access your profile without logging in again (token valid for the day)</li>
                </ol>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                  <strong>Alternative:</strong> If you have a request token, you can also update KITE_REQUEST_TOKEN in .env file and restart the server.
                </p>
              </div>
            )}
            <div className="error-actions">
              {activeBroker === 'fyers' ? (
                <button onClick={() => fetchFyersProfile(true)} className="retry-btn">
                  Retry Fyers
                </button>
              ) : (
                <button onClick={() => fetchKiteProfile()} className="retry-btn">
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderKiteCard = () => {
    if (!kiteProfile) {
      return (
        <div className="no-data">
          No Profile cached. Connect via the Broker page to pull your Zerodha details.
        </div>
      )
    }
    return (
      <div className="profile-card">
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">User ID:</span>
            <span className="detail-value">{kiteProfile.user_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">User Name:</span>
            <span className="detail-value">{kiteProfile.user_name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Short Name:</span>
            <span className="detail-value">{kiteProfile.user_shortname}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{kiteProfile.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">User Type:</span>
            <span className="detail-value">{kiteProfile.user_type}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Broker:</span>
            <span className="detail-value">{kiteProfile.broker}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderFyersCard = () => {
    if (!fyersProfile) {
      return (
        <div className="no-data">
          No Fyers profile cached. Please connect your Fyers account from the Login page.
        </div>
      )
    }
    return (
      <div className="profile-card">
        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Client ID:</span>
            <span className="detail-value">{fyersProfile.client_id}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Name:</span>
            <span className="detail-value">{fyersProfile.display_name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span className="detail-value">{fyersProfile.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Mobile:</span>
            <span className="detail-value">{fyersProfile.mobile}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">PAN:</span>
            <span className="detail-value">{fyersProfile.pan}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Account Type:</span>
            <span className="detail-value">{fyersProfile.poa}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderActiveCard = () => {
    if (activeBroker === 'fyers') {
      return renderFyersCard()
    }
    if (activeBroker === 'kite') {
      return renderKiteCard()
    }
    return (
      <div className="no-data">
        No broker connected yet. Please connect using the Login/Broker page.
      </div>
    )
  }

  const handleRefresh = () => {
    if (activeBroker === 'fyers') {
      fetchFyersProfile(true)
    } else {
      fetchKiteProfile()
    }
  }

  const getTitle = () => {
    if (activeBroker === 'fyers') return 'Fyers Profile'
    if (activeBroker === 'kite') return 'Zerodha Profile'
    return 'Profile'
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>{getTitle()}</h1>
          <div className="profile-actions">
            {isFyersLoggedIn && isKiteLoggedIn && (
              <div className="broker-toggle">
                <button
                  className={activeBroker === 'fyers' ? 'active' : ''}
                  onClick={() => {
                    setActiveBroker('fyers')
                    if (!fyersProfile) {
                      fetchFyersProfile(false)
                    }
                  }}
                >
                  FYERS
                </button>
                <button
                  className={activeBroker === 'kite' ? 'active' : ''}
                  onClick={() => {
                    setActiveBroker('kite')
                    if (!kiteProfile) {
                      fetchKiteProfile()
                    }
                  }}
                >
                  ZERODHA
                </button>
              </div>
            )}
            <button onClick={handleRefresh} className="refresh-btn">
              Refresh
            </button>
          </div>
        </div>
        {renderActiveCard()}
      </div>
    </div>
  )
}

export default ProfilePage

