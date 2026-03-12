import { useEffect, useState } from 'react'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Star, Users, Loader2 } from 'lucide-react'

export default function EmployerAnalytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employerApi.getAnalytics()
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading analytics...
      </div>
    </AppLayout>
  )

  const stats = [
    { label: 'Average Rating', value: data?.averageRating?.toFixed(1) ?? '—', Icon: Star,  color: '#F59E0B', suffix: '/ 5' },
    { label: 'Total Reviews',  value: data?.totalRatings ?? 0,                Icon: Users, color: '#818CF8', suffix: '' },
  ]

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Hiring Analytics</h1>
        <p className="page-subtitle">Overview of your company's performance on Swift Hire.</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {stats.map(({ label, value, Icon, color, suffix }) => (
          <div key={label} className="app-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E8EAF0', margin: '0 0 2px' }}>
              {value} <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 400 }}>{suffix}</span>
            </p>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for future charts */}
      <div className="app-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 10, borderStyle: 'dashed' }}>
        <p style={{ color: '#374151', fontSize: '0.85rem', margin: 0 }}>Time-to-hire & acceptance rate charts</p>
        <p style={{ color: '#1F2937', fontSize: '0.75rem', margin: 0 }}>Coming soon — pending backend analytics aggregation</p>
      </div>
    </AppLayout>
  )
}
