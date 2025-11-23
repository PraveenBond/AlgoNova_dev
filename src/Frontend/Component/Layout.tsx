import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
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
          <Link to="/users" className={`sidebar-link ${isActive('/users') ? 'active' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M3 18C3 14 6 11 10 11C14 11 17 14 17 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>Users</span>
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
              <div className="user-profile">
                <div className="profile-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="profile-name">{user?.username || 'User'}</span>
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
