import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CandidateDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>Welcome, {user?.name}</h2>
      <p>Role: Candidate</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/candidate/profile')}>My Profile</button>
        <button onClick={() => navigate('/candidate/jobs')}>View Recommended Jobs</button>
        <button onClick={() => navigate('/candidate/analytics')}>My Analytics</button>
        <button onClick={() => { logout(); navigate('/login') }}>Log Out</button>
      </div>
    </div>
  )
}
