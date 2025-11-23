import { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Algo Trading</h1>
          <nav className="nav">
            <Link to="/" className="nav-link">Dashboard</Link>
            <Link to="/orders" className="nav-link">Orders</Link>
            <Link to="/portfolio" className="nav-link">Portfolio</Link>
            <Link to="/strategies" className="nav-link">Strategies</Link>
            <Link to="/broker/connect" className="nav-link">Broker</Link>
          </nav>
          <div className="user-section">
            <span className="username">{user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  )
}

export default Layout

