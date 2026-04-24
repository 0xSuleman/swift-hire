import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { candidateApi } from '../../api/candidateApi'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Calendar, Clock, ExternalLink, Loader2, Star, X, RefreshCw } from 'lucide-react'

const STATUS_COLOR = {
  PENDING:   '#F59E0B',
  CONFIRMED: '#2EE5B0',
  COMPLETED: '#818CF8',
  CANCELLED: '#EF4444',
}

function ReviewModal({ slot, isCandidate, onRate, onDismiss }) {
  const counterparty = isCandidate ? slot.employer : slot.candidate
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#13171B', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 18, padding: '32px 28px', maxWidth: 420, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
            onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}>
            <X size={16} />
          </button>
        </div>

        {/* Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Star size={24} style={{ color: '#F59E0B' }} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#E8EAF0' }}>
              Interview Complete
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.6 }}>
              How was your interview for <strong style={{ color: '#9CA3AF' }}>{slot.jobTitle}</strong>
              {counterparty ? <> with <strong style={{ color: '#9CA3AF' }}>{counterparty}</strong></> : ''}?
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onRate} className="btn-teal">
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Star size={14} /> Rate Now
            </span>
          </button>
          <button onClick={onDismiss} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
            color: '#4B5563', fontSize: '0.875rem', padding: '10px', cursor: 'pointer',
            transition: 'color 0.2s, border-color 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MyInterviews() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const isCandidate = user?.role === 'CANDIDATE'

  const [slots, setSlots]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [updating, setUpdating]       = useState(null)
  const [modalSlot, setModalSlot]     = useState(null)  // slot to show review modal for

  const api = isCandidate ? candidateApi : employerApi

  const load = (keepError = false) => {
    setLoading(true)
    if (!keepError) setError('')
    api.getMyInterviews()
      .then(res => {
        const data = res.data.data ?? []
        setSlots(data)
        // Show modal for the first COMPLETED slot not yet reviewed
        const pending = data.find(s => s.status === 'COMPLETED' && !s.hasReviewed)
        if (pending) setModalSlot(pending)
      })
      .catch(() => setError('Failed to load interviews.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user])

  const updateStatus = async (slotId, status) => {
    setUpdating(slotId)
    setError('')
    try {
      await api.updateSlotStatus(slotId, status)
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.')
      load(true)
    } finally {
      setUpdating(null)
    }
  }

  const handleRate = () => {
    if (!modalSlot) return
    const path = isCandidate
      ? `/candidate/rate/${modalSlot.slotId}`
      : `/employer/rate/${modalSlot.slotId}`
    setModalSlot(null)
    navigate(path)
  }

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading interviews...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      {modalSlot && (
        <ReviewModal
          slot={modalSlot}
          isCandidate={isCandidate}
          onRate={handleRate}
          onDismiss={() => setModalSlot(null)}
        />
      )}

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">My Interviews</h1>
          <p className="page-subtitle">
            {isCandidate
              ? 'Your scheduled interview slots.'
              : 'All interview slots across your job postings.'}
          </p>
        </div>
        <button onClick={() => load()} disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#6B7280', fontSize: '0.78rem', padding: '7px 13px', cursor: loading ? 'not-allowed' : 'pointer', transition: 'color 0.2s, border-color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#9CA3AF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 20 }}>{error}</div>}

      {slots.length === 0 ? (
        <div className="app-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#4B5563' }}>
          <Calendar size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No interviews scheduled yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {slots.map(slot => {
            const busy = updating === slot.slotId

            return (
              <div key={slot.slotId} className="app-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>

                {/* Left: job + counterparty */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.95rem' }}>
                    {slot.jobTitle}
                  </p>
                  {isCandidate ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                        {slot.employer ?? '—'}{slot.companyLocation ? ` · ${slot.companyLocation}` : ''}
                      </span>
                      {slot.employerEmail && (
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>{slot.employerEmail}</span>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{slot.candidate ?? '—'}</span>
                      {slot.candidateEmail && (
                        <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>
                          {slot.candidateEmail}{slot.candidatePhone ? ` · ${slot.candidatePhone}` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Middle: time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <Clock size={13} />
                  {new Date(slot.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  {' – '}
                  {new Date(slot.endTime).toLocaleTimeString([], { timeStyle: 'short' })}
                </div>

                {/* Right: status badge + actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>

                  <span style={{
                    padding: '3px 10px', borderRadius: 9999, fontSize: '0.72rem', fontWeight: 600,
                    background: `${STATUS_COLOR[slot.status] ?? '#6B7280'}18`,
                    border: `1px solid ${STATUS_COLOR[slot.status] ?? '#6B7280'}40`,
                    color: STATUS_COLOR[slot.status] ?? '#6B7280',
                  }}>
                    {slot.status}
                  </span>

                  {slot.calendlyLink && slot.status !== 'CANCELLED' && (
                    <a href={slot.calendlyLink} target="_blank" rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#2EE5B0', fontSize: '0.78rem', textDecoration: 'none' }}>
                      <ExternalLink size={12} /> Join
                    </a>
                  )}

                  {/* ── CANDIDATE actions ── */}
                  {isCandidate && slot.status === 'PENDING' && (
                    <button onClick={() => updateStatus(slot.slotId, 'CONFIRMED')} disabled={busy}
                      style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #2EE5B040', background: '#2EE5B018', color: '#2EE5B0' }}>
                      {busy ? '…' : 'Confirm'}
                    </button>
                  )}
                  {isCandidate && (slot.status === 'PENDING' || slot.status === 'CONFIRMED') && (
                    <button onClick={() => updateStatus(slot.slotId, 'CANCELLED')} disabled={busy}
                      style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #EF444440', background: '#EF444418', color: '#EF4444' }}>
                      {busy ? '…' : 'Cancel'}
                    </button>
                  )}
                  {isCandidate && slot.status === 'COMPLETED' && !slot.hasReviewed && (
                    <button onClick={() => navigate(`/candidate/rate/${slot.slotId}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #F59E0B40', background: '#F59E0B18', color: '#F59E0B' }}>
                      <Star size={12} /> Rate Employer
                    </button>
                  )}
                  {isCandidate && slot.status === 'COMPLETED' && slot.hasReviewed && (
                    <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>Reviewed</span>
                  )}

                  {/* ── EMPLOYER actions ── */}
                  {!isCandidate && slot.status === 'CONFIRMED' && (
                    <button onClick={() => updateStatus(slot.slotId, 'COMPLETED')} disabled={busy}
                      style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #818CF840', background: '#818CF818', color: '#818CF8' }}>
                      {busy ? '…' : 'Mark Complete'}
                    </button>
                  )}
                  {!isCandidate && (slot.status === 'PENDING' || slot.status === 'CONFIRMED') && (
                    <button onClick={() => updateStatus(slot.slotId, 'CANCELLED')} disabled={busy}
                      style={{ padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #EF444440', background: '#EF444418', color: '#EF4444' }}>
                      {busy ? '…' : 'Cancel'}
                    </button>
                  )}
                  {!isCandidate && slot.status === 'COMPLETED' && !slot.hasReviewed && (
                    <button onClick={() => navigate(`/employer/rate/${slot.slotId}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #F59E0B40', background: '#F59E0B18', color: '#F59E0B' }}>
                      <Star size={12} /> Rate Candidate
                    </button>
                  )}
                  {!isCandidate && slot.status === 'COMPLETED' && slot.hasReviewed && (
                    <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>Reviewed</span>
                  )}

                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
