import { useState } from 'react'
import { adminApi } from '../../api/adminApi'

export default function SystemReports() {
  const [params, setParams] = useState({ category: 'users', from: '', to: '', userType: '' })
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  const generate = async e => {
    e.preventDefault()
    setError('')
    try {
      const res = await adminApi.getReport(params)
      setReport(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid filter. Please enter valid criteria.')
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>System Reports</h2>
      <form onSubmit={generate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <select value={params.category} onChange={e => setParams(p => ({ ...p, category: e.target.value }))}
          style={{ padding: 8 }}>
          <option value="users">Users</option>
          <option value="jobs">Jobs</option>
          <option value="ratings">Ratings</option>
          <option value="analytics">Analytics</option>
        </select>
        <input type="date" value={params.from} onChange={e => setParams(p => ({ ...p, from: e.target.value }))}
          style={{ padding: 8 }} placeholder="From" />
        <input type="date" value={params.to} onChange={e => setParams(p => ({ ...p, to: e.target.value }))}
          style={{ padding: 8 }} placeholder="To" />
        <button type="submit" style={{ padding: '8px 16px' }}>Generate Report</button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {report && (
        <div>
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 6 }}>
            {JSON.stringify(report, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
