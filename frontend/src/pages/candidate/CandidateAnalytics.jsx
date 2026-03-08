import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'

export default function CandidateAnalytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    candidateApi.getAnalytics().then(res => setData(res.data.data))
  }, [])

  if (!data) return <p>Loading analytics...</p>

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>My Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Profile Views', value: data.profileViews },
          { label: 'Interviews Scheduled', value: data.interviewCount },
          { label: 'Average Rating', value: `${data.averageRating.toFixed(1)} ⭐` },
          { label: 'Skills Parsed', value: data.parsedSkillsCount },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</div>
            <div style={{ color: '#888', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
