import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import {
  Users, Star, MapPin, Briefcase, AlertCircle,
  Loader2, ArrowRight, CheckSquare, Square, Calendar,
  Eye, X, MapPinIcon, Clock, Monitor
} from 'lucide-react'

function MatchBadge({ score }) {
  const color  = score >= 70 ? '#2EE5B0' : score >= 40 ? '#F59E0B' : '#6B7280'
  const bg     = score >= 70 ? 'rgba(46,229,176,0.08)'  : score >= 40 ? 'rgba(245,158,11,0.08)'  : 'rgba(255,255,255,0.04)'
  const border = score >= 70 ? 'rgba(46,229,176,0.2)'   : score >= 40 ? 'rgba(245,158,11,0.2)'   : 'rgba(255,255,255,0.08)'
  return (
    <span style={{ padding: '3px 10px', borderRadius: 9999, background: bg, border: `1px solid ${border}`, color, fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
      {score.toFixed(1)}% match
    </span>
  )
}

function CandidateProfileModal({ candidateId, breakdown, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employerApi.getCandidateProfile(candidateId)
      .then(res => setProfile(res.data.data))
      .finally(() => setLoading(false))
  }, [candidateId])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#13171B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '28px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#E8EAF0' }}>Candidate Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
            onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}>
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={22} style={{ color: '#2EE5B0', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Name + Rating */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '1.2rem', fontWeight: 700, color: '#E8EAF0' }}>{profile.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Star size={13} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                  <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                    {profile.averageRating.toFixed(1)} · {profile.totalRatings} review{profile.totalRatings !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {profile.preferredLocation && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPinIcon size={14} style={{ color: '#4B5563', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>{profile.preferredLocation}</span>
                </div>
              )}
              {profile.preferredShift && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={14} style={{ color: '#4B5563', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>{profile.preferredShift}</span>
                </div>
              )}
              {profile.workType && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Monitor size={14} style={{ color: '#4B5563', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>{profile.workType}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {profile.parsedSkills && (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '0.75rem', fontWeight: 600, color: '#6B7280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.parsedSkills.split(',').filter(Boolean).map(s => (
                    <span key={s} style={{ padding: '4px 10px', borderRadius: 9999, background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.15)', color: '#2EE5B0', fontSize: '0.75rem' }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!profile.parsedSkills && !profile.preferredLocation && (
              <p style={{ color: '#4B5563', fontSize: '0.85rem', textAlign: 'center', padding: '12px 0' }}>
                This candidate hasn't completed their profile yet.
              </p>
            )}

            {/* ATS Breakdown */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #1F2937' }}>
              <p style={{ color: '#6B7280', fontSize: '0.72rem', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>ATS Breakdown</p>
              {/* Overall match bar */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Overall Match</span>
                  <span style={{ color: '#2EE5B0', fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(breakdown?.overallScore ?? 0)}%</span>
                </div>
                <div style={{ height: 5, background: '#374151', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${breakdown?.overallScore ?? 0}%`, background: '#2EE5B0', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              {/* Skill match bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Skill Match</span>
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600 }}>{Math.round(breakdown?.skillMatchPct ?? 0)}%</span>
                </div>
                <div style={{ height: 5, background: '#374151', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${breakdown?.skillMatchPct ?? 0}%`, background: '#60A5FA', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
              {/* Location + Shift */}
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: '0.75rem', color: breakdown?.locationMatched ? '#2EE5B0' : '#EF4444' }}>
                  {breakdown?.locationMatched ? '✓' : '✗'} Location
                </span>
                <span style={{ fontSize: '0.75rem', color: breakdown?.shiftMatched ? '#2EE5B0' : '#EF4444' }}>
                  {breakdown?.shiftMatched ? '✓' : '✗'} Shift
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const DEFAULT_CANDIDATE_FILTERS = {
  minScore: '',
  minRating: '',
  skill: '',
  location: '',
  shift: '',
  applicationStatus: '',
}

function buildCandidateFilterParams(f) {
  const params = {}
  if (Number(f.minScore) > 0) params.minAtsScore = Number(f.minScore)
  if (Number(f.minRating) > 0) params.minRating = Number(f.minRating)
  if (f.skill.trim()) params.skill = f.skill.trim()
  if (f.location.trim()) params.location = f.location.trim()
  if (f.shift) params.shift = f.shift
  if (f.applicationStatus) params.applicationStatus = f.applicationStatus
  return params
}

export default function RecommendedCandidates() {
  const { jobId }   = useParams()
  const navigate    = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filtering, setFiltering]   = useState(false)
  const [error, setError]           = useState('')
  const [viewingId, setViewingId]   = useState(null)
  const [viewingBreakdown, setViewingBreakdown] = useState(null)
  const [filters, setFilters]       = useState(DEFAULT_CANDIDATE_FILTERS)
  const [appStatuses, setAppStatuses] = useState({}) // keyed by candidateId
  const [statusBusy, setStatusBusy] = useState(null)
  const requestSeq = useRef(0)
  const initialLoadComplete = useRef(false)

  const loadCandidates = useCallback((nextFilters, mode = 'filter') => {
    const requestId = ++requestSeq.current
    const isInitial = mode === 'initial'
    if (isInitial) setLoading(true)
    else setFiltering(true)
    setError('')
    return employerApi.getCandidates(jobId, buildCandidateFilterParams(nextFilters))
      .then(res => {
        if (requestId !== requestSeq.current) return
        const data = res.data.data ?? []
        setCandidates(data)
        const map = {}
        data.forEach(c => { map[c.candidateId] = c.status })
        setAppStatuses(map)
        setSelected(prev => prev.filter(id => data.some(c => c.candidateId === id)))
      })
      .catch(() => {
        if (requestId === requestSeq.current) setError('Could not load candidates.')
      })
      .finally(() => {
        if (requestId !== requestSeq.current) return
        if (isInitial) setLoading(false)
        setFiltering(false)
        initialLoadComplete.current = true
      })
  }, [jobId])

  useEffect(() => {
    initialLoadComplete.current = false
    setSelected([])
    setFilters(DEFAULT_CANDIDATE_FILTERS)
    loadCandidates(DEFAULT_CANDIDATE_FILTERS, 'initial')
  }, [jobId, loadCandidates])

  useEffect(() => {
    if (!initialLoadComplete.current) return undefined
    const timeoutId = window.setTimeout(() => {
      loadCandidates(filters, 'filter')
    }, 300)
    return () => window.clearTimeout(timeoutId)
  }, [filters, loadCandidates])

  const searchWith = (partial) => {
    setFilters(current => ({ ...current, ...partial }))
  }

  const toggle    = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll = () => setSelected(s => s.length === candidates.length ? [] : candidates.map(c => c.candidateId))

  const proceed = () => {
    if (selected.length === 0) { setError('You must select at least 1 candidate.'); return }
    navigate(`/employer/schedule/${jobId}`, { state: { selectedIds: selected } })
  }

  const updateApplicationStatus = async (candidateId, status) => {
    setStatusBusy(candidateId + ':' + status)
    try {
      await employerApi.updateApplicationStatus(jobId, candidateId, status)
      await loadCandidates(filters, 'filter')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update application status.')
    } finally {
      setStatusBusy(null)
    }
  }

  return (
    <>
    {viewingId && <CandidateProfileModal candidateId={viewingId} breakdown={viewingBreakdown} onClose={() => { setViewingId(null); setViewingBreakdown(null) }} />}
    <AppLayout>
      <div className="page-header-flex">
        <div>
          <h1 className="page-title">Recommended Candidates</h1>
          <p className="page-subtitle">Ranked by ATS score. Select candidates to schedule interviews.</p>
        </div>

        {/* Proceed button — top right */}
        {candidates.length > 0 && (
          <button
            onClick={proceed}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 9999,
              background: selected.length > 0 ? 'linear-gradient(135deg,#2ee5b0,#00c9a7)' : 'rgba(255,255,255,0.05)',
              color: selected.length > 0 ? '#052015' : '#4B5563',
              border: `1px solid ${selected.length > 0 ? 'transparent' : 'rgba(255,255,255,0.08)'}`,
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: selected.length > 0 ? '0 0 20px rgba(46,229,176,0.25)' : 'none',
            }}
          >
            <Calendar size={14} />
            Schedule {selected.length > 0 ? `(${selected.length})` : ''} <ArrowRight size={13} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner" style={{ marginBottom: 16 }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Finding top matches...
        </div>
      )}

      {/* Filter bar */}
      {!loading && !error && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16, padding: '10px 14px', background: '#111827', borderRadius: 10, border: '1px solid #1F2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Min ATS %</label>
            <input
              type="number" min="0" max="100" inputMode="numeric"
              value={filters.minScore}
              onChange={e => searchWith({ minScore: e.target.value })}
              style={{ width: 60, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Min Rating</label>
            <select
              value={filters.minRating}
              onChange={e => searchWith({ minRating: e.target.value })}
              style={{ padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            >
              <option value="">Any</option>
              <option value="1">1★+</option>
              <option value="2">2★+</option>
              <option value="3">3★+</option>
              <option value="4">4★+</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Skill</label>
            <input
              type="text" placeholder="Java"
              value={filters.skill}
              onChange={e => searchWith({ skill: e.target.value })}
              style={{ width: 90, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Location</label>
            <input
              type="text" placeholder="Lahore"
              value={filters.location}
              onChange={e => searchWith({ location: e.target.value })}
              style={{ width: 90, padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ color: '#6B7280', fontSize: '0.75rem' }}>Status</label>
            <select
              value={filters.applicationStatus}
              onChange={e => searchWith({ applicationStatus: e.target.value })}
              style={{ padding: '4px 8px', background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#E8EAF0', fontSize: '0.8rem' }}
            >
              <option value="">Any</option>
              {['RECOMMENDED', 'SHORTLISTED', 'SCHEDULED', 'CONFIRMED', 'COMPLETED', 'REVIEWED', 'HIRED', 'REJECTED'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_CANDIDATE_FILTERS)}
            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #374151', borderRadius: 6, color: '#6B7280', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            Clear
          </button>
          <span style={{ color: '#4B5563', fontSize: '0.72rem', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            Showing {candidates.length}
          </span>
        </div>
      )}

      {/* Empty */}
      {!loading && candidates.length === 0 && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: '#4B5563' }} />
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>No matching candidates found. Try changing skills/experience/location.</p>
        </div>
      )}

      {/* List */}
      {!loading && candidates.length > 0 && (
        <>
          {/* Select all row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: '0.78rem', color: '#4B5563' }}>
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={toggleAll}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6B7280', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
              onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
            >
              {selected.length === candidates.length
                ? <><CheckSquare size={13} style={{ color: '#2EE5B0' }} /> Deselect all</>
                : <><Square size={13} /> Select all</>
              }
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {candidates.map((c, i) => {
              const isSelected = selected.includes(c.candidateId)
              return (
                <div
                  key={c.candidateId}
                  onClick={() => toggle(c.candidateId)}
                  className="app-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                    padding: '16px 20px', transition: 'border-color 0.2s',
                    borderColor: isSelected ? 'rgba(46,229,176,0.3)' : 'rgba(255,255,255,0.07)',
                    background: isSelected ? 'rgba(46,229,176,0.03)' : '#13171B',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{ flexShrink: 0 }}>
                    {isSelected
                      ? <CheckSquare size={18} style={{ color: '#2EE5B0' }} />
                      : <Square size={18} style={{ color: '#374151' }} />
                    }
                  </div>

                  {/* Rank */}
                  {(() => {
                    const isUnique = i === 0 && (candidates.length === 1 || candidates[0].matchScore > candidates[1].matchScore)
                    return (
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: isUnique ? 'rgba(46,229,176,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isUnique ? 'rgba(46,229,176,0.2)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isUnique
                          ? <Star size={13} style={{ color: '#2EE5B0' }} />
                          : <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4B5563' }}>#{c.ranking}</span>
                        }
                      </div>
                    )
                  })()}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E8EAF0', margin: '0 0 4px' }}>
                      {c.name}
                    </p>
                    {c.skills && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {c.skills.split(',').filter(Boolean).slice(0, 4).map(s => (
                          <span key={s} style={{ padding: '2px 8px', borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6B7280', fontSize: '0.72rem' }}>
                            {s.trim()}
                          </span>
                        ))}
                        {c.skills.split(',').filter(Boolean).length > 4 && (
                          <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                            +{c.skills.split(',').filter(Boolean).length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                    <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{c.averageRating.toFixed(1)}</span>
                  </div>

                  {/* Match badge */}
                  <MatchBadge score={c.matchScore} />

                  {/* Application status badge */}
                  {appStatuses[c.candidateId] && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600,
                      background: appStatuses[c.candidateId] === 'HIRED' ? '#34D39915' :
                                  appStatuses[c.candidateId] === 'COMPLETED' ? '#818CF815' :
                                  appStatuses[c.candidateId] === 'CONFIRMED' ? '#2EE5B015' :
                                  appStatuses[c.candidateId] === 'SCHEDULED' ? '#F59E0B15' : '#1F2937',
                      color: appStatuses[c.candidateId] === 'HIRED' ? '#34D399' :
                             appStatuses[c.candidateId] === 'COMPLETED' ? '#818CF8' :
                             appStatuses[c.candidateId] === 'CONFIRMED' ? '#2EE5B0' :
                             appStatuses[c.candidateId] === 'SCHEDULED' ? '#F59E0B' : '#6B7280',
                      border: `1px solid ${
                        appStatuses[c.candidateId] === 'HIRED' ? '#34D39930' :
                        appStatuses[c.candidateId] === 'COMPLETED' ? '#818CF830' :
                        appStatuses[c.candidateId] === 'CONFIRMED' ? '#2EE5B030' :
                        appStatuses[c.candidateId] === 'SCHEDULED' ? '#F59E0B30' : '#374151'
                      }`,
                    }}>
                      {appStatuses[c.candidateId]}
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); updateApplicationStatus(c.candidateId, 'SHORTLISTED') }}
                      disabled={statusBusy !== null || appStatuses[c.candidateId] === 'SHORTLISTED' || appStatuses[c.candidateId] === 'HIRED'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 8px', borderRadius: 8,
                        background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.18)',
                        color: '#2EE5B0', fontSize: '0.7rem', cursor: statusBusy ? 'not-allowed' : 'pointer',
                        opacity: appStatuses[c.candidateId] === 'SHORTLISTED' || appStatuses[c.candidateId] === 'HIRED' ? 0.45 : 1,
                      }}
                    >
                      <CheckSquare size={12} /> Shortlist
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); updateApplicationStatus(c.candidateId, 'REJECTED') }}
                      disabled={statusBusy !== null || appStatuses[c.candidateId] === 'REJECTED' || appStatuses[c.candidateId] === 'HIRED'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '5px 8px', borderRadius: 8,
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
                        color: '#FCA5A5', fontSize: '0.7rem', cursor: statusBusy ? 'not-allowed' : 'pointer',
                        opacity: appStatuses[c.candidateId] === 'REJECTED' || appStatuses[c.candidateId] === 'HIRED' ? 0.45 : 1,
                      }}
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>

                  {/* View profile */}
                  <button
                    onClick={e => { e.stopPropagation(); setViewingId(c.candidateId); setViewingBreakdown({ overallScore: c.matchScore, skillMatchPct: c.skillMatchPct, locationMatched: c.locationMatched, shiftMatched: c.shiftMatched }) }}
                    style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#4B5563', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(46,229,176,0.3)'; e.currentTarget.style.color = '#2EE5B0' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#4B5563' }}
                    title="View profile"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </AppLayout>
    </>
  )
}
