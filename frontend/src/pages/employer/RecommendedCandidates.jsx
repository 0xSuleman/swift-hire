import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'

export default function RecommendedCandidates() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    employerApi.getCandidates(jobId)
      .then(res => setCandidates(res.data.data))
      .catch(() => setError('Could not load candidates.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const toggle = id => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const proceed = () => {
    if (selected.length === 0) {
      setError('You must select at least 1 candidate.')
      return
    }
    navigate(`/employer/schedule/${jobId}`, { state: { selectedIds: selected } })
  }

  if (loading) return <p>Loading candidates...</p>

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h2>Top Matching Candidates</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {candidates.length === 0
        ? <p>No matching candidates found. Try changing skills/experience/location.</p>
        : candidates.map(c => (
          <div key={c.candidateId}
            style={{ border: '1px solid #ddd', padding: 16, marginBottom: 12, borderRadius: 6 }}>
            <label>
              <input type="checkbox" checked={selected.includes(c.candidateId)}
                onChange={() => toggle(c.candidateId)} style={{ marginRight: 8 }} />
              <strong>#{c.ranking} {c.name}</strong>
              <span style={{ marginLeft: 12, color: 'green' }}>{c.matchScore.toFixed(1)}% match</span>
              <span style={{ marginLeft: 12, color: '#888' }}>⭐ {c.averageRating.toFixed(1)}</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', color: '#555' }}>Skills: {c.skills}</p>
          </div>
        ))
      }
      <button onClick={proceed} style={{ padding: '10px 24px', marginTop: 16 }}>
        Proceed to Scheduling →
      </button>
    </div>
  )
}
