import { ReactNode, useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import api from '../services/api'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

interface KiteProfile {
  user_id: string
  user_name: string
  user_shortname: string
  email: string
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [kiteProfile, setKiteProfile] = useState<KiteProfile | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchKiteProfile()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchKiteProfile = async () => {
    try {
      const response = await api.get('/api/broker/profile')
      if (response.data.success) {
        setKiteProfile(response.data.data)
      }
    } catch (error) {
      // Silently fail - user might not be connected to Kite
      console.log('Kite profile not available')
    }
  }

  const handleLogout = () => {
    logout()
    // Clear Kite token if exists
    try {
      // Clear any stored Kite tokens
      localStorage.removeItem('kite_token')
    } catch (e) {
      // Ignore errors
    }
    navigate('/login')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src="/logo/AlgoNova-Photoroom.png" 
              alt="AlgoNova" 
              className="sidebar-logo-img"
            />
            <span className="logo-text"></span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 3H7V7H3V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 3H17V7H13V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 13H7V17H3V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13 13H17V17H13V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Dashboard</span>
          </Link>
          <Link to="/market" className={`sidebar-link ${isActive('/market') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 15L10 5L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Market</span>
          </Link>
          <Link to="/orders" className={`sidebar-link ${isActive('/orders') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 4H16V16H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Orders</span>
          </Link>
          <Link to="/strategies" className={`sidebar-link ${isActive('/strategies') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M10 1V3M10 17V19M19 10H17M3 10H1M16.66 3.34L15.24 4.76M4.76 15.24L3.34 16.66M16.66 16.66L15.24 15.24M4.76 4.76L3.34 3.34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Strategies</span>
          </Link>
          <Link to="/portfolio" className={`sidebar-link ${isActive('/portfolio') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 5H17V17H3V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 5V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Positions</span>
          </Link>
          
          <Link to="/profile" className={`sidebar-link ${isActive('/profile') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 18C5 14 7 12 10 12C13 12 15 14 15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Kite Profile</span>
          </Link>
        </nav>
      </aside>
      <div className="main-wrapper">
        <header className="header">
          <div className="header-top">
            <div className="header-center">
              <span className="greeting">{getGreeting()}, {user?.username || 'User'}! 👋</span>
            </div>
            <div className="header-right">
              <button className="header-icon-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C6 2 3 5 3 9C3 13 6 16 10 16C14 16 17 13 17 9C17 5 14 2 10 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 6V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M10 14H10.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <div className="user-profile-container" ref={dropdownRef}>
                <div 
                  className="user-profile" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="profile-avatar">
                    {kiteProfile?.user_shortname?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="profile-name">
                    {kiteProfile?.user_name || user?.username || 'User'}
                  </span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none"
                    style={{ 
                      marginLeft: '0.5rem',
                      transition: 'transform 0.3s',
                      transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {showDropdown && (
                  <div className="user-dropdown">
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {kiteProfile?.user_shortname?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="dropdown-user-info">
                        <div className="dropdown-name">
                          {kiteProfile?.user_name || user?.username || 'User'}
                        </div>
                        {kiteProfile?.user_id && (
                          <div className="dropdown-id">
                            ID: {kiteProfile.user_id}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="dropdown-divider"></div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M3 14C3 10 5 8 8 8C11 8 13 10 13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span>Kite Profile</span>
                    </Link>
                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M10 12L14 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  )
}

export default Layout
