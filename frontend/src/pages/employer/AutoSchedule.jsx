import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2, Users, ArrowLeft } from 'lucide-react'

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: '#6B7280', marginBottom: 8 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12, color: '#E8EAF0', padding: '0 14px 0 40px', height: 48,
  fontSize: '0.875rem', outline: 'none', colorScheme: 'dark',
  transition: 'border-color 0.2s',
}


export default function AutoSchedule() {
  const { jobId }   = useParams()
  const { state }   = useLocation()
  const navigate    = useNavigate()
  const selectedIds = state?.selectedIds || []

  const [window_, setWindow] = useState({ date: '', startTime: '', endTime: '' })
  const [error, setError]    = useState('')
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)   // null = form, array = preview step
  const [done, setDone]       = useState(false)
  const [doneMsg, setDoneMsg] = useState('')

  // Step 1 → Step 2: call backend preview (real conflict + time checks, no DB writes)
  const handleGeneratePreview = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await employerApi.previewSchedule({
        date: window_.date,
        startTime: window_.startTime + ':00',
        endTime: window_.endTime + ':00',
        candidateIds: selectedIds,
      })
      setPreview(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate preview.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 → Step 3: confirm → call backend
  const handleConfirm = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await employerApi.scheduleBatch({
        jobPostingId: jobId,
        candidateIds: selectedIds,
        date: window_.date,
        startTime: window_.startTime + ':00',
        endTime: window_.endTime + ':00',
      })
      setDoneMsg(res.data.message || 'Schedule created.')
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Scheduling failed.')
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Done ────────────────────────────────────────────────
  const emailsFailed  = doneMsg.includes('could not be sent')
  const alreadyBooked = doneMsg.includes('already scheduled')
  const accentColor   = alreadyBooked ? '#818CF8' : emailsFailed ? '#F59E0B' : '#2EE5B0'
  if (done) return (
    <AppLayout>
      <div style={{ maxWidth: 480, margin: '60px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `${accentColor}1A`,
          border: `1px solid ${accentColor}4D`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 32px ${accentColor}26`,
        }}>
          <CheckCircle2 size={28} style={{ color: accentColor }} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#E8EAF0', margin: '0 0 8px' }}>
            {alreadyBooked ? 'Interview Already Scheduled' : emailsFailed ? 'Schedule Created' : 'Interviews Scheduled!'}
          </h2>
          <p style={{ color: accentColor === '#2EE5B0' ? '#6B7280' : accentColor, fontSize: '0.875rem', margin: 0 }}>
            {doneMsg}
          </p>
        </div>
        <button onClick={() => navigate('/employer')} className="btn-teal" style={{ width: 'auto', padding: '10px 28px', marginTop: 8 }}>
          Finish
        </button>
      </div>
    </AppLayout>
  )

  // ── Step 2: Schedule Summary ────────────────────────────────────
  if (preview) return (
    <AppLayout>
      <div style={{ maxWidth: 520 }}>
        <button onClick={() => { setPreview(null); setError('') }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6B7280', fontSize: '0.82rem', cursor: 'pointer', marginBottom: 20, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="page-header">
          <h1 className="page-title">Schedule Summary</h1>
          <p className="page-subtitle">Review the proposed slots, then confirm to create the schedule and send invitations.</p>
        </div>

        <div className="app-card" style={{ marginBottom: 16, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={13} style={{ color: '#2EE5B0' }} />
            <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
              {new Date(window_.date + 'T00:00:00').toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          {preview.map((slot, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '14px 20px',
              borderBottom: i < preview.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E8EAF0' }}>{slot.candidateName}</span>
                <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>{slot.candidateEmail}</span>
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <Clock size={12} style={{ color: '#4B5563' }} />
                {slot.startTime} – {slot.endTime}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="error-banner" style={{ marginBottom: 12 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <button onClick={handleConfirm} className="btn-teal" disabled={loading} style={{ width: '100%' }}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating schedule...
              </span>
            : 'Confirm & Send Invitations'
          }
        </button>
      </div>
    </AppLayout>
  )

  // ── Step 1: Form ────────────────────────────────────────────────
  return (
    <AppLayout>
      <div style={{ maxWidth: 520 }}>

        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#6B7280', fontSize: '0.82rem', cursor: 'pointer', marginBottom: 20, padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
          onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
          <ArrowLeft size={14} /> Back
        </button>

        <div className="page-header">
          <h1 className="page-title">Auto-Schedule Interviews</h1>
          <p className="page-subtitle">
            Set your availability — the system slots{' '}
            <span style={{ color: '#2EE5B0', fontWeight: 600 }}>{selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''}</span>{' '}
            into 45-minute blocks automatically.
          </p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 9999, background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.15)', marginBottom: 24 }}>
          <Users size={13} style={{ color: '#2EE5B0' }} />
          <span style={{ fontSize: '0.78rem', color: '#2EE5B0', fontWeight: 500 }}>
            {selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''} · {selectedIds.length * 45} min needed
          </span>
        </div>

        <form onSubmit={handleGeneratePreview}>
          <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <Field label="Date">
              <div style={{ position: 'relative' }}>
                <Calendar size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
                <input type="date" required value={window_.date}
                  onChange={e => setWindow(w => ({ ...w, date: e.target.value }))}
                  style={inputStyle} />
              </div>
            </Field>

            <div className="two-col-grid" style={{ gap: 14 }}>
              <Field label="Start Time">
                <div style={{ position: 'relative' }}>
                  <Clock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
                  <input type="time" required value={window_.startTime}
                    onChange={e => setWindow(w => ({ ...w, startTime: e.target.value }))}
                    style={inputStyle} />
                </div>
              </Field>
              <Field label="End Time">
                <div style={{ position: 'relative' }}>
                  <Clock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
                  <input type="time" required value={window_.endTime}
                    onChange={e => setWindow(w => ({ ...w, endTime: e.target.value }))}
                    style={inputStyle} />
                </div>
              </Field>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <button type="submit" className="btn-teal" disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Checking...
                  </span>
                : 'Generate Schedule'
              }
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
