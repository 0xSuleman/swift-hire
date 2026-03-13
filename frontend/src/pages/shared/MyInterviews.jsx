import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { candidateApi } from '../../api/candidateApi'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Calendar, Clock, ExternalLink, Loader2 } from 'lucide-react'

const STATUS_COLOR = {
  PENDING:   '#F59E0B',
  CONFIRMED: '#2EE5B0',
  COMPLETED: '#818CF8',
  CANCELLED: '#EF4444',
}

export default function MyInterviews() {
  const { user } = useAuth()
  const [slots, setSlots]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const fetch = user?.role === 'CANDIDATE'
      ? candidateApi.getMyInterviews
      : employerApi.getMyInterviews

    fetch()
      .then(res => setSlots(res.data.data ?? []))
      .catch(() => setError('Failed to load interviews.'))
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading interviews...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Interviews</h1>
        <p className="page-subtitle">
          {user?.role === 'CANDIDATE'
            ? 'Your scheduled interview slots.'
            : 'All interview slots across your job postings.'}
        </p>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 20 }}>{error}</div>
      )}

      {slots.length === 0 ? (
        <div className="app-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#4B5563' }}>
          <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No interviews scheduled yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slots.map(slot => (
            <div key={slot.slotId} className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

              {/* Left: job + counterparty */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.95rem' }}>
                  {slot.jobTitle}
                </p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B7280' }}>
                  {user?.role === 'CANDIDATE'
                    ? `Employer: ${slot.employer ?? '—'}`
                    : `Candidate: ${slot.candidate ?? '—'}${slot.skills ? ` · ${slot.skills}` : ''}`}
                </p>
              </div>

              {/* Middle: time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: '0.82rem' }}>
                <Clock size={13} />
                {new Date(slot.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                {' – '}
                {new Date(slot.endTime).toLocaleTimeString([], { timeStyle: 'short' })}
              </div>

              {/* Right: status + link */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  padding: '3px 10px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 600,
                  background: `${STATUS_COLOR[slot.status] ?? '#6B7280'}18`,
                  border: `1px solid ${STATUS_COLOR[slot.status] ?? '#6B7280'}40`,
                  color: STATUS_COLOR[slot.status] ?? '#6B7280',
                }}>
                  {slot.status}
                </span>
                {slot.calendlyLink && (
                  <a href={slot.calendlyLink} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2EE5B0', fontSize: '0.78rem', textDecoration: 'none' }}>
                    <ExternalLink size={12} /> Join
                  </a>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
