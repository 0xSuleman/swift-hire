import { useEffect, useState } from 'react'
import { employerApi } from '../../api/employerApi'

export default function EmployerAnalytics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    employerApi.getAnalytics().then(res => setData(res.data.data))
  }, [])

  if (!data) return <p>Loading analytics...</p>

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>Hiring Analytics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Average Rating', value: `${data.averageRating?.toFixed(1)} ⭐` },
          { label: 'Total Ratings', value: data.totalRatings },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: 20, border: '1px solid #ddd', borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 'bold' }}>{value}</div>
            <div style={{ color: '#888', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      {/* TODO: Chart.js bar/pie charts for time-to-hire, acceptance rate per posting */}
    </div>
  )
}
