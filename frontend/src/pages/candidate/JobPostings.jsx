import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'

export default function JobPostings() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    candidateApi.getJobPostings()
      .then(res => setJobs(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load jobs.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Finding your recommended jobs...</p>

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2>Recommended Jobs</h2>
      {error && <p style={{ color: 'orange' }}>{error}</p>}
      {jobs.length === 0
        ? <p>No matching jobs found. Try adjusting your preferences.</p>
        : jobs.map(job => (
          <div key={job.jobId}
            style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12, borderRadius: 6 }}>
            <h3 style={{ margin: 0 }}>#{job.ranking} {job.jobTitle}</h3>
            <p style={{ color: 'green', margin: '4px 0' }}>
              <strong>{job.matchScore.toFixed(1)}% match</strong>
            </p>
            <p style={{ margin: 0, color: '#555' }}>
              {job.location && `📍 ${job.location}`}
              {job.shift && `  🕐 ${job.shift}`}
            </p>
          </div>
        ))
      }
    </div>
  )
}
