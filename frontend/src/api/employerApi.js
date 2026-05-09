import api from './axios'

export const employerApi = {
  getProfile:           ()               => api.get('/employer/profile'),
  updateProfile:        (data)           => api.put('/employer/profile', data),
  submitPrompt:         (prompt)         => api.post('/jobs/prompt', { prompt }),
  getCandidates:        (jobId, params)  => api.get(`/jobs/${jobId}/candidates`, { params }),
  getMyJobs:            ()               => api.get('/jobs'),
  previewSchedule:      (data)           => api.post('/schedule/preview', data),
  scheduleBatch:        (data)           => api.post('/schedule/batch', data),
  rateCandidate:        (data)           => api.post('/reviews/candidate', data),
  getAnalytics:         ()               => api.get('/analytics/employer'),
  getMyInterviews:      ()                    => api.get('/schedule/my-interviews'),
  updateSlotStatus:     (slotId, status)      => api.patch(`/schedule/slots/${slotId}/status`, { status }),
  getCandidateProfile:  (candidateId)    => api.get(`/employer/candidates/${candidateId}`),
  updateJob:            (jobId, data)    => api.put(`/jobs/${jobId}`, data),
  deleteJob:            (jobId)          => api.delete(`/jobs/${jobId}`),
  closeJob:             (jobId)          => api.patch(`/jobs/${jobId}/status`, { status: 'CLOSED' }),
  getSlot:              (slotId)         => api.get(`/schedule/slots/${slotId}`),
  hireCandidate:        (candidateId, jobPostingId) => api.post(`/employer/candidates/${candidateId}/hire`, { jobPostingId }),
  getApplicationStatuses: (jobId) => api.get(`/jobs/${jobId}/application-statuses`),
  updateApplicationStatus: (jobId, candidateId, status) => api.patch(`/jobs/${jobId}/applications/${candidateId}/status`, { status }),
}
