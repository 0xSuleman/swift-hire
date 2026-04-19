import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Star, AlertCircle, Loader2, CheckCircle2, Building2, Briefcase } from 'lucide-react'

const LABELS = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' }

export default function RateEmployer() {
  const { slotId } = useParams()
  const navigate   = useNavigate()
  const [slot, setSlot]       = useState(null)
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    candidateApi.getSlot(slotId)
      .then(res => setSlot(res.data.data))
      .catch(() => {})
  }, [slotId])

  const handleSubmit = async e => {
    e.preventDefault()
    if (!rating) { setError('Please select a valid rating (1–5).'); return }
    setLoading(true)
    try {
      await candidateApi.rateEmployer({ slotId: Number(slotId), rating, comment })
      navigate('/candidate')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating.')
    } finally {
      setLoading(false)
    }
  }

  const display = hovered || rating

  return (
    <AppLayout>
      <div style={{ maxWidth: 480 }}>
        <div className="page-header">
          <h1 className="page-title">Rate Employer</h1>
          <p className="page-subtitle">Share your interview experience to help other candidates.</p>
        </div>

        {slot && (
          <div className="app-card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={14} style={{ color: '#2EE5B0' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E8EAF0' }}>{slot.employer}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={13} style={{ color: '#6B7280' }} />
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{slot.jobTitle}</span>
            </div>
            {slot.companyLocation && (
              <span style={{ fontSize: '0.75rem', color: '#4B5563' }}>{slot.companyLocation}</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Star picker */}
            <div>
              <p style={{ fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 14 }}>Rating</p>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} type="button"
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => { setRating(s); setError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 0.15s' }}
                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Star size={32}
                      style={{ color: s <= display ? '#F59E0B' : '#1F2937', fill: s <= display ? '#F59E0B' : '#1F2937', transition: 'color 0.15s, fill 0.15s' }}
                    />
                  </button>
                ))}
              </div>
              {display > 0 && (
                <p style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 500, margin: 0 }}>
                  {LABELS[display]}
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>
                Feedback <span style={{ color: '#374151' }}>(optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="How was the interview process? Was the recruiter professional?"
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{
                  width: '100%', background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, color: '#E8EAF0', padding: '12px 14px', fontSize: '0.875rem',
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(46,229,176,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
              <p style={{ fontSize: '0.72rem', color: '#374151', margin: '4px 0 0', textAlign: 'right' }}>
                {comment.length}/500
              </p>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <button type="submit" className="btn-teal" disabled={loading || !rating}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...
                  </span>
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle2 size={15} /> Submit Rating
                  </span>
              }
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
