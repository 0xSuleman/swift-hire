import { useState } from 'react'
import { adminApi } from '../../api/adminApi'
import AppLayout from '../../components/common/AppLayout'
import { FileText, Calendar, AlertCircle, Loader2, Download } from 'lucide-react'

const CATEGORIES = [
  { value: 'users',     label: 'Users' },
  { value: 'jobs',      label: 'Jobs' },
  { value: 'ratings',   label: 'Ratings' },
  { value: 'analytics', label: 'Analytics' },
]

export default function SystemReports() {
  const [params, setParams] = useState({ category: 'users', from: '', to: '' })
  const [report, setReport] = useState(null)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const exportCsv = async () => {
    setExporting(true)
    try {
      const res = await adminApi.exportReport(params)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${params.category}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Export failed. Generate a report first.')
    } finally {
      setExporting(false)
    }
  }

  const generate = async e => {
    e.preventDefault()
    setError('')
    if (params.from && params.to && params.from > params.to) {
      setError('"From" date must be before "To" date.')
      return
    }
    setReport(null)
    setLoading(true)
    try {
      const res = await adminApi.getReport(params)
      setReport(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid filter. Please enter valid criteria.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: '#9CA3AF', padding: '8px 12px 8px 36px',
    fontSize: '0.82rem', outline: 'none', colorScheme: 'dark',
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">System Reports</h1>
        <p className="page-subtitle">Generate platform-wide reports by category and date range.</p>
      </div>

      <div style={{ maxWidth: 680 }}>
        <form onSubmit={generate}>
          <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Category tabs */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Report Category
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {CATEGORIES.map(({ value, label }) => {
                  const active = params.category === value
                  return (
                    <button key={value} type="button" onClick={() => setParams(p => ({ ...p, category: value }))}
                      style={{
                        padding: '7px 16px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 500,
                        border: `1px solid ${active ? 'rgba(46,229,176,0.4)' : 'rgba(255,255,255,0.07)'}`,
                        background: active ? 'rgba(46,229,176,0.08)' : 'transparent',
                        color: active ? '#2EE5B0' : '#6B7280', cursor: 'pointer', transition: 'all 0.18s',
                      }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Date range */}
            <div className="two-col-grid" style={{ gap: 14 }}>
              {[['from', 'From'], ['to', 'To']].map(([key, label]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
                    <input type="date" value={params[key]}
                      onChange={e => setParams(p => ({ ...p, [key]: e.target.value }))}
                      style={{ ...inputStyle, width: '100%' }} />
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            <button type="submit" className="btn-teal" disabled={loading}>
              {loading
                ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating...
                  </span>
                : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <FileText size={15} /> Generate Report
                  </span>
              }
            </button>
          </div>
        </form>

        {/* Report output */}
        {report && (
          <div className="app-card" style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
                Report Output
              </p>
              <button onClick={exportCsv} disabled={exporting}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#6B7280', fontSize: '0.75rem', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
                onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
                <Download size={12} /> {exporting ? 'Exporting...' : 'Export CSV'}
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF', lineHeight: 1.7, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
