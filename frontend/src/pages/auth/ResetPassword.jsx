import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/authApi'
import AuthLayout from '../../components/common/AuthLayout'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Loader2, AlertCircle, MailCheck, ArrowLeft } from 'lucide-react'

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
    <AuthLayout>
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-gray-900">Reset password</CardTitle>
          <CardDescription>
            {sent
              ? 'Check your inbox for next steps'
              : 'Enter your email and we\'ll send you a reset link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <MailCheck className="h-7 w-7 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Email sent to <span className="text-blue-600">{email}</span></p>
                <p className="text-sm text-gray-500">Follow the link in the email to reset your password. Check your spam folder if you don&apos;t see it.</p>
              </div>
              <Link to="/login">
                <Button variant="outline" className="mt-2 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  required
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link to="/login">
                <Button variant="ghost" className="w-full gap-2 mt-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
