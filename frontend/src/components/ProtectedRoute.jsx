import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth.jsx'

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
