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

interface ProfileResponse {
  success: boolean
  data: KiteProfile
}

const ProfilePage = () => {
  const [profile, setProfile] = useState<KiteProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const requestToken = searchParams.get('request_token')
    fetchProfile(requestToken || undefined)
    // Clean up URL if request_token was present
    if (requestToken) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [searchParams])

  const fetchProfile = async (requestToken?: string) => {
    try {
      setLoading(true)
      setError(null)
      const params = requestToken ? { request_token: requestToken } : {}
      const response = await api.get<ProfileResponse>('/api/broker/profile', { params })
      if (response.data.success) {
        setProfile(response.data.data)
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
            {isTokenError && (
              <div className="token-help">
                <p><strong>Note:</strong> No valid access token found. You need to authenticate with Kite first.</p>
                <p>To fix this:</p>
                <ol>
                  <li>Go to <a href="/broker/connect" style={{color: '#3498db'}}>Broker Connect</a> page</li>
                  <li>Click "Connect with Kite" button</li>
                  <li>Login with your Zerodha credentials</li>
                  <li>After successful login, the access token will be stored automatically</li>
                  <li>You can then access your profile without logging in again (token valid for the day)</li>
                </ol>
                <p style={{marginTop: '1rem', fontSize: '0.9rem', color: '#666'}}>
                  <strong>Alternative:</strong> If you have a request token, you can also update KITE_REQUEST_TOKEN in .env file and restart the server.
                </p>
              </div>
            )}
            <button onClick={() => fetchProfile()} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="no-data">No profile data available</div>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Kite Profile</h1>
          <button onClick={() => fetchProfile()} className="refresh-btn">
            Refresh
          </button>
        </div>

        <div className="profile-card">
         

          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{profile.user_id}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">User Name:</span>
              <span className="detail-value">{profile.user_name}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Short Name:</span>
              <span className="detail-value">{profile.user_shortname}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{profile.email}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">User Type:</span>
              <span className="detail-value">{profile.user_type}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Broker:</span>
              <span className="detail-value">{profile.broker}</span>
            </div>

            {/*  */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage

