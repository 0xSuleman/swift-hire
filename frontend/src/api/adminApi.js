import api from './axios'

export const adminApi = {
  getUsers:       (params)           => api.get('/admin/users', { params }),
  getUserDetail:  (userId)           => api.get(`/admin/users/${userId}`),
  updateStatus:   (userId, action)   => api.put(`/admin/users/${userId}/status`, { action }),
  getReport:      (params)           => api.get('/admin/reports', { params }),
  exportReport:   (params)           => api.get('/admin/reports/export', { params, responseType: 'blob' }),
  getAuditLogs:   ()                 => api.get('/admin/audit-logs'),
}
