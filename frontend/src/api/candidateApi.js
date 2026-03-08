import api from './axios'

export const candidateApi = {
  getProfile:       ()        => api.get('/candidate/profile'),
  updateProfile:    (data)    => api.put('/candidate/profile', data),
  uploadCv:         (file)    => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/candidate/cv', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  setPreferences:   (prefs)   => api.put('/candidate/preferences', prefs),
  getJobPostings:   ()        => api.get('/candidate/job-postings'),
  getAnalytics:     ()        => api.get('/analytics/candidate'),
  rateEmployer:     (data)    => api.post('/reviews/employer', data),
}
