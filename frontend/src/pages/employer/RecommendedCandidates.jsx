import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import {
  Users, Star, MapPin, Briefcase, AlertCircle,
  Loader2, ArrowRight, CheckSquare, Square, Calendar
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

export default function RecommendedCandidates() {
  const { jobId }   = useParams()
  const navigate    = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    employerApi.getCandidates(jobId)
      .then(res => setCandidates(res.data.data))
      .catch(() => setError('Could not load candidates.'))
      .finally(() => setLoading(false))
  }, [jobId])

  const toggle    = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const toggleAll = () => setSelected(s => s.length === candidates.length ? [] : candidates.map(c => c.candidateId))

  const proceed = () => {
    if (selected.length === 0) { setError('You must select at least 1 candidate.'); return }
    navigate(`/employer/schedule/${jobId}`, { state: { selectedIds: selected } })
  }

  return (
    <AppLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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

      {/* Empty */}
      {!loading && candidates.length === 0 && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} style={{ color: '#4B5563' }} />
          </div>
          <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>No matching candidates found.</p>
          <p style={{ color: '#4B5563', fontSize: '0.8rem', margin: 0 }}>Try changing skills, experience or location in your prompt.</p>
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
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: i === 0 ? 'rgba(46,229,176,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(46,229,176,0.2)' : 'rgba(255,255,255,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {i === 0
                      ? <Star size={13} style={{ color: '#2EE5B0' }} />
                      : <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4B5563' }}>#{c.ranking}</span>
                    }
                  </div>

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
                </div>
              )
            })}
          </div>
        </>
      )}
    </AppLayout>
  )
}
