import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Briefcase, MapPin, Clock, Star, Loader2, RefreshCw, AlertCircle, ArrowRight, Eye, X } from 'lucide-react'

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

function JobDetailsModal({ job, onClose }) {
  const skills = (job.requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#13171B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto', padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 22 }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '1.15rem', fontWeight: 700, color: '#E8EAF0' }}>{job.jobTitle}</p>
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: '#2EE5B0' }}>
              {job.companyName || 'Company not specified'}
              {job.companyLocation ? ` · ${job.companyLocation}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
            onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 22 }}>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: '0 0 5px', color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Match</p>
            <p style={{ margin: 0, color: '#2EE5B0', fontSize: '1rem', fontWeight: 800 }}>{job.matchScore.toFixed(1)}%</p>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: '0 0 5px', color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Rank</p>
            <p style={{ margin: 0, color: '#E8EAF0', fontSize: '1rem', fontWeight: 700 }}>#{job.ranking}</p>
          </div>
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ margin: '0 0 5px', color: '#4B5563', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Experience</p>
            <p style={{ margin: 0, color: '#E8EAF0', fontSize: '1rem', fontWeight: 700 }}>{job.experienceYears ?? 0}+ yrs</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', fontSize: '0.84rem' }}>
            <MapPin size={15} style={{ color: '#4B5563', flexShrink: 0 }} />
            {job.location || 'Location not specified'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', fontSize: '0.84rem' }}>
            <Clock size={15} style={{ color: '#4B5563', flexShrink: 0 }} />
            {job.shift || 'Shift not specified'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#9CA3AF', fontSize: '0.84rem' }}>
            <Briefcase size={15} style={{ color: '#4B5563', flexShrink: 0 }} />
            {job.companyName || 'Company not specified'}
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 10px', color: '#4B5563', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Required Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {skills.length > 0 ? skills.map(skill => (
              <span key={skill} style={{ padding: '4px 10px', borderRadius: 6, background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.15)', color: '#2EE5B0', fontSize: '0.75rem' }}>
                {skill}
              </span>
            )) : (
              <span style={{ color: '#4B5563', fontSize: '0.82rem' }}>No skills listed</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_JOB_FILTERS = {
  minScore: '',
  location: '',
  shift: '',
  skill: '',
}

function buildJobFilterParams(f) {
  const params = {}
  if (Number(f.minScore) > 0) params.minMatchScore = Number(f.minScore)
  if (f.location.trim()) params.location = f.location.trim()
  if (f.shift) params.shift = f.shift
  if (f.skill.trim()) params.skill = f.skill.trim()
  return params
}

export default function JobPostings() {
  const navigate = useNavigate()
  const [jobs, setJobs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [error, setError]     = useState('')
  const [filters, setFilters] = useState(DEFAULT_JOB_FILTERS)
  const [viewingJob, setViewingJob] = useState(null)
  const requestSeq = useRef(0)
  const initialLoadComplete = useRef(false)

  const load = useCallback((nextFilters, mode = 'filter') => {
    const requestId = ++requestSeq.current
    const isInitial = mode === 'initial'
    if (isInitial) setLoading(true)
    else setFiltering(true)
    setError('')
    return candidateApi.getJobPostings(buildJobFilterParams(nextFilters))
      .then(res => {
        if (requestId !== requestSeq.current) return
        setJobs(res.data.data ?? [])
      })
      .catch(err => {
        if (requestId === requestSeq.current) setError(err.response?.data?.message || 'Could not load job postings.')
      })
      .finally(() => {
        if (requestId !== requestSeq.current) return
        if (isInitial) setLoading(false)
        setFiltering(false)
        initialLoadComplete.current = true
      })
  }, [])

  useEffect(() => {
    initialLoadComplete.current = false
    setFilters(DEFAULT_JOB_FILTERS)
    load(DEFAULT_JOB_FILTERS, 'initial')
  }, [load])

  useEffect(() => {
    if (!initialLoadComplete.current) return undefined
    const timeoutId = window.setTimeout(() => {
      load(filters, 'filter')
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [filters, load])

  const searchWith = (partial) => {
    setFilters(current => ({ ...current, ...partial }))
  }

  return (
    <>
    {viewingJob && <JobDetailsModal job={viewingJob} onClose={() => setViewingJob(null)} />}
    <AppLayout>
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Recommended Jobs</h1>
          <p className="page-subtitle">Ranked by how well they match your CV and preferences.</p>
        </div>
        <button
          type="button"
          onClick={() => load(filters, 'filter')}
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

      {/* Filter bar */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: '#111827', borderRadius: 10, border: '1px solid #1F2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Min Match %</label>
            <input
              type="number" min="0" max="100" inputMode="numeric"
              value={filters.minScore}
              onChange={e => searchWith({ minScore: e.target.value })}
              style={{ width: 60, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Location</label>
            <input
              type="text" placeholder="e.g. Lahore"
              value={filters.location}
              onChange={e => searchWith({ location: e.target.value })}
              style={{ width: 100, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Skill</label>
            <input
              type="text" placeholder="React"
              value={filters.skill}
              onChange={e => searchWith({ skill: e.target.value })}
              style={{ width: 100, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Shift</label>
            <select
              value={filters.shift}
              onChange={e => searchWith({ shift: e.target.value })}
              style={{ padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            >
              <option value="">Any</option>
              <option value="DAY">Day</option>
              <option value="NIGHT">Night</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_JOB_FILTERS)}
            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#6B7280', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Clear
          </button>
          <span style={{ color: '#4B5563', fontSize: '0.72rem', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {jobs.length} job{jobs.length !== 1 ? 's' : ''} shown
          </span>
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
            return (
              <>
                {jobs.map((job, i) => (
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

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <MatchBadge score={job.matchScore} />
                <button
                  type="button"
                  onClick={() => setViewingJob(job)}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 9px', cursor: 'pointer', color: '#4B5563', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(46,229,176,0.3)'; e.currentTarget.style.color = '#2EE5B0' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#4B5563' }}
                  title="View job details"
                >
                  <Eye size={14} />
                </button>
              </div>
            </div>
          ))}
              </>
            )
          })()}
        </div>
      )}
    </AppLayout>
    </>
  )
}
