import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/common/AuthLayout'
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
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
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headingTeal="Welcome Back"
      headingWhite="Sign In to Swift Hire"
      tagline="Your next great hire — or role — is one click away."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        {/* Email */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.03em' }}>
            Email
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4B5563' }} />
            <input
              className="auth-input"
              type="email"
              placeholder="Enter your email here"
              value={form.email}
              required
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', letterSpacing: '0.03em' }}>
              Password
            </label>
            <Link
              to="/reset-password"
              style={{ fontSize: '0.78rem', color: '#2EE5B0', textDecoration: 'none', transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.target.style.opacity = '0.75'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Forgot Password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4B5563' }} />
            <input
              className="auth-input has-right"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••"
              value={form.password}
              required
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
              onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button type="submit" className="btn-teal" disabled={loading} style={{ marginTop: '4px' }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...
              </span>
            : 'Sign In Now'
          }
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#6B7280' }}>
        Don&apos;t have an account?{' '}
        <Link to="/signup" style={{ color: '#2EE5B0', fontWeight: 500, textDecoration: 'none' }}>
          Sign Up
        </Link>
      </p>
    </AuthLayout>
  )
}
