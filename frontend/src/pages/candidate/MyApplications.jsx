import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Loader2, Briefcase } from 'lucide-react'

const STATUS_STYLE = {
  RECOMMENDED: { label: 'Recommended', bg: '#1F2937', color: '#6B7280', border: '#374151' },
  SHORTLISTED: { label: 'Shortlisted', bg: '#2EE5B015', color: '#2EE5B0', border: '#2EE5B030' },
  SCHEDULED:   { label: 'Scheduled',   bg: '#F59E0B15', color: '#F59E0B', border: '#F59E0B30' },
  CONFIRMED:   { label: 'Confirmed',   bg: '#2EE5B015', color: '#2EE5B0', border: '#2EE5B030' },
  COMPLETED:   { label: 'Completed',   bg: '#818CF815', color: '#818CF8', border: '#818CF830' },
  REVIEWED:    { label: 'Reviewed',    bg: '#818CF815', color: '#818CF8', border: '#818CF830' },
  HIRED:       { label: 'Hired 🎉',    bg: '#34D39915', color: '#34D399', border: '#34D39930' },
  REJECTED:    { label: 'Rejected',    bg: '#EF444415', color: '#FCA5A5', border: '#EF444430' },
}

export default function MyApplications() {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    candidateApi.getMyApplications()
      .then(res => setApps(res.data.data ?? []))
      .catch(() => setError('Could not load applications.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">Track your progress across all job matches.</p>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading applications...
        </div>
      )}

      {error && (
        <div className="app-card" style={{ color: '#EF4444', textAlign: 'center', padding: '32px 0' }}>{error}</div>
      )}

      {!loading && !error && apps.length === 0 && (
        <div className="app-card" style={{ textAlign: 'center', padding: '40px 24px', color: '#4B5563' }}>
          <Briefcase size={32} style={{ color: '#374151', marginBottom: 10 }} />
          <p style={{ margin: 0 }}>No applications yet.</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#374151' }}>Upload your CV and check Job Postings to get matched.</p>
        </div>
      )}

      {!loading && !error && apps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apps.map(app => {
            const st = STATUS_STYLE[app.status] ?? STATUS_STYLE.RECOMMENDED
            return (
              <div key={app.jobId} className="app-card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.95rem' }}>{app.jobTitle}</p>
                  <p style={{ margin: 0, color: '#6B7280', fontSize: '0.8rem' }}>{app.companyName}</p>
                  {app.interviewDate && (
                    <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.75rem' }}>
                      Interview: {new Date(app.interviewDate).toLocaleString()}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#2EE5B0', fontWeight: 700, fontSize: '0.9rem' }}>{Math.round(app.matchScore)}%</span>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`
                  }}>
                    {st.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
