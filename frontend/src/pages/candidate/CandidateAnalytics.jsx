import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Eye, Calendar, Star, Code2, Loader2 } from 'lucide-react'

export default function CandidateAnalytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    candidateApi.getAnalytics()
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
    { label: 'Profile Views',       value: data?.profileViews ?? 0,                                      Icon: Eye,      color: '#2EE5B0' },
    { label: 'Interviews Scheduled', value: data?.interviewCount ?? 0,                                   Icon: Calendar, color: '#818CF8' },
    { label: 'Average Rating',      value: data?.averageRating != null ? data.averageRating.toFixed(1) : '—', Icon: Star, color: '#F59E0B', suffix: '/ 5' },
    { label: 'Skills Parsed',       value: data?.parsedSkillsCount ?? 0,                                 Icon: Code2,    color: '#34D399' },
  ]

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Analytics</h1>
        <p className="page-subtitle">Track how employers are discovering your profile.</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {stats.map(({ label, value, Icon, color, suffix }) => (
          <div key={label} className="app-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E8EAF0', margin: '0 0 2px' }}>
              {value}{suffix && <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 400 }}> {suffix}</span>}
            </p>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>
    </AppLayout>
  )
}
