import { useEffect, useState } from 'react'
import { adminApi } from '../../api/adminApi'

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState({ role: '', maxRating: '', status: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const search = async () => {
    setLoading(true)
    setMessage('')
    try {
      const params = {}
      if (filter.role) params.role = filter.role
      if (filter.maxRating) params.maxRating = filter.maxRating
      if (filter.status) params.status = filter.status
      const res = await adminApi.getUsers(params)
      setUsers(res.data.data)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Search failed.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (userId, action) => {
    try {
      await adminApi.updateStatus(userId, action)
      setMessage(`User status updated successfully.`)
      search()
    } catch (err) {
      setMessage(err.response?.data?.message || 'Action failed.')
    }
  }

  useEffect(() => { search() }, [])

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: 24 }}>
      <h2>Manage Users</h2>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filter.role} onChange={e => setFilter(f => ({ ...f, role: e.target.value }))}
          style={{ padding: 8 }}>
          <option value="">All Roles</option>
          <option value="CANDIDATE">Candidate</option>
          <option value="EMPLOYER">Employer</option>
        </select>
        <input type="number" placeholder="Max Rating (e.g. 2)" value={filter.maxRating}
          onChange={e => setFilter(f => ({ ...f, maxRating: e.target.value }))}
          style={{ padding: 8, width: 160 }} />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          style={{ padding: 8 }}>
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BANNED">Banned</option>
        </select>
        <button onClick={search} style={{ padding: '8px 16px' }}>Search</button>
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {loading && <p>Loading...</p>}

      {users.map(u => (
        <div key={u.id} style={{ border: '1px solid #ddd', padding: 16, marginBottom: 8, borderRadius: 6 }}>
          <strong>{u.name}</strong> ({u.email}) — {u.role} — ⭐ {u.averageRating.toFixed(1)} — {u.status}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button onClick={() => updateStatus(u.id, 'approve')}>Approve</button>
            <button onClick={() => updateStatus(u.id, 'block')} style={{ color: 'red' }}>Block</button>
            <button onClick={() => updateStatus(u.id, 'delete')} style={{ color: 'grey' }}>Deactivate</button>
          </div>
        </div>
      ))}
    </div>
  )
}
