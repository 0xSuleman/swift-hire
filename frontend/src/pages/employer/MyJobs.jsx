import { Fragment, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

function Toast({ msg, type }) {
  if (!msg) return null
  const ok = type === 'ok'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      borderRadius: 10, marginBottom: 20,
      background: ok ? 'rgba(46,229,176,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${ok ? 'rgba(46,229,176,0.25)' : 'rgba(239,68,68,0.2)'}`,
      color: ok ? '#2EE5B0' : '#FCA5A5', fontSize: '0.82rem',
    }}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  )
}

const STATUS_STYLE = {
  OPEN:     { color: '#2EE5B0', bg: 'rgba(46,229,176,0.1)',   border: 'rgba(46,229,176,0.25)' },
  CLOSED:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  ARCHIVED: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)' },
}

const TH = { padding: '10px 16px', textAlign: 'left', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', whiteSpace: 'nowrap' }
const TD = { padding: '9px 16px' }

function Btn({ color, bg, border, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 500, color, background: bg, border: `1px solid ${border}`, cursor: 'pointer' }}
    >
      {children}
    </button>
  )
}

export default function MyJobs() {
  const [jobs, setJobs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast]           = useState({ msg: '', type: 'ok' })
  const [confirmId, setConfirmId]   = useState(null)
  const [acting, setActing]         = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const navigate = useNavigate()

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000)
  }

  const loadJobs = async (quiet = false) => {
    quiet ? setRefreshing(true) : setLoading(true)
    try {
      const res = await employerApi.getMyJobs()
      setJobs(res.data.data ?? [])
    } catch {
      notify('Failed to load job postings.', 'err')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadJobs() }, [])

  const handleClose = async (jobId) => {
    setActing(jobId)
    try {
      await employerApi.closeJob(jobId)
      notify('Job closed successfully.')
      loadJobs(true)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to close job.', 'err')
    } finally {
      setActing(null)
    }
  }

  const handleArchive = async (jobId) => {
    setConfirmId(null)
    setActing(jobId)
    try {
      await employerApi.deleteJob(jobId)
      notify('Job archived.')
      loadJobs(true)
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to archive job.', 'err')
    } finally {
      setActing(null)
    }
  }

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading jobs...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="page-title">My Jobs</h1>
          <p className="page-subtitle">Manage your job postings — close or archive as needed.</p>
        </div>
        <button
          onClick={() => loadJobs(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.2)',
            color: '#2EE5B0', fontSize: '0.82rem', cursor: refreshing ? 'not-allowed' : 'pointer',
            opacity: refreshing ? 0.6 : 1, marginTop: 4,
          }}
        >
          <RefreshCw size={14} style={refreshing ? { animation: 'spin 1s linear infinite' } : {}} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <Toast msg={toast.msg} type={toast.type} />

      {jobs.length === 0 ? (
        <div className="app-card" style={{ textAlign: 'center', padding: '40px 24px', color: '#4B5563' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#9CA3AF' }}>No Job Postings Yet</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
            Use <strong style={{ color: '#818CF8' }}>Hire Now</strong> to create your first job posting via a hiring prompt.
          </p>
        </div>
      ) : (
        <div className="app-card" style={{ overflow: 'auto', padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={TH}>Job Title</th>
                <th style={TH}>Status</th>
                <th style={TH}>ATS</th>
                <th style={TH}>Posted</th>
                <th style={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => {
                const s          = STATUS_STYLE[job.status] ?? STATUS_STYLE.ARCHIVED
                const isActing   = acting === job.id
                const isConfirm  = confirmId === job.id
                const date       = job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '—'

                return (
                  <Fragment key={job.id}>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ ...TD, fontWeight: 500, color: '#E8EAF0' }}>{job.title}</td>
                    <td style={TD}>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 20,
                        fontSize: '0.72rem', fontWeight: 600,
                        color: s.color, background: s.bg, border: `1px solid ${s.border}`,
                      }}>
                        {job.status}
                      </span>
                    </td>
                    <td style={{ ...TD, color: '#9CA3AF' }}>
                      <span style={{ color: '#2EE5B0', fontWeight: 700 }}>{job.averageAtsScore ?? 0}%</span>
                      <span style={{ color: '#4B5563', marginLeft: 6 }}>({job.candidateCount ?? 0})</span>
                    </td>
                    <td style={{ ...TD, color: '#6B7280' }}>{date}</td>
                    <td style={TD}>
                      {isActing ? (
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: '#4B5563' }} />
                      ) : isConfirm ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <AlertTriangle size={14} style={{ color: '#F59E0B' }} />
                          <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Archive this job?</span>
                          <Btn color="#F59E0B" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.2)" onClick={() => handleArchive(job.id)}>Yes, archive</Btn>
                          <Btn color="#6B7280" bg="transparent" border="rgba(107,114,128,0.2)" onClick={() => setConfirmId(null)}>Cancel</Btn>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Btn color="#9CA3AF" bg="rgba(255,255,255,0.04)" border="rgba(255,255,255,0.08)" onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}>
                            {expandedId === job.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Details
                          </Btn>
                          {job.status === 'OPEN' && (
                            <Btn color="#818CF8" bg="rgba(129,140,248,0.08)" border="rgba(129,140,248,0.2)" onClick={() => navigate(`/employer/candidates/${job.id}`)}>
                              View Candidates
                            </Btn>
                          )}
                          {job.status === 'OPEN' && (
                            <Btn color="#FCA5A5" bg="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.2)" onClick={() => handleClose(job.id)}>
                              Close
                            </Btn>
                          )}
                          {job.status !== 'ARCHIVED' && (
                            <Btn color="#F59E0B" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.2)" onClick={() => setConfirmId(job.id)}>
                              Archive
                            </Btn>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedId === job.id && (
                    <tr>
                      <td colSpan={5} style={{ padding: '0 16px 16px' }}>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 14, display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(220px, 1fr)', gap: 18 }}>
                          <div>
                            <p style={{ margin: '0 0 6px', color: '#4B5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prompt</p>
                            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.82rem', lineHeight: 1.6 }}>
                              {job.rawPrompt || 'No prompt saved for this job.'}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 8px', color: '#4B5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parsed Result</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                              {(job.parsedSkills || '').split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                                <span key={skill} style={{ padding: '2px 8px', borderRadius: 6, background: '#2EE5B015', border: '1px solid #2EE5B030', color: '#2EE5B0', fontSize: '0.72rem' }}>{skill}</span>
                              ))}
                              {!job.parsedSkills && <span style={{ color: '#4B5563', fontSize: '0.78rem' }}>No skills saved</span>}
                            </div>
                            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.78rem' }}>
                              Location: <span style={{ color: '#9CA3AF' }}>{job.parsedLocation || 'Not specified'}</span>
                              {' · '}Shift: <span style={{ color: '#9CA3AF' }}>{job.parsedShift || 'Not specified'}</span>
                              {' · '}Experience: <span style={{ color: '#9CA3AF' }}>{job.parsedExperienceYears != null ? `${job.parsedExperienceYears} years` : 'Not specified'}</span>
                            </p>
                            <p style={{ margin: '8px 0 0', color: '#6B7280', fontSize: '0.78rem' }}>
                              Below 50% ATS: <span style={{ color: '#F59E0B' }}>{job.belowThresholdCount ?? 0}</span>
                              {job.promptSubmittedAt && <span> · Submitted {new Date(job.promptSubmittedAt).toLocaleString()}</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  )
}
