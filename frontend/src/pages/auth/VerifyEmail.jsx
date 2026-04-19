import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthLayout from '../../components/common/AuthLayout'
import { Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Invalid verification link.')
      return
    }
    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.')
      })
  }, [])

  return (
    <AuthLayout
      headingTeal="Email Verification"
      headingWhite="Activating Your Account"
      tagline="Just a moment while we verify your email."
    >
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
        {status === 'verifying' && (
          <>
            <Loader2 size={40} style={{ margin: '0 auto', color: '#2EE5B0', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Verifying your email address...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <p style={{ color: '#D1D5DB', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Your email has been verified. Your account is now active!
            </p>
            <button className="btn-teal" style={{ marginTop: '8px' }} onClick={() => navigate('/login')}>
              Sign In Now
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem' }}>❌</div>
            <p style={{ color: '#F87171', fontSize: '0.9rem', lineHeight: 1.6 }}>{message}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <input
                type="email"
                className="auth-input"
                placeholder="Enter your email to resend"
                value={resendEmail}
                onChange={e => setResendEmail(e.target.value)}
              />
              <button
                className="btn-teal"
                disabled={resendLoading || !resendEmail}
                onClick={async () => {
                  setResendLoading(true)
                  setResendMsg('')
                  try {
                    await authApi.resendVerification(resendEmail)
                    setResendMsg('Verification email resent! Check your inbox.')
                  } catch {
                    setResendMsg('Failed to resend. Check the email and try again.')
                  } finally {
                    setResendLoading(false)
                  }
                }}
              >
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </button>
              {resendMsg && <p style={{ color: '#2EE5B0', fontSize: '0.8rem', margin: 0 }}>{resendMsg}</p>}
            </div>
            <button className="btn-ghost" style={{ marginTop: '4px' }} onClick={() => navigate('/signup')}>
              Sign Up Again
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
