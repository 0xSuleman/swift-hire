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
  const [filters, setFilters] = useState({ minScore: 0, location: '', shift: '' })

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
      <div className="page-header-flex">
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
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>No matching jobs found. Try adjusting your preferences.</p>
        </div>
      )}

      {/* Job list */}
      {!loading && !error && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(() => {
            const filtered = jobs.filter(j =>
              j.matchScore >= filters.minScore &&
              (!filters.location || (j.location ?? '').toLowerCase().includes(filters.location.toLowerCase()) ||
                                    (j.companyLocation ?? '').toLowerCase().includes(filters.location.toLowerCase())) &&
              (!filters.shift || (j.shift ?? '').toLowerCase() === filters.shift.toLowerCase())
            )
            return (
              <>
                {/* Filter bar */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: '#111827', borderRadius: 10, border: '1px solid #1F2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Min Match %</label>
                    <input
                      type="number" min="0" max="100"
                      value={filters.minScore}
                      onChange={e => setFilters(f => ({ ...f, minScore: Number(e.target.value) }))}
                      style={{ width: 60, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Location</label>
                    <input
                      type="text" placeholder="e.g. Lahore"
                      value={filters.location}
                      onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
                      style={{ width: 100, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Shift</label>
                    <select
                      value={filters.shift}
                      onChange={e => setFilters(f => ({ ...f, shift: e.target.value }))}
                      style={{ padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
                    >
                      <option value="">Any</option>
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                      <option value="remote">Remote</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setFilters({ minScore: 0, location: '', shift: '' })}
                    style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#6B7280', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                  <span style={{ color: '#4B5563', fontSize: '0.72rem', marginLeft: 'auto' }}>
                    {filtered.length} job{filtered.length !== 1 ? 's' : ''} shown
                  </span>
                </div>
                {filtered.map((job, i) => (
            <div
              key={job.jobId}
              className="app-card"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, cursor: 'default', transition: 'border-color 0.2s', padding: '18px 22px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              {/* Rank badge */}
              {(() => {
                const isUnique = i === 0 && (jobs.length === 1 || jobs[0].matchScore > jobs[1].matchScore)
                return (
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: isUnique ? 'rgba(46,229,176,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isUnique ? 'rgba(46,229,176,0.25)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isUnique ? <Star size={15} style={{ color: '#2EE5B0' }} /> : <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>#{job.ranking}</span>}
                  </div>
                )
              })()}

              {/* Job info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#E8EAF0', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {job.jobTitle}
                </p>
                {job.companyName && (
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, color: '#2EE5B0', margin: '0 0 4px' }}>
                    {job.companyName}{job.companyLocation ? ` · ${job.companyLocation}` : ''}
                  </p>
                )}
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
                  {job.experienceYears != null && (
                    <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                      {job.experienceYears}+ yrs exp
                    </span>
                  )}
                </div>
                {job.requiredSkills && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                    {job.requiredSkills.split(',').map(s => s.trim()).filter(Boolean).map((skill, idx) => (
                      <span key={idx} style={{
                        padding: '2px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 500,
                        background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.15)', color: '#4B9E8A',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Match score */}
              <MatchBadge score={job.matchScore} />
            </div>
          ))}
              </>
            )
          })()}
        </div>
      )}
    </AppLayout>
  )
}
