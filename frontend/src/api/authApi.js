import api from './axios'

export const authApi = {
  signup: (data)               => api.post('/auth/signup', data),
  login:  (data)               => api.post('/auth/login', data),
  logout: ()                   => api.post('/auth/logout'),
  requestReset: (email)        => api.post(`/auth/reset-password-request?email=${encodeURIComponent(email)}`),
  resetPassword: (token, pwd)  => api.post(`/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(pwd)}`),
  verifyEmail: (token)         => api.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email)  => api.post(`/auth/resend-verification?email=${encodeURIComponent(email)}`),
}
