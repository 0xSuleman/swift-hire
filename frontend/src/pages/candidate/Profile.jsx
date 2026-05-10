import { useEffect, useRef, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/common/AppLayout'
import {
  User, Mail, Phone, MapPin, Upload, CheckCircle2,
  AlertCircle, Loader2, Eye, Briefcase, Sun, Moon, Monitor,
  X, Plus, PenLine,
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

const splitSkills = (value) =>
  (value || '').split(',').map(s => s.trim()).filter(Boolean)

const inputStyle = {
  background: '#0A0C0E',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10,
  color: '#E8EAF0',
  padding: '9px 12px 9px 38px',
  fontSize: '0.85rem',
  outline: 'none',
  width: '100%',
}

export default function Profile() {
  const { login } = useAuth()
  const fieldRefs = useRef({})
  const skillInputRef = useRef(null)
  const [profile, setProfile]   = useState(null)
  const [fetchError, setFetchError] = useState(false)
  const [file, setFile]         = useState(null)
  const [prefs, setPrefs]       = useState({ location: '', shift: '', workType: '' })
  const [infoForm, setInfoForm] = useState({ name: '', email: '', phoneNo: '' })
  const [editingFields, setEditingFields] = useState({})
  const [savingField, setSavingField] = useState('')
  const [skills, setSkills]     = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [showSkillInput, setShowSkillInput] = useState(false)
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
        setInfoForm({
          name: res.data.data.name || '',
          email: res.data.data.email || '',
          phoneNo: res.data.data.phoneNo || '',
        })
        setSkills(splitSkills(res.data.data.parsedSkills))
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
      setSkills(splitSkills(res.data.data.parsedSkills))
    } catch (err) {
      notify(err.response?.data?.message || 'Upload failed.', 'err')
    } finally {
      setCvLoading(false)
    }
  }

  const applyProfileUpdateResponse = (res) => {
    const data = res.data.data
    if (data?.token && data?.user) {
      login(data.user, data.token)
    }
    if (data?.profile) {
      setProfile(data.profile)
      setInfoForm({
        name: data.profile.name || '',
        email: data.profile.email || '',
        phoneNo: data.profile.phoneNo || '',
      })
      setSkills(splitSkills(data.profile.parsedSkills))
    }
    return data?.profile
  }

  const beginEdit = (key) => {
    setEditingFields(fields => ({ ...fields, [key]: true }))
    window.setTimeout(() => fieldRefs.current[key]?.focus(), 0)
  }

  const saveProfileField = async (key) => {
    if (!editingFields[key]) return
    const nextValue = (infoForm[key] || '').trim()
    const currentValue = (profile?.[key] || '').trim()
    if (nextValue === currentValue) {
      setEditingFields(fields => ({ ...fields, [key]: false }))
      return
    }
    if ((key === 'name' || key === 'email') && !nextValue) {
      notify(`${key === 'name' ? 'Name' : 'Email'} cannot be empty.`, 'err')
      setInfoForm(form => ({ ...form, [key]: currentValue }))
      setEditingFields(fields => ({ ...fields, [key]: false }))
      return
    }
    setSavingField(key)
    try {
      const res = await candidateApi.updateProfile({ [key]: nextValue })
      const savedProfile = applyProfileUpdateResponse(res)
      if (!savedProfile) {
        const fresh = await candidateApi.getProfile()
        setProfile(fresh.data.data)
        setInfoForm({
          name: fresh.data.data.name || '',
          email: fresh.data.data.email || '',
          phoneNo: fresh.data.data.phoneNo || '',
        })
      }
      notify('Profile updated.')
    } catch (err) {
      setInfoForm(form => ({ ...form, [key]: currentValue }))
      notify(err.response?.data?.message || 'Failed to update profile.', 'err')
    } finally {
      setSavingField('')
      setEditingFields(fields => ({ ...fields, [key]: false }))
    }
  }

  const saveSkillsList = async (nextSkills) => {
    const normalized = nextSkills.map(s => s.trim()).filter(Boolean)
    setSkills(normalized)
    try {
      const res = await candidateApi.updateProfile({ parsedSkills: normalized.join(',') })
      const savedProfile = applyProfileUpdateResponse(res)
      if (!savedProfile) {
        const fresh = await candidateApi.getProfile()
        setProfile(fresh.data.data)
        setSkills(splitSkills(fresh.data.data.parsedSkills))
      }
      notify('Skills updated.')
    } catch (err) {
      setSkills(splitSkills(profile?.parsedSkills))
      notify(err.response?.data?.message || 'Failed to save skills.', 'err')
    }
  }

  const addSkill = async () => {
    const next = skillInput.trim()
    if (!next) {
      setShowSkillInput(false)
      return
    }
    const nextSkills = skills.some(s => s.toLowerCase() === next.toLowerCase()) ? skills : [...skills, next]
    setSkillInput('')
    if (nextSkills !== skills) await saveSkillsList(nextSkills)
    setShowSkillInput(false)
  }

  const openSkillInput = () => {
    setShowSkillInput(true)
    window.setTimeout(() => skillInputRef.current?.focus(), 0)
  }

  const removeSkill = (skill) => saveSkillsList(skills.filter(s => s !== skill))

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'name', Icon: User, label: 'Name', type: 'text', placeholder: 'Your full name' },
                { key: 'email', Icon: Mail, label: 'Email', type: 'email', placeholder: 'you@example.com' },
                { key: 'phoneNo', Icon: Phone, label: 'Phone', type: 'tel', placeholder: '+92-300-0000000' },
              ].map(({ key, Icon, label, type, placeholder }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#4B5563', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
                    <input
                      ref={node => { fieldRefs.current[key] = node }}
                      type={type}
                      readOnly={!editingFields[key] || savingField === key}
                      value={infoForm[key]}
                      placeholder={placeholder}
                      onChange={e => setInfoForm(f => ({ ...f, [key]: e.target.value }))}
                      onBlur={() => saveProfileField(key)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                      }}
                      style={{
                        ...inputStyle,
                        paddingRight: 46,
                        color: editingFields[key] ? '#E8EAF0' : '#9CA3AF',
                        cursor: editingFields[key] ? 'text' : 'default',
                      }}
                    />
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => beginEdit(key)}
                      disabled={savingField === key}
                      title={`Edit ${label.toLowerCase()}`}
                      style={{
                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                        width: 30, height: 30, borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: editingFields[key] ? 'rgba(46,229,176,0.08)' : 'rgba(255,255,255,0.04)',
                        color: editingFields[key] ? '#2EE5B0' : '#6B7280',
                        cursor: savingField === key ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {savingField === key ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <PenLine size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile views stat */}
            <div style={{ marginTop: 18, padding: '12px 14px', borderRadius: 10, background: 'rgba(46,229,176,0.05)', border: '1px solid rgba(46,229,176,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={14} style={{ color: '#2EE5B0' }} />
              <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>
                Profile viewed <span style={{ color: '#2EE5B0', fontWeight: 600 }}>{profile.profileViews}</span> time{profile.profileViews !== 1 ? 's' : ''} by employers
              </span>
            </div>
          </Section>

          {/* CV Upload */}
          <Section title="Add Skills">
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: '0 0 10px', fontWeight: 600 }}>
                Uploading a CV extracts your skills automatically for job matching.
              </p>
              {skills.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {skills.map(skill => (
                    <span key={skill} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px 3px 10px', borderRadius: 9999, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.2)', color: '#2EE5B0', fontSize: '0.75rem', fontWeight: 500 }}>
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)}
                        style={{ display: 'flex', background: 'none', border: 'none', color: '#2EE5B0', cursor: 'pointer', padding: 0 }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.82rem', color: '#4B5563', margin: '0 0 12px' }}>
                  No skills saved yet. Upload a PDF or add skills manually to enable job matching.
                </p>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {showSkillInput && (
                  <input
                    ref={skillInputRef}
                    className="animate-skill-input-reveal"
                    value={skillInput}
                    placeholder="Add skill"
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                    onBlur={addSkill}
                    style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#E8EAF0', padding: '8px 12px', fontSize: '0.82rem', outline: 'none', flex: 1, transition: 'border-color 0.2s ease, box-shadow 0.2s ease' }}
                  />
                )}
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={showSkillInput ? addSkill : openSkillInput}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
                    background: showSkillInput ? 'rgba(46,229,176,0.13)' : 'rgba(46,229,176,0.08)',
                    border: `1px solid ${showSkillInput ? 'rgba(46,229,176,0.32)' : 'rgba(46,229,176,0.2)'}`,
                    color: '#2EE5B0', fontSize: '0.8rem', cursor: 'pointer',
                    transform: showSkillInput ? 'translateX(0) scale(1.02)' : 'translateX(0) scale(1)',
                    boxShadow: showSkillInput ? '0 0 18px rgba(46,229,176,0.08)' : 'none',
                    transition: 'background 0.2s ease, border-color 0.2s ease, transform 0.18s ease, box-shadow 0.2s ease',
                  }}>
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

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
