import api from './axios'

export const adminApi = {
  getUsers:       (params)           => api.get('/admin/users', { params }),
  getUserDetail:  (userId)           => api.get(`/admin/users/${userId}`),
  updateStatus:   (userId, action)   => api.put(`/admin/users/${userId}/status`, { action }),
  getReport:      (params)           => api.get('/admin/reports', { params }),
  exportReport:   (params)           => api.get('/admin/reports/export', { params, responseType: 'blob' }),
  getAuditLogs:      ()              => api.get('/admin/audit-logs'),
  deleteAuditLog:    (id)           => api.delete(`/admin/audit-logs/${id}`),
  deleteUser:        (userId)       => api.delete(`/admin/users/${userId}`),
  getReportHistory:  ()             => api.get('/admin/reports/history'),
  getAnalytics:      ()             => api.get('/admin/analytics'),
  getUserInterviews: (userId)       => api.get(`/admin/users/${userId}/interviews`),
  getUserReviews:    (userId)       => api.get(`/admin/users/${userId}/reviews`),
  getUserActivity:   (userId)       => api.get(`/admin/users/${userId}/activity`),
}
