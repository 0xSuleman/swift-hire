import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ allowedRoles }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to correct dashboard based on actual role
    const dashboards = { CANDIDATE: '/candidate', EMPLOYER: '/employer', ADMIN: '/admin' }
    return <Navigate to={dashboards[user.role] || '/login'} replace />
  }

  return <Outlet />
}
