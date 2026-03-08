import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNo: '', role: 'CANDIDATE' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.signup(form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
      <h1>Swift Hire</h1>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        {[
          { key: 'name', type: 'text', label: 'Full Name' },
          { key: 'email', type: 'email', label: 'Email' },
          { key: 'password', type: 'password', label: 'Password (min 8 chars)' },
          { key: 'phoneNo', type: 'tel', label: 'Phone (optional)' },
        ].map(({ key, type, label }) => (
          <input key={key} type={type} placeholder={label}
            value={form[key]} required={key !== 'phoneNo'}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
          />
        ))}
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}>
          <option value="CANDIDATE">Candidate (Job Seeker)</option>
          <option value="EMPLOYER">Employer (Recruiter)</option>
        </select>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}
