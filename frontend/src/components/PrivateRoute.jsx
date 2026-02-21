import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function PrivateRoute() {
  const { user, loading } = useAuth()

  // Wait until we've checked localStorage before deciding
  if (loading) return null

  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export default PrivateRoute
