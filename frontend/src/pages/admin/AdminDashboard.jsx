import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>Admin Dashboard</h2>
      <p>Logged in as: {user?.name}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/admin/users')}>Manage Users</button>
        <button onClick={() => navigate('/admin/reports')}>System Reports</button>
        <button onClick={() => { logout(); navigate('/login') }}>Log Out</button>
      </div>
    </div>
  )
}
