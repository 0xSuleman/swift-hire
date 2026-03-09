import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthLayout from '../../components/common/AuthLayout'
import { Mail, ArrowLeft, Loader2, AlertCircle, MailCheck } from 'lucide-react'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.requestReset(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      headingTeal="Account Recovery"
      headingWhite="Reset Your Password"
      tagline="We'll send a secure link to your inbox."
    >
      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0', textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(46,229,176,0.1)',
            border: '1px solid rgba(46,229,176,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 24px rgba(46,229,176,0.15)',
          }}>
            <MailCheck size={26} style={{ color: '#2EE5B0' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 500, color: '#E8EAF0', marginBottom: 6 }}>
              Reset link sent to{' '}
              <span style={{ color: '#2EE5B0' }}>{email}</span>
            </p>
            <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.6 }}>
              Follow the link in your email to set a new password.<br />
              Check your spam folder if you don&apos;t see it.
            </p>
          </div>
          <Link to="/login" style={{ marginTop: 8 }}>
            <button className="btn-ghost">
              <ArrowLeft size={14} />
              Back to Sign In
            </button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleRequest} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#9CA3AF', marginBottom: '8px', letterSpacing: '0.03em' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#4B5563' }} />
              <input
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <button type="submit" className="btn-teal" disabled={loading}>
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...
                </span>
              : 'Send Reset Link'
            }
          </button>

          <Link to="/login">
            <button type="button" className="btn-ghost">
              <ArrowLeft size={14} />
              Back to Sign In
            </button>
          </Link>
        </form>
      )}
    </AuthLayout>
  )
}
