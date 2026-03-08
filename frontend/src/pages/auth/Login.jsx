import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { token, ...userData } = res.data.data
      login(userData, token)
      const dashboards = { CANDIDATE: '/candidate', EMPLOYER: '/employer', ADMIN: '/admin' }
      navigate(dashboards[userData.role])
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>Swift Hire</h1>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email" placeholder="Email" value={form.email} required
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
        />
        <input
          type="password" placeholder="Password" value={form.password} required
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
      <p><Link to="/reset-password">Forgot password?</Link></p>
    </div>
  )
}
