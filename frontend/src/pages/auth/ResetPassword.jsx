import { useState } from 'react'
import { authApi } from '../../api/authApi'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleRequest = async e => {
    e.preventDefault()
    setError('')
    try {
      await authApi.requestReset(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset link.')
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h2>Reset Password</h2>
      {sent ? (
        <p>Password reset link sent to your email.</p>
      ) : (
        <form onSubmit={handleRequest}>
          <input type="email" placeholder="Enter your email" value={email} required
            onChange={e => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8 }}
          />
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit" style={{ width: '100%', padding: 10 }}>Send Reset Link</button>
        </form>
      )}
    </div>
  )
}
