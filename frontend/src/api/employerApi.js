import api from './axios'

export const employerApi = {
  getProfile:           ()               => api.get('/employer/profile'),
  updateProfile:        (data)           => api.put('/employer/profile', data),
  submitPrompt:         (prompt)         => api.post('/jobs/prompt', { prompt }),
  getCandidates:        (jobId)          => api.get(`/jobs/${jobId}/candidates`),
  getMyJobs:            ()               => api.get('/jobs'),
  scheduleBatch:        (data)           => api.post('/schedule/batch', data),
  rateCandidate:        (data)           => api.post('/reviews/candidate', data),
  getAnalytics:         ()               => api.get('/analytics/employer'),
  getMyInterviews:      ()                    => api.get('/schedule/my-interviews'),
  updateSlotStatus:     (slotId, status)      => api.patch(`/schedule/slots/${slotId}/status`, { status }),
  getCandidateProfile:  (candidateId)    => api.get(`/employer/candidates/${candidateId}`),
  updateJob:            (jobId, data)    => api.put(`/jobs/${jobId}`, data),
  deleteJob:            (jobId)          => api.delete(`/jobs/${jobId}`),
}
