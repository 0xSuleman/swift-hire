import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'

export default function AutoSchedule() {
  const { jobId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const selectedIds = state?.selectedIds || []

  const [window_, setWindow] = useState({ date: '', startTime: '', endTime: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await employerApi.scheduleBatch({
        jobPostingId: jobId,
        candidateIds: selectedIds,
        date: window_.date,
        startTime: window_.startTime + ':00',
        endTime: window_.endTime + ':00',
      })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Scheduling failed.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div style={{ maxWidth: 500, margin: '60px auto', padding: 24, textAlign: 'center' }}>
      <h2>Schedule Created!</h2>
      <p>Interview invitations sent to {selectedIds.length} candidate(s).</p>
      <button onClick={() => navigate('/employer')}>Back to Dashboard</button>
    </div>
  )

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24 }}>
      <h2>Auto-Schedule Interviews</h2>
      <p>Scheduling {selectedIds.length} candidate(s) in 45-minute slots.</p>
      <form onSubmit={handleSubmit}>
        <label>Date<br/>
          <input type="date" required value={window_.date}
            onChange={e => setWindow(w => ({ ...w, date: e.target.value }))}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }} />
        </label>
        <label>Start Time<br/>
          <input type="time" required value={window_.startTime}
            onChange={e => setWindow(w => ({ ...w, startTime: e.target.value }))}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }} />
        </label>
        <label>End Time<br/>
          <input type="time" required value={window_.endTime}
            onChange={e => setWindow(w => ({ ...w, endTime: e.target.value }))}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }} />
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: 10 }}>
          {loading ? 'Generating schedule...' : 'Generate Schedule'}
        </button>
      </form>
    </div>
  )
}
