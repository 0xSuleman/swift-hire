import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function EmployerDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>Welcome, {user?.name}</h2>
      <p>Role: Employer / Recruiter</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/employer/prompt')}>New Hiring Prompt</button>
        <button onClick={() => navigate('/employer/profile')}>Company Profile</button>
        <button onClick={() => navigate('/employer/analytics')}>Analytics</button>
        <button onClick={() => { logout(); navigate('/login') }}>Log Out</button>
      </div>
    </div>
  )
}
