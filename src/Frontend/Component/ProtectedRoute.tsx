import { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Allow access without authentication for now
  return <>{children}</>
}

export default ProtectedRoute

