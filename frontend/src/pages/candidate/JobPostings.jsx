import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Briefcase, MapPin, Clock, Star, Loader2, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react'

function MatchBadge({ score }) {
  const color = score >= 70 ? '#2EE5B0' : score >= 40 ? '#F59E0B' : '#6B7280'
  const bg    = score >= 70 ? 'rgba(46,229,176,0.08)' : score >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)'
  const border= score >= 70 ? 'rgba(46,229,176,0.2)'  : score >= 40 ? 'rgba(245,158,11,0.2)'  : 'rgba(255,255,255,0.08)'
  return (
    <span style={{ padding: '3px 10px', borderRadius: 9999, background: bg, border: `1px solid ${border}`, color, fontSize: '0.78rem', fontWeight: 700 }}>
      {score.toFixed(1)}% match
    </span>
  )
}

export default function JobPostings() {
  const navigate = useNavigate()
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    candidateApi.getJobPostings()
      .then(res => setJobs(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load job postings.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Recommended Jobs</h1>
          <p className="page-subtitle">Ranked by how well they match your CV and preferences.</p>
        </div>
        <button
          onClick={load}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#E8EAF0'}
          onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Finding your best matches...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertCircle size={20} style={{ color: '#F59E0B' }} />
          </div>
          <p style={{ color: '#9CA3AF', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          <button
            onClick={() => navigate('/candidate/profile')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.2)', color: '#2EE5B0', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Complete your profile <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && jobs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Briefcase size={20} style={{ color: '#4B5563' }} />
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>No matching jobs found.</p>
          <p style={{ color: '#4B5563', fontSize: '0.8rem', margin: 0 }}>Try updating your preferences or uploading a new CV.</p>
        </div>
      )}

      {/* Job list */}
      {!loading && !error && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {jobs.map((job, i) => (
            <div
              key={job.jobId}
              className="app-card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'default', transition: 'border-color 0.2s', padding: '18px 22px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              {/* Rank badge */}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? 'rgba(46,229,176,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(46,229,176,0.25)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {i === 0 ? <Star size={15} style={{ color: '#2EE5B0' }} /> : <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>#{job.ranking}</span>}
              </div>

              {/* Job info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E8EAF0', margin: '0 0 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {job.jobTitle}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  {job.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6B7280' }}>
                      <MapPin size={11} /> {job.location}
                    </span>
                  )}
                  {job.shift && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#6B7280' }}>
                      <Clock size={11} /> {job.shift}
                    </span>
                  )}
                </div>
              </div>

              {/* Match score */}
              <MatchBadge score={job.matchScore} />
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
