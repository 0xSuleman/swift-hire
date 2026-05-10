import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Loader2, Briefcase, Eye, X } from 'lucide-react'

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

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Not scheduled'
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p style={{ margin: '0 0 3px', color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.82rem', lineHeight: 1.5 }}>{value || 'Not specified'}</p>
    </div>
  )
}

function ApplicationDetailsModal({ app, onClose }) {
  if (!app) return null
  const st = STATUS_STYLE[app.status] ?? STATUS_STYLE.RECOMMENDED
  const skills = (app.requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}
      onClick={onClose}
    >
      <div
        className="app-card"
        style={{ width: '100%', maxWidth: 620, maxHeight: '86vh', overflowY: 'auto', padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 18 }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#E8EAF0' }}>{app.jobTitle}</p>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#6B7280' }}>{app.companyName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4B5563', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <span style={{ color: '#2EE5B0', fontWeight: 700, fontSize: '0.95rem' }}>{Math.round(app.matchScore)}% match</span>
          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
            {st.label}
          </span>
          {app.jobStatus && <span style={{ color: '#6B7280', fontSize: '0.78rem' }}>Job: {app.jobStatus}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
          <DetailRow label="Location" value={app.location || app.companyLocation} />
          <DetailRow label="Shift" value={app.shift} />
          <DetailRow label="Experience" value={app.experienceYears != null ? `${app.experienceYears}+ years` : ''} />
          <DetailRow label="Applied / Matched" value={formatDate(app.applicationCreatedAt)} />
          <DetailRow label="Last Status Update" value={formatDate(app.applicationUpdatedAt)} />
          <DetailRow label="Interview" value={app.interviewDate ? `${formatDate(app.interviewDate)}${app.interviewStatus ? ` · ${app.interviewStatus}` : ''}` : ''} />
        </div>

        <div style={{ marginBottom: 18 }}>
          <p style={{ margin: '0 0 8px', color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required Skills</p>
          {skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {skills.map(skill => (
                <span key={skill} style={{ padding: '3px 10px', borderRadius: 9999, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.18)', color: '#2EE5B0', fontSize: '0.74rem' }}>{skill}</span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.82rem' }}>No required skills listed.</p>
          )}
        </div>

        {app.statusHistory?.length > 0 && (
          <div>
            <p style={{ margin: '0 0 8px', color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status History</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {app.statusHistory.map((item, index) => (
                <div key={`${item.newStatus}-${item.changedAt}-${index}`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2EE5B0', marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <p style={{ margin: '0 0 2px', color: '#E8EAF0', fontSize: '0.8rem' }}>{item.previousStatus || 'Created'} to {item.newStatus}</p>
                    <p style={{ margin: 0, color: '#4B5563', fontSize: '0.72rem' }}>{formatDate(item.changedAt)}{item.source ? ` · ${item.source}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyApplications() {
  const [apps, setApps]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [selectedApp, setSelectedApp] = useState(null)

  useEffect(() => {
    candidateApi.getMyApplications()
      .then(res => setApps(res.data.data ?? []))
      .catch(() => setError('Could not load applications.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppLayout>
      {selectedApp && <ApplicationDetailsModal app={selectedApp} onClose={() => setSelectedApp(null)} />}

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
                  <button
                    type="button"
                    onClick={() => setSelectedApp(app)}
                    title="View application details"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 9, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', color: '#818CF8', cursor: 'pointer' }}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
