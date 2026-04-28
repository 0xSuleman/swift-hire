import { useEffect, useState } from 'react'
import { adminApi } from '../../api/adminApi'
import AppLayout from '../../components/common/AppLayout'
import {
  Search, Star, ShieldCheck, ShieldOff, Trash2, Loader2, AlertCircle,
  CheckCircle2, Filter, ClipboardList, X, UserX, Eye, MapPin, Clock,
  Monitor, Briefcase, Building2
} from 'lucide-react'

const ROLE_COLOR   = { CANDIDATE: '#2EE5B0', EMPLOYER: '#818CF8', ADMIN: '#F59E0B' }
const STATUS_COLOR = { ACTIVE: '#2EE5B0', BANNED: '#EF4444', DEACTIVATED: '#6B7280' }
const SLOT_STATUS_COLOR = { PENDING: '#F59E0B', CONFIRMED: '#2EE5B0', COMPLETED: '#6B7280', CANCELLED: '#EF4444' }

function ProfileModal({ userId, onClose }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('profile')

  const [interviews, setInterviews]               = useState(null)
  const [interviewsLoading, setInterviewsLoading] = useState(false)
  const [reviews, setReviews]                     = useState(null)
  const [reviewsLoading, setReviewsLoading]       = useState(false)
  const [activity, setActivity]                   = useState(null)
  const [activityLoading, setActivityLoading]     = useState(false)

  useEffect(() => {
    adminApi.getUserDetail(userId)
      .then(res => setDetail(res.data.data))
      .finally(() => setLoading(false))
  }, [userId])

  const switchTab = (t) => {
    setTab(t)
    if (t === 'interviews' && interviews === null) {
      setInterviewsLoading(true)
      adminApi.getUserInterviews(userId)
        .then(res => setInterviews(res.data.data))
        .finally(() => setInterviewsLoading(false))
    }
    if (t === 'reviews' && reviews === null) {
      setReviewsLoading(true)
      adminApi.getUserReviews(userId)
        .then(res => setReviews(res.data.data))
        .finally(() => setReviewsLoading(false))
    }
    if (t === 'activity' && activity === null) {
      setActivityLoading(true)
      adminApi.getUserActivity(userId)
        .then(res => setActivity(res.data.data))
        .finally(() => setActivityLoading(false))
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#13171B', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '85vh', overflowY: 'auto', padding: 28 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#E8EAF0' }}>User Profile</h2>
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

        {!loading && detail && (
          <>
            {/* Name + badges */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 700, color: '#E8EAF0' }}>{detail.name}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 10px', borderRadius: 9999, background: `${ROLE_COLOR[detail.role]}15`, color: ROLE_COLOR[detail.role], fontSize: '0.72rem', fontWeight: 600 }}>
                  {detail.role}
                </span>
                <span style={{ padding: '2px 10px', borderRadius: 9999, background: `${STATUS_COLOR[detail.status]}15`, color: STATUS_COLOR[detail.status], fontSize: '0.72rem', fontWeight: 600 }}>
                  {detail.status}
                </span>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 18 }}>
              {['profile', 'interviews', 'reviews', 'activity'].map(t => (
                <button key={t} onClick={() => switchTab(t)}
                  style={{
                    padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: tab === t ? 600 : 400,
                    color: tab === t ? '#2EE5B0' : '#6B7280',
                    borderBottom: tab === t ? '2px solid #2EE5B0' : '2px solid transparent',
                    marginBottom: -1, textTransform: 'capitalize', transition: 'color 0.18s',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            {/* ── Profile tab ── */}
            {tab === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Row icon={<Search size={13} />} label="Email" value={detail.email} />
                  <Row icon={<Star size={13} />} label="Rating" value={`${detail.averageRating?.toFixed(1)} (${detail.totalRatings} review${detail.totalRatings !== 1 ? 's' : ''})`} />
                  {detail.createdAt && <Row icon={<Clock size={13} />} label="Member since" value={new Date(detail.createdAt).toLocaleDateString()} />}
                </div>

                {detail.role === 'CANDIDATE' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Divider label="Candidate Details" />
                    {detail.hiredCompanyName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.2)' }}>
                        <CheckCircle2 size={13} style={{ color: '#2EE5B0', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.78rem', color: '#2EE5B0', fontWeight: 600 }}>
                          Hired by {detail.hiredCompanyName} — {detail.hiredJobTitle}
                        </span>
                      </div>
                    )}
                    {detail.preferredLocation && <Row icon={<MapPin size={13} />} label="Location" value={detail.preferredLocation} />}
                    {detail.preferredShift    && <Row icon={<Clock size={13} />} label="Shift" value={detail.preferredShift} />}
                    {detail.workType          && <Row icon={<Monitor size={13} />} label="Work type" value={detail.workType} />}
                    {detail.profileViews != null && <Row icon={<Eye size={13} />} label="Profile views" value={detail.profileViews} />}
                    {detail.parsedSkills && (
                      <div>
                        <p style={{ margin: '4px 0 8px', fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {detail.parsedSkills.split(',').filter(Boolean).map(s => (
                            <span key={s} style={{ padding: '3px 10px', borderRadius: 9999, background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.15)', color: '#2EE5B0', fontSize: '0.73rem' }}>
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detail.role === 'EMPLOYER' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Divider label="Employer Details" />
                    {detail.companyName     && <Row icon={<Building2 size={13} />} label="Company" value={detail.companyName} />}
                    {detail.companyLocation && <Row icon={<MapPin size={13} />} label="Location" value={detail.companyLocation} />}
                    {detail.jobCount != null && <Row icon={<Briefcase size={13} />} label="Job postings" value={detail.jobCount} />}
                  </div>
                )}
              </div>
            )}

            {/* ── Interviews tab ── */}
            {tab === 'interviews' && (
              <div>
                {interviewsLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                    <Loader2 size={18} style={{ color: '#2EE5B0', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {!interviewsLoading && interviews !== null && interviews.length === 0 && (
                  <p style={{ color: '#4B5563', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>No interviews scheduled.</p>
                )}
                {!interviewsLoading && interviews && interviews.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {interviews.map(slot => {
                      const sc = SLOT_STATUS_COLOR[slot.status] ?? '#6B7280'
                      return (
                        <div key={slot.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: '0 0 2px', fontSize: '0.85rem', fontWeight: 600, color: '#E8EAF0' }}>
                                {detail.role === 'CANDIDATE' ? slot.jobTitle : slot.candidateName}
                              </p>
                              <p style={{ margin: '0 0 6px', fontSize: '0.75rem', color: '#6B7280' }}>
                                {detail.role === 'CANDIDATE' ? slot.companyName : `${slot.candidateEmail} · ${slot.jobTitle}`}
                              </p>
                              <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                                {new Date(slot.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                {' → '}
                                {new Date(slot.endTime).toLocaleTimeString([], { timeStyle: 'short' })}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                              <span style={{ padding: '2px 8px', borderRadius: 9999, background: `${sc}18`, border: `1px solid ${sc}30`, color: sc, fontSize: '0.68rem', fontWeight: 600 }}>
                                {slot.status}
                              </span>
                              {slot.calendlyLink && (
                                <a href={slot.calendlyLink} target="_blank" rel="noreferrer"
                                  style={{ fontSize: '0.7rem', color: '#4B5563', textDecoration: 'none' }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#2EE5B0'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}>
                                  Join ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Reviews tab ── */}
            {tab === 'reviews' && (
              <div>
                {reviewsLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                    <Loader2 size={18} style={{ color: '#2EE5B0', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {!reviewsLoading && reviews !== null && reviews.length === 0 && (
                  <p style={{ color: '#4B5563', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>No reviews yet.</p>
                )}
                {!reviewsLoading && reviews && reviews.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {reviews.map(r => (
                      <div key={r.id} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#E8EAF0' }}>{r.raterName}</span>
                            <span style={{ padding: '1px 7px', borderRadius: 9999, background: `${ROLE_COLOR[r.raterRole] ?? '#6B7280'}15`, color: ROLE_COLOR[r.raterRole] ?? '#6B7280', fontSize: '0.65rem', fontWeight: 600 }}>
                              {r.raterRole}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 2, marginBottom: r.comment ? 6 : 0 }}>
                          {[1,2,3,4,5].map(n => (
                            <Star key={n} size={13} style={{ color: '#F59E0B', fill: n <= r.ratingValue ? '#F59E0B' : 'none' }} />
                          ))}
                        </div>
                        {r.comment && <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF', lineHeight: 1.5 }}>{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Activity tab ── */}
            {tab === 'activity' && (
              <div>
                {activityLoading && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                    <Loader2 size={18} style={{ color: '#2EE5B0', animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
                {!activityLoading && activity !== null && activity.length === 0 && (
                  <p style={{ color: '#4B5563', fontSize: '0.85rem', textAlign: 'center', padding: '24px 0' }}>No activity recorded.</p>
                )}
                {!activityLoading && activity && activity.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activity.map((ev, i) => {
                      const dot = ev.type === 'REGISTERED' ? '#2EE5B0'
                                : ev.type === 'JOB_POSTED'  ? '#818CF8'
                                : '#F59E0B'
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, marginTop: 5 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 2px', fontSize: '0.82rem', color: '#9CA3AF' }}>{ev.label}</p>
                            <p style={{ margin: 0, fontSize: '0.72rem', color: '#4B5563' }}>{new Date(ev.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ color: '#4B5563', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '0.78rem', color: '#6B7280', minWidth: 90 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>{value}</span>
    </div>
  )
}

function Divider({ label }) {
  return (
    <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
      {label}
    </p>
  )
}

export default function ManageUsers() {
  const [users, setUsers]         = useState([])
  const [filter, setFilter]       = useState({ role: '', maxRating: '', status: '', search: '' })
  const [toast, setToast]         = useState({ msg: '', type: 'ok' })
  const [loading, setLoading]     = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [logsLoading, setLogsLoading]   = useState(false)
  const [confirmDeleteId, setConfirmDeleteId]         = useState(null)
  const [confirmBlockId, setConfirmBlockId]           = useState(null)
  const [confirmDeactivateId, setConfirmDeactivateId] = useState(null)
  const [viewingId, setViewingId] = useState(null)

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000)
  }

  const doSearch = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.role)      params.role = filter.role
      if (filter.maxRating) params.maxRating = filter.maxRating
      if (filter.status)    params.status = filter.status
      if (filter.search)    params.search = filter.search
      const res = await adminApi.getUsers(params)
      setUsers(res.data.data)
    } catch (err) {
      notify(err.response?.data?.message || 'Search failed.', 'err')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const searchWith = async (patch) => {
    const merged = { ...filter, ...patch }
    setFilter(merged)
    setLoading(true)
    try {
      const params = {}
      if (merged.role)      params.role = merged.role
      if (merged.maxRating) params.maxRating = merged.maxRating
      if (merged.status)    params.status = merged.status
      if (merged.search)    params.search = merged.search
      const res = await adminApi.getUsers(params)
      setUsers(res.data.data)
    } catch (err) {
      notify(err.response?.data?.message || 'Search failed.', 'err')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (userId, action) => {
    setConfirmBlockId(null)
    setConfirmDeactivateId(null)
    try {
      await adminApi.updateStatus(userId, action)
      notify('User status updated successfully.')
      doSearch()
      loadAuditLogs()
    } catch (err) {
      notify(err.response?.data?.message || 'Action failed.', 'err')
    }
  }

  const loadAuditLogs = async () => {
    setLogsLoading(true)
    try {
      const res = await adminApi.getAuditLogs()
      setAuditLogs(res.data.data)
    } catch {
      // non-critical
    } finally {
      setLogsLoading(false)
    }
  }

  const deleteUser = async (userId) => {
    try {
      await adminApi.deleteUser(userId)
      setUsers(prev => prev.filter(u => u.id !== userId))
      setConfirmDeleteId(null)
      notify('User permanently deleted.')
      loadAuditLogs()
    } catch (err) {
      setConfirmDeleteId(null)
      notify(err.response?.data?.message || 'Failed to delete user.', 'err')
    }
  }

  const deleteAuditLog = async (id) => {
    try {
      await adminApi.deleteAuditLog(id)
      setAuditLogs(logs => logs.filter(l => l.id !== id))
    } catch {
      notify('Failed to delete log entry.', 'err')
    }
  }

  useEffect(() => { doSearch(); loadAuditLogs() }, [])

  return (
    <>
      {viewingId && <ProfileModal userId={viewingId} onClose={() => setViewingId(null)} />}

      {/* Floating toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
          background: toast.type === 'ok' ? 'rgba(46,229,176,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(46,229,176,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: toast.type === 'ok' ? '#2EE5B0' : '#FCA5A5', fontSize: '0.82rem', fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', animation: 'slideDown 0.25s ease forwards',
          whiteSpace: 'nowrap',
        }}>
          {toast.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <AppLayout>
        <div className="page-header">
          <h1 className="page-title">Manage Users</h1>
          <p className="page-subtitle">Search, filter and manage all platform accounts.</p>
        </div>

        {/* Filters */}
        <div className="app-card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={13} style={{ color: '#4B5563' }} />
            <span style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filters</span>
          </div>

          {/* Name/email search */}
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
            <input
              type="text" placeholder="Name or email"
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px 7px 28px', fontSize: '0.82rem', outline: 'none', width: 170 }} />
          </div>

          <select value={filter.role} onChange={e => searchWith({ role: e.target.value })}
            style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px', fontSize: '0.82rem', outline: 'none' }}>
            <option value="">All Roles</option>
            <option value="CANDIDATE">Candidate</option>
            <option value="EMPLOYER">Employer</option>
          </select>

          <select value={filter.status} onChange={e => searchWith({ status: e.target.value })}
            style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px', fontSize: '0.82rem', outline: 'none' }}>
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Banned</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>

          <div style={{ position: 'relative' }}>
            <Star size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4B5563' }} />
            <input type="number" min="0" max="5" step="0.1" placeholder="Max rating"
              value={filter.maxRating}
              onChange={e => setFilter(f => ({ ...f, maxRating: e.target.value }))}
              onBlur={e => searchWith({ maxRating: e.target.value })}
              style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px 7px 28px', fontSize: '0.82rem', outline: 'none', width: 130 }} />
          </div>

          <button onClick={doSearch}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.2)', color: '#2EE5B0', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
            <Search size={13} /> Search
          </button>
        </div>

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '20px 0' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
          </div>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {users.length === 0 && (
              <p style={{ color: '#4B5563', fontSize: '0.875rem', padding: '20px 0' }}>No users found matching the criteria.</p>
            )}
            {users.map(u => (
              <div key={u.id} className="app-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${ROLE_COLOR[u.role]}18`, border: `1px solid ${ROLE_COLOR[u.role]}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: ROLE_COLOR[u.role] }}>
                    {u.name?.[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E8EAF0', margin: 0 }}>{u.name}</p>
                    <span style={{ padding: '1px 8px', borderRadius: 9999, background: `${ROLE_COLOR[u.role]}15`, color: ROLE_COLOR[u.role], fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {u.role}
                    </span>
                    <span style={{ padding: '1px 8px', borderRadius: 9999, background: `${STATUS_COLOR[u.status]}15`, color: STATUS_COLOR[u.status], fontSize: '0.68rem', fontWeight: 600 }}>
                      {u.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#4B5563', margin: 0 }}>{u.email}</p>
                </div>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Star size={12} style={{ color: '#F59E0B', fill: '#F59E0B' }} />
                  <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{u.averageRating.toFixed(1)}</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>

                  {/* View profile */}
                  <button title="View profile" onClick={() => setViewingId(u.id)}
                    style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.15)', color: '#818CF8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(129,140,248,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(129,140,248,0.08)'}>
                    <Eye size={13} />
                  </button>

                  {/* Approve */}
                  <button title="Approve" onClick={() => updateStatus(u.id, 'approve')}
                    style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.15)', color: '#2EE5B0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,229,176,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(46,229,176,0.08)'}>
                    <ShieldCheck size={13} />
                  </button>

                  {/* Block — with confirmation */}
                  {confirmBlockId === u.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#FCA5A5', whiteSpace: 'nowrap' }}>Block this user?</span>
                      <button onClick={() => updateStatus(u.id, 'block')}
                        style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        Yes
                      </button>
                      <button onClick={() => setConfirmBlockId(null)}
                        style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button title="Block" onClick={() => setConfirmBlockId(u.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                      <ShieldOff size={13} />
                    </button>
                  )}

                  {/* Deactivate — with confirmation */}
                  {confirmDeactivateId === u.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.2)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>Deactivate user?</span>
                      <button onClick={() => updateStatus(u.id, 'delete')}
                        style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(107,114,128,0.2)', border: '1px solid rgba(107,114,128,0.3)', color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        Yes
                      </button>
                      <button onClick={() => setConfirmDeactivateId(null)}
                        style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#6B7280', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button title="Deactivate" onClick={() => setConfirmDeactivateId(u.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,114,128,0.15)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,114,128,0.08)'}>
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Permanent delete */}
                  {confirmDeleteId === u.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#FCA5A5', whiteSpace: 'nowrap' }}>Permanently delete?</span>
                      <button onClick={() => deleteUser(u.id)}
                        style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        Yes
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.2)', color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button title="Delete user permanently" onClick={() => setConfirmDeleteId(u.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.14)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}>
                      <UserX size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Audit Log */}
        <div style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClipboardList size={15} style={{ color: '#2EE5B0' }} />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EAF0', margin: 0 }}>Audit Log</h2>
            <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>— admin actions on user accounts</span>
          </div>

          {logsLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '12px 0', fontSize: '0.82rem' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading logs...
            </div>
          )}

          {!logsLoading && auditLogs.length === 0 && (
            <p style={{ color: '#4B5563', fontSize: '0.82rem' }}>No audit entries yet.</p>
          )}

          {!logsLoading && auditLogs.length > 0 && (
            <div className="app-card" style={{ overflow: 'auto', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Time', 'Admin', 'Action', 'Target ID', 'Target Email', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => {
                    const actionColor = log.action === 'APPROVE' ? '#2EE5B0' : log.action === 'BLOCK' ? '#EF4444' : '#6B7280'
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '9px 16px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                          {new Date(log.performedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '9px 16px', color: '#9CA3AF' }}>{log.adminEmail}</td>
                        <td style={{ padding: '9px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 9999, background: `${actionColor}15`, color: actionColor, fontWeight: 600, fontSize: '0.7rem' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '9px 16px', color: '#6B7280' }}>{log.targetUserId}</td>
                        <td style={{ padding: '9px 16px', color: '#9CA3AF' }}>{log.targetEmail}</td>
                        <td style={{ padding: '9px 16px' }}>
                          <button
                            onClick={() => deleteAuditLog(log.id)}
                            title="Delete entry"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.18s, background 0.18s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.background = 'none' }}
                          >
                            <X size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  )
}
