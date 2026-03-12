import { useEffect, useState } from 'react'
import { adminApi } from '../../api/adminApi'
import AppLayout from '../../components/common/AppLayout'
import { Search, Star, ShieldCheck, ShieldOff, Trash2, Loader2, AlertCircle, CheckCircle2, Filter } from 'lucide-react'

const ROLE_COLOR   = { CANDIDATE: '#2EE5B0', EMPLOYER: '#818CF8', ADMIN: '#F59E0B' }
const STATUS_COLOR = { ACTIVE: '#2EE5B0', BANNED: '#EF4444', DEACTIVATED: '#6B7280' }

export default function ManageUsers() {
  const [users, setUsers]   = useState([])
  const [filter, setFilter] = useState({ role: '', maxRating: '', status: '' })
  const [toast, setToast]   = useState({ msg: '', type: 'ok' })
  const [loading, setLoading] = useState(false)

  const notify = (msg, type = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'ok' }), 4000)
  }

  const search = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.role)      params.role = filter.role
      if (filter.maxRating) params.maxRating = filter.maxRating
      if (filter.status)    params.status = filter.status
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
    try {
      await adminApi.updateStatus(userId, action)
      notify('User status updated successfully.')
      search()
    } catch (err) {
      notify(err.response?.data?.message || 'Action failed.', 'err')
    }
  }

  useEffect(() => { search() }, [])

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Manage Users</h1>
        <p className="page-subtitle">Search, filter and manage all platform accounts.</p>
      </div>

      {/* Toast */}
      {toast.msg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, marginBottom: 20,
          background: toast.type === 'ok' ? 'rgba(46,229,176,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${toast.type === 'ok' ? 'rgba(46,229,176,0.25)' : 'rgba(239,68,68,0.2)'}`,
          color: toast.type === 'ok' ? '#2EE5B0' : '#FCA5A5', fontSize: '0.82rem',
          animation: 'slideDown 0.25s ease forwards',
        }}>
          {toast.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div className="app-card" style={{ marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={13} style={{ color: '#4B5563' }} />
          <span style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filters</span>
        </div>

        <select value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
          style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px', fontSize: '0.82rem', outline: 'none' }}>
          <option value="">All Roles</option>
          <option value="CANDIDATE">Candidate</option>
          <option value="EMPLOYER">Employer</option>
        </select>

        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
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
            style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px 7px 28px', fontSize: '0.82rem', outline: 'none', width: 130 }} />
        </div>

        <button onClick={search}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.2)', color: '#2EE5B0', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}>
          <Search size={13} /> Search
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '20px 0' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
        </div>
      )}

      {/* User list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.length === 0 && (
            <p style={{ color: '#4B5563', fontSize: '0.875rem', padding: '20px 0' }}>No users found matching the criteria.</p>
          )}
          {users.map(u => (
            <div key={u.id} className="app-card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px' }}>

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
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button title="Approve" onClick={() => updateStatus(u.id, 'approve')}
                  style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(46,229,176,0.08)', border: '1px solid rgba(46,229,176,0.15)', color: '#2EE5B0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(46,229,176,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(46,229,176,0.08)'}>
                  <ShieldCheck size={13} />
                </button>
                <button title="Block" onClick={() => updateStatus(u.id, 'block')}
                  style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                  <ShieldOff size={13} />
                </button>
                <button title="Deactivate" onClick={() => updateStatus(u.id, 'delete')}
                  style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(107,114,128,0.08)', border: '1px solid rgba(107,114,128,0.15)', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,114,128,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,114,128,0.08)'}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
