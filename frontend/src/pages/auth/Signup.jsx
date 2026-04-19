import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthLayout from '../../components/common/AuthLayout'
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, AlertCircle, UserRound, Building2 } from 'lucide-react'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', phoneNo: '', role: 'CANDIDATE' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.signup(form)
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputRow = (label, key, type, placeholder, Icon, extra = {}) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.03em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Icon style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4B5563' }} />
        <input
          className={`auth-input${extra.hasRight ? ' has-right' : ''}`}
          type={type}
          placeholder={placeholder}
          value={form[key]}
          required={extra.required !== false}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
        {extra.rightEl}
      </div>
    </div>
  )

  if (success) {
    return (
      <AuthLayout
        headingTeal="Check Your Email"
        headingWhite="Verify Your Account"
        tagline="One last step before you get started."
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
          <div style={{ fontSize: '3rem' }}>📧</div>
          <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.6 }}>
            We've sent a verification link to <strong style={{ color: '#2EE5B0' }}>{form.email}</strong>.
          </p>
          <p style={{ color: '#6B7280', fontSize: '0.82rem' }}>
            Please check your inbox and click the link to activate your account. The link expires in 24 hours.
          </p>
          <button className="btn-teal" style={{ marginTop: '8px' }} onClick={() => navigate('/login')}>
            Go to Sign In
          </button>
          <button
            style={{ background: 'none', border: 'none', color: resendMsg ? '#2EE5B0' : '#6B7280', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            disabled={resendLoading}
            onClick={async () => {
              setResendLoading(true)
              setResendMsg('')
              try {
                await authApi.resendVerification(form.email)
                setResendMsg('Email resent! Check your inbox.')
              } catch {
                setResendMsg('Failed to resend. Try again.')
              } finally {
                setResendLoading(false)
              }
            }}
          >
            {resendLoading ? 'Sending...' : "Didn't receive it? Resend email"}
          </button>
          {resendMsg && <p style={{ color: '#2EE5B0', fontSize: '0.8rem', margin: 0 }}>{resendMsg}</p>}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      headingTeal="Join the Platform"
      headingWhite="Create Your Account"
      tagline="Swift Hire connects top talent with great companies."
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Role selector */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.03em' }}>
            I am joining as
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[
              { value: 'CANDIDATE', label: 'Job Seeker', Icon: UserRound, desc: 'Find your next role' },
              { value: 'EMPLOYER', label: 'Employer', Icon: Building2, desc: 'Hire top talent' },
            ].map(({ value, label, Icon, desc }) => (
              <button
                key={value}
                type="button"
                className={`role-card${form.role === value ? ' active' : ''}`}
                onClick={() => setForm(f => ({ ...f, role: value }))}
              >
                <Icon size={16} style={{ color: form.role === value ? '#2EE5B0' : '#4B5563', marginBottom: 6, transition: 'color 0.2s' }} />
                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: form.role === value ? '#2EE5B0' : '#D1D5DB', transition: 'color 0.2s' }}>
                  {label}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#4B5563', marginTop: 2 }}>{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {inputRow('Full Name', 'name', 'text', 'John Doe', User)}
        {inputRow('Email', 'email', 'email', 'you@example.com', Mail)}

        {/* Password with toggle */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.03em' }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4B5563' }} />
            <input
              className="auth-input has-right"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 chars, A-Z, a-z, 0-9, special char"
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

        {inputRow('Phone', 'phoneNo', 'tel', '+92 300 0000000', Phone, { required: false })}

        {error && (
          <div className="error-banner">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <button type="submit" className="btn-teal" disabled={loading} style={{ marginTop: '4px' }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...
              </span>
            : 'Create Account'
          }
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#6B7280' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: '#2EE5B0', fontWeight: 500, textDecoration: 'none' }}>
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
