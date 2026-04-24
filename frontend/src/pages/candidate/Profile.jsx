import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import {
  User, Mail, Phone, MapPin, Upload, CheckCircle2,
  AlertCircle, Loader2, Eye, Briefcase, Sun, Moon, Monitor,
} from 'lucide-react'

const SHIFTS    = [{ v: '',      l: 'Any Shift' }, { v: 'DAY', l: 'Day' }, { v: 'NIGHT', l: 'Night' }]
const WORKTYPES = [{ v: '',      l: 'Any' }, { v: 'REMOTE', l: 'Remote' }, { v: 'ON_SITE', l: 'On-Site' }, { v: 'HYBRID', l: 'Hybrid' }]
const SHIFT_ICONS = { DAY: Sun, NIGHT: Moon, '': Monitor }
const WORKTYPE_ICONS = { REMOTE: Monitor, ON_SITE: Briefcase, HYBRID: Briefcase, '': Briefcase }

function Toast({ msg, type }) {
  if (!msg) return null
  const isOk = type === 'ok'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 10, marginBottom: 20,
      background: isOk ? 'rgba(46,229,176,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${isOk ? 'rgba(46,229,176,0.25)' : 'rgba(239,68,68,0.2)'}`,
      color: isOk ? '#2EE5B0' : '#FCA5A5',
      fontSize: '0.82rem', animation: 'slideDown 0.25s ease forwards',
    }}>
      {isOk ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="app-card" style={{ marginBottom: 20 }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18, margin: '0 0 18px' }}>
        {title}
      </p>
      {children}
    </div>
  )
}

export default function Profile() {
  const [profile, setProfile]   = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [file, setFile]         = useState(null)
  const [prefs, setPrefs]       = useState({ location: '', shift: '', workType: '' })
  const [toast, setToast]       = useState({ msg: '', type: 'ok' })
  const [cvLoading, setCvLoading]     = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(false)

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000)
  }

  const loadProfile = () => {
    setFetchError(false)
    candidateApi.getProfile()
      .then(res => {
        setProfile(res.data.data)
        setPrefs({
          location: res.data.data.preferredLocation || '',
          shift:    res.data.data.preferredShift    || '',
          workType: res.data.data.workType          || '',
        })
      })
      .catch(() => { notify('Failed to load profile.', 'err'); setFetchError(true) })
  }

  useEffect(() => { loadProfile() }, [])

  const uploadCv = async e => {
    e.preventDefault()
    if (!file) { notify('Please add a PDF file.', 'err'); return }
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      notify('Please add a PDF file.', 'err'); return
    }
    if (file.size > 10 * 1024 * 1024) {
      notify('File size exceeds the allowed limit.', 'err'); return
    }
    setCvLoading(true)
    try {
      await candidateApi.uploadCv(file)
      notify('CV uploaded and parsed successfully.')
      setFile(null)
      const res = await candidateApi.getProfile()
      setProfile(res.data.data)
    } catch (err) {
      notify(err.response?.data?.message || 'Upload failed.', 'err')
    } finally {
      setCvLoading(false)
    }
  }

  const savePrefs = async e => {
    e.preventDefault()
    setPrefsLoading(true)
    try {
      await candidateApi.setPreferences(prefs)
      notify('Preferences saved.')
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to save preferences.', 'err')
    } finally {
      setPrefsLoading(false)
    }
  }

  if (!profile && !fetchError) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4B5563', gap: 10 }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
        Loading profile...
      </div>
    </AppLayout>
  )

  if (fetchError) return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#4B5563', gap: 16 }}>
        <p style={{ color: '#FCA5A5', fontSize: '0.9rem', margin: 0 }}>Failed to load profile.</p>
        <button onClick={loadProfile}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', background: 'none', color: '#9CA3AF', fontSize: '0.82rem', cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your information, CV and job preferences.</p>
      </div>

      <Toast msg={toast.msg} type={toast.type} />

      <div className="two-col-grid">

        {/* ── Left column ── */}
        <div>

          {/* Info card */}
          <Section title="Account Info">
            {[
              { Icon: User,  label: 'Name',  value: profile.name },
              { Icon: Mail,  label: 'Email', value: profile.email },
              { Icon: Phone, label: 'Phone', value: profile.phoneNo || '—' },
            ].map(({ Icon, label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} style={{ color: '#4B5563' }} />
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: '#4B5563', margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                  <p style={{ fontSize: '0.875rem', color: '#E8EAF0', margin: 0 }}>{value}</p>
                </div>
              </div>
            ))}

            {/* Profile views stat */}
            <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(46,229,176,0.05)', border: '1px solid rgba(46,229,176,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={14} style={{ color: '#2EE5B0' }} />
              <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                Profile viewed <span style={{ color: '#2EE5B0', fontWeight: 600 }}>{profile.profileViews}</span> time{profile.profileViews !== 1 ? 's' : ''} by employers
              </span>
            </div>
          </Section>

          {/* CV Upload */}
          <Section title="CV">
            {/* Parsed skills preview */}
            {profile.parsedSkills ? (
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: 8 }}>Parsed skills from your CV:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.parsedSkills.split(',').filter(Boolean).map(skill => (
                    <span key={skill} style={{ padding: '3px 10px', borderRadius: 9999, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.2)', color: '#2EE5B0', fontSize: '0.75rem', fontWeight: 500 }}>
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.82rem', color: '#4B5563', marginBottom: 16 }}>
                No CV uploaded yet. Upload a PDF to enable job matching.
              </p>
            )}

            <form onSubmit={uploadCv}>
              {/* Drop zone */}
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '22px 16px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px dashed ${file ? 'rgba(46,229,176,0.4)' : 'rgba(255,255,255,0.1)'}`,
                background: file ? 'rgba(46,229,176,0.04)' : 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s', marginBottom: 12,
              }}>
                <Upload size={20} style={{ color: file ? '#2EE5B0' : '#4B5563' }} />
                <span style={{ fontSize: '0.82rem', color: file ? '#2EE5B0' : '#6B7280' }}>
                  {file ? file.name : 'Click to select PDF (max 10 MB)'}
                </span>
                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
              </label>

              <button type="submit" className="btn-teal" disabled={!file || cvLoading}>
                {cvLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Parsing...
                    </span>
                  : 'Upload & Parse CV'
                }
              </button>
            </form>
          </Section>

        </div>

        {/* ── Right column ── */}
        <div>
          <Section title="Job Preferences">
            <form onSubmit={savePrefs} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', marginBottom: 8, fontWeight: 500 }}>
                  Preferred Location
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                  <input
                    className="auth-input"
                    style={{ height: 44, paddingLeft: '2.5rem', fontSize: '0.85rem' }}
                    placeholder="e.g. Lahore, Karachi"
                    value={prefs.location}
                    onChange={e => setPrefs(p => ({ ...p, location: e.target.value }))}
                  />
                </div>
              </div>

              {/* Shift */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', marginBottom: 8, fontWeight: 500 }}>
                  Preferred Shift
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {SHIFTS.map(({ v, l }) => {
                    const Icon = SHIFT_ICONS[v] || Monitor
                    const active = prefs.shift === v
                    return (
                      <button key={v} type="button"
                        onClick={() => setPrefs(p => ({ ...p, shift: v }))}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 10, border: `1.5px solid ${active ? 'rgba(46,229,176,0.45)' : 'rgba(255,255,255,0.07)'}`,
                          background: active ? 'rgba(46,229,176,0.07)' : '#0A0C0E', cursor: 'pointer',
                          color: active ? '#2EE5B0' : '#6B7280', fontSize: '0.78rem', fontWeight: 500,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                        }}>
                        <Icon size={13} />
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Work type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', marginBottom: 8, fontWeight: 500 }}>
                  Work Type
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {WORKTYPES.map(({ v, l }) => {
                    const active = prefs.workType === v
                    return (
                      <button key={v} type="button"
                        onClick={() => setPrefs(p => ({ ...p, workType: v }))}
                        style={{
                          flex: 1, padding: '8px 4px', borderRadius: 10, border: `1.5px solid ${active ? 'rgba(46,229,176,0.45)' : 'rgba(255,255,255,0.07)'}`,
                          background: active ? 'rgba(46,229,176,0.07)' : '#0A0C0E', cursor: 'pointer',
                          color: active ? '#2EE5B0' : '#6B7280', fontSize: '0.75rem', fontWeight: 500,
                          transition: 'all 0.2s',
                        }}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button type="submit" className="btn-teal" disabled={prefsLoading} style={{ marginTop: 4 }}>
                {prefsLoading
                  ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                    </span>
                  : 'Save Preferences'
                }
              </button>
            </form>
          </Section>
        </div>

      </div>
    </AppLayout>
  )
}
