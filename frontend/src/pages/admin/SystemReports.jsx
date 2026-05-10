import { useEffect, useState } from 'react'
import { adminApi } from '../../api/adminApi'
import AppLayout from '../../components/common/AppLayout'
import { FileText, Calendar, AlertCircle, Loader2, Download, History, ChevronDown, ChevronUp, Search } from 'lucide-react'

const CATEGORIES = [
  { value: 'users', label: 'Users', description: 'Shows candidate and employer accounts with status, ratings, and activity totals.' },
  { value: 'jobs', label: 'Jobs', description: 'Lists job postings with employer, location, shift, status, and posting dates.' },
  { value: 'ratings', label: 'Ratings', description: 'Summarizes review counts, average ratings, and rating records in the selected range.' },
  { value: 'ats', label: 'ATS', description: 'Reports platform ATS average, job averages, top candidates, and below-threshold matches.' },
  { value: 'analytics', label: 'Analytics', description: 'Gives a high-level operational snapshot across users, jobs, interviews, reviews, and ATS.' },
  { value: 'notifications', label: 'Notifications', description: 'Displays email invitation and reminder delivery logs with sent or failed status.' },
]

const TODAY = new Date().toISOString().split('T')[0]

function StatCard({ label, value }) {
  return (
    <div style={{ padding: '14px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.7rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#E8EAF0' }}>{value}</span>
    </div>
  )
}

function ReportTable({ records }) {
  if (!records || records.length === 0) return null
  const keys = Object.keys(records[0])
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {keys.map(k => (
              <th key={k} style={{ padding: '9px 14px', textAlign: 'left', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem', whiteSpace: 'nowrap' }}>
                {k.replace(/([A-Z])/g, ' $1').trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {keys.map(k => (
                <td key={k} style={{ padding: '9px 14px', color: '#9CA3AF', whiteSpace: 'nowrap', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row[k] === true ? 'Yes' : row[k] === false ? 'No' : row[k] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReportSection({ label, color, records }) {
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          <span style={{ fontSize: '0.72rem', color: '#4B5563' }}>— {records.length} record{records.length !== 1 ? 's' : ''}</span>
        </div>
      )}
      {records.length === 0
        ? <p style={{ color: '#4B5563', fontSize: '0.82rem', margin: '0 0 16px' }}>No records found.</p>
        : <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden', marginBottom: label ? 0 : 0 }}>
            <ReportTable records={records} />
          </div>
      }
    </div>
  )
}

function HistoryRow({ entry }) {
  const [expanded, setExpanded] = useState(false)
  let parsedData = null
  try { parsedData = JSON.parse(entry.data) } catch { parsedData = null }

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 16px', cursor: 'pointer' }} onClick={() => setExpanded(x => !x)}>
        <span style={{ padding: '2px 10px', borderRadius: 9999, background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.15)', color: '#2EE5B0', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
          {entry.reportType}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#6B7280', flex: 1 }}>
          {entry.dateRangeFrom || '—'} → {entry.dateRangeTo || '—'}
        </span>
        <span style={{ fontSize: '0.72rem', color: '#4B5563', whiteSpace: 'nowrap' }}>
          {new Date(entry.generatedAt).toLocaleString()}
        </span>
        {expanded ? <ChevronUp size={13} style={{ color: '#4B5563', flexShrink: 0 }} /> : <ChevronDown size={13} style={{ color: '#4B5563', flexShrink: 0 }} />}
      </div>
      {expanded && parsedData && (
        <div style={{ padding: '0 16px 14px' }}>
          {parsedData.records
            ? <ReportTable records={parsedData.records} />
            : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {Object.entries(parsedData).map(([k, v]) => (
                  typeof v !== 'object' && <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v} />
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  )
}

export default function SystemReports() {
  const [params, setParams]     = useState({ category: 'users', from: '', to: '', userType: '', atsThreshold: 50 })
  const [report, setReport]     = useState(null)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [exporting, setExporting] = useState(false)
  const [history, setHistory]   = useState([])
  const [historyFilter, setHistoryFilter] = useState('')
  const [historyLoading, setHistoryLoading] = useState(false)
  const [tableFilter, setTableFilter] = useState('')
  const [notifLogs, setNotifLogs] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifGenerated, setNotifGenerated] = useState(false)

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await adminApi.getReportHistory()
      setHistory(res.data.data)
    } catch {
      // non-critical
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => { loadHistory() }, [])

  useEffect(() => {
    if (params.category !== 'notifications') return
    setNotifLoading(true)
    adminApi.getNotificationLogs()
      .then(res => setNotifLogs(res.data.data ?? []))
      .catch(() => setNotifLogs([]))
      .finally(() => setNotifLoading(false))
  }, [params.category])

  const filterRecords = (arr) =>
    tableFilter.trim()
      ? arr.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(tableFilter.toLowerCase())))
      : arr

  const exportCsv = async () => {
    if (params.category === 'notifications') {
      if (notifLogs.length === 0) { setError('No notification logs to export.'); return }
      const headers = ['id', 'recipientEmail', 'eventType', 'status', 'sentAt', 'errorMessage']
      const rows = notifLogs.map(log =>
        headers.map(h => `"${String(log[h] ?? '').replace(/"/g, '""')}"`).join(',')
      )
      const csv = [headers.join(','), ...rows].join('\n')
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'report-notifications.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    if (!report) { setError('Generate a report first.'); return }
    setExporting(true)
    setError('')
    try {
      const res = await adminApi.exportReport(params)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${params.category}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not export report.')
    } finally {
      setExporting(false)
    }
  }

  const generate = async e => {
    e.preventDefault()
    setError('')

    if (params.category === 'notifications') {
      setNotifLoading(true)
      try {
        const res = await adminApi.getNotificationLogs()
        setNotifLogs(res.data.data ?? [])
        setNotifGenerated(true)
      } catch {
        setError('Could not load notification logs.')
      } finally {
        setNotifLoading(false)
      }
      return
    }

    if (params.from && params.from > TODAY) {
      setError('The "From" date cannot be in the future.')
      return
    }
    if (params.to && params.to > TODAY) {
      setError('The "To" date cannot be in the future.')
      return
    }
    if (params.from && params.to && params.from > params.to) {
      setError('"From" date must be before "To" date.')
      return
    }

    setReport(null)
    setTableFilter('')
    setLoading(true)
    try {
      const res = await adminApi.getReport(params)
      setReport(res.data.data)
      loadHistory()
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

  const summaryKeys = report ? Object.entries(report).filter(([, v]) => v !== null && typeof v !== 'object') : []
  const records     = report?.records  // used only by jobs report
  const activeCategory = CATEGORIES.find(c => c.value === params.category)

  const filteredHistory = historyFilter
    ? history.filter(h => h.reportType === historyFilter)
    : history

  return (
    <>
      {/* Floating error */}
      {error && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#FCA5A5', fontSize: '0.82rem', fontWeight: 500,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      <AppLayout>
        <div className="page-header">
          <h1 className="page-title">System Reports</h1>
          <p className="page-subtitle">Generate platform-wide reports by category and date range.</p>
        </div>

        <div style={{ maxWidth: 700 }}>
          <form onSubmit={generate}>
            <div className="app-card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Category tabs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Report Category
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(({ value, label }) => {
                    const active = params.category === value
                    return (
                      <button key={value} type="button" onClick={() => { setParams(p => ({ ...p, category: value, userType: '' })); setReport(null); setError(''); setNotifGenerated(false) }}
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
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.7rem', color: '#4B5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Description
                  </p>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#9CA3AF', lineHeight: 1.5 }}>
                    {activeCategory?.description}
                  </p>
                </div>
              </div>

              {/* UserType sub-filter (users category only) */}
              {params.category === 'users' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    User Type
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['', 'All'], ['CANDIDATE', 'Candidates'], ['EMPLOYER', 'Employers']].map(([val, lbl]) => {
                      const active = params.userType === val
                      return (
                        <button key={val} type="button" onClick={() => setParams(p => ({ ...p, userType: val }))}
                          style={{
                            padding: '6px 14px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 500,
                            border: `1px solid ${active ? 'rgba(129,140,248,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            background: active ? 'rgba(129,140,248,0.1)' : 'transparent',
                            color: active ? '#818CF8' : '#6B7280', cursor: 'pointer', transition: 'all 0.18s',
                          }}>
                          {lbl}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {(params.category === 'ats' || params.category === 'analytics') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>ATS Threshold</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={params.atsThreshold}
                    onChange={e => setParams(p => ({ ...p, atsThreshold: Number(e.target.value) }))}
                    style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#9CA3AF', padding: '8px 12px', fontSize: '0.82rem', outline: 'none', width: 120 }}
                  />
                </div>
              )}

              {/* Date range */}
              <div className="two-col-grid" style={{ gap: 14 }}>
                {[['from', 'From'], ['to', 'To']].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>{label}</label>
                    <div style={{ position: 'relative' }}>
                      <Calendar size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
                      <input type="date" value={params[key]}
                        max={TODAY}
                        onChange={e => setParams(p => ({ ...p, [key]: e.target.value }))}
                        style={{ ...inputStyle, width: '100%' }} />
                    </div>
                  </div>
                ))}
              </div>

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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

              {/* Summary stat cards */}
              {summaryKeys.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
                  {summaryKeys.map(([k, v]) => (
                    <StatCard key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} value={v} />
                  ))}
                </div>
              )}

              {/* Table filter */}
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4B5563', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={tableFilter}
                  onChange={e => setTableFilter(e.target.value)}
                  style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '7px 12px 7px 30px', fontSize: '0.82rem', outline: 'none', width: '100%' }}
                />
              </div>

              {/* Grouped records (users / ratings) */}
              {report.candidateRecords !== undefined && (
                <ReportSection
                  label="Candidates"
                  color="#2EE5B0"
                  records={filterRecords(report.candidateRecords)}
                />
              )}
              {report.employerRecords !== undefined && (
                <ReportSection
                  label="Employers"
                  color="#818CF8"
                  records={filterRecords(report.employerRecords)}
                  style={{ marginTop: report.candidateRecords !== undefined ? 20 : 0 }}
                />
              )}

              {/* Flat records (jobs) */}
              {records !== undefined && (
                <ReportSection label="" color="#6B7280" records={filterRecords(records)} />
              )}

              {report.topCandidates !== undefined && (
                <ReportSection label="Top Candidates" color="#2EE5B0" records={filterRecords(report.topCandidates)} />
              )}

              {report.belowThresholdCandidates !== undefined && (
                <ReportSection label="Below Threshold" color="#F59E0B" records={filterRecords(report.belowThresholdCandidates)} />
              )}
            </div>
          )}

          {/* Notifications panel */}
          {params.category === 'notifications' && (
            <div className="app-card" style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: 0 }}>
                  All email notification events — invitations and reminders.
                </p>
                {notifGenerated && notifLogs.length > 0 && (
                  <button onClick={exportCsv}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: '#6B7280', fontSize: '0.75rem', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
                    onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
                    <Download size={12} /> Export CSV
                  </button>
                )}
              </div>
              {notifLoading ? (
                <div style={{ color: '#4B5563', fontSize: '0.85rem' }}>Loading...</div>
              ) : notifLogs.length === 0 ? (
                <div style={{ color: '#4B5563', fontSize: '0.85rem', textAlign: 'center', padding: '32px 0' }}>No notification logs yet.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1F2937' }}>
                        {['Recipient', 'Event', 'Status', 'Sent At', 'Error'].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: '#6B7280', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {notifLogs.map(log => (
                        <tr key={log.id} style={{ borderBottom: '1px solid #111827' }}>
                          <td style={{ padding: '8px 10px', color: '#9CA3AF' }}>{log.recipientEmail}</td>
                          <td style={{ padding: '8px 10px', color: '#9CA3AF' }}>{log.eventType}</td>
                          <td style={{ padding: '8px 10px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                              background: log.status === 'SENT' ? '#2EE5B015' : log.status === 'FAILED' ? '#EF444415' : '#F59E0B15',
                              color:      log.status === 'SENT' ? '#2EE5B0'   : log.status === 'FAILED' ? '#EF4444'   : '#F59E0B',
                              border: `1px solid ${log.status === 'SENT' ? '#2EE5B030' : log.status === 'FAILED' ? '#EF444430' : '#F59E0B30'}`,
                            }}>
                              {log.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px 10px', color: '#6B7280' }}>
                            {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#EF4444', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {log.errorMessage ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Report History */}
          <div style={{ marginTop: 36 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <History size={15} style={{ color: '#2EE5B0' }} />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#E8EAF0', margin: 0 }}>Previously Generated Reports</h2>
              </div>
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
                style={{ background: '#0A0C0E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#9CA3AF', padding: '6px 10px', fontSize: '0.78rem', outline: 'none' }}>
                <option value="">All Categories</option>
                {CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>

            {historyLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', fontSize: '0.82rem', padding: '12px 0' }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Loading history...
              </div>
            )}

            {!historyLoading && filteredHistory.length === 0 && (
              <p style={{ color: '#4B5563', fontSize: '0.82rem' }}>No reports generated yet.</p>
            )}

            {!historyLoading && filteredHistory.length > 0 && (
              <div className="app-card" style={{ padding: 0, overflow: 'hidden' }}>
                {filteredHistory.map(entry => (
                  <HistoryRow key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  )
}
