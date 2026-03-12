import { useEffect, useState } from 'react'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Building2, MapPin, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

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
      animation: 'slideDown 0.25s ease forwards',
    }}>
      {ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  )
}

export default function EmployerProfile() {
  const [form, setForm]     = useState({ companyName: '', companyDetails: '', companyLocation: '' })
  const [toast, setToast]   = useState({ msg: '', type: 'ok' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000)
  }

  useEffect(() => {
    employerApi.getProfile()
      .then(res => {
        const d = res.data.data
        setForm({ companyName: d.companyName || '', companyDetails: d.companyDetails || '', companyLocation: d.companyLocation || '' })
      })
      .catch(() => notify('Failed to load profile.', 'err'))
      .finally(() => setFetching(false))
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await employerApi.updateProfile(form)
      notify('Profile updated successfully.')
    } catch (err) {
      notify(err.response?.data?.message || 'Invalid data entered.', 'err')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div style={{ maxWidth: 560 }}>
        <div className="page-header">
          <h1 className="page-title">Company Profile</h1>
          <p className="page-subtitle">Update your company details visible to candidates.</p>
        </div>

        <Toast msg={toast.msg} type={toast.type} />

        <form onSubmit={handleSubmit}>
          <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                <input
                  className="auth-input" style={{ height: 48, paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                  placeholder="e.g. Acme Corporation"
                  value={form.companyName}
                  onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                <input
                  className="auth-input" style={{ height: 48, paddingLeft: '2.5rem', fontSize: '0.875rem' }}
                  placeholder="e.g. Lahore, Pakistan"
                  value={form.companyLocation}
                  onChange={e => setForm(f => ({ ...f, companyLocation: e.target.value }))}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={13} /> Description</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tell candidates about your company, culture and what you're building..."
                value={form.companyDetails}
                onChange={e => setForm(f => ({ ...f, companyDetails: e.target.value }))}
                style={{
                  width: '100%', background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, color: '#E8EAF0', padding: '12px 14px', fontSize: '0.875rem',
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6,
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(46,229,176,0.4)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <button type="submit" className="btn-teal" disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                  </span>
                : 'Confirm Changes'
              }
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
