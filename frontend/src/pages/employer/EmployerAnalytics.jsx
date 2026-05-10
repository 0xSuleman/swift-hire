import { useEffect, useState } from 'react'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Star, Users, Clock, TrendingUp, Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
  PointElement, LineElement, Filler,
} from 'chart.js'
import { Bar, Doughnut, Pie, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, PointElement, LineElement, Filler)

const centerLabelPlugin = {
  id: 'centerLabel',
  afterDraw(chart) {
    if (chart.config.type !== 'doughnut') return
    const { ctx, chartArea: { left, top, width, height } } = chart
    const total = chart.data.datasets[0].data.reduce((a, b) => Number(a) + Number(b), 0)
    if (!total) return
    ctx.save()
    ctx.font = 'bold 22px sans-serif'
    ctx.fillStyle = '#E8EAF0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(total, left + width / 2, top + height / 2)
    ctx.restore()
  }
}

const darkGrid = {
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
    y: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' }, beginAtZero: true },
  },
}

const darkGridH = {
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' }, beginAtZero: true },
    y: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
  },
}

export default function EmployerAnalytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employerApi.getAnalytics()
      .then(res => setData(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <AppLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#4B5563', padding: '40px 0' }}>
        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading analytics...
      </div>
    </AppLayout>
  )

  const stats = [
    { label: 'Average Rating',   value: data?.averageRating?.toFixed(1) ?? '—', Icon: Star,       color: '#F59E0B', suffix: '/ 5' },
    { label: 'Total Reviews',    value: data?.totalRatings ?? 0,                Icon: Users,      color: '#818CF8', suffix: '' },
    { label: 'Average ATS',      value: data?.averageAtsScore ?? '—',           Icon: TrendingUp, color: '#2EE5B0', suffix: '%' },
    { label: 'Avg Time to Hire', value: data?.avgTimeToHireDays ?? '—',         Icon: Clock,      color: '#2EE5B0', suffix: 'days' },
    { label: 'Acceptance Rate',  value: data?.acceptanceRate ?? 0,              Icon: TrendingUp, color: '#34D399', suffix: '%' },
  ]

  const breakdown = data?.jobBreakdown ?? []
  const labels    = breakdown.map(j => j.jobTitle.length > 16 ? j.jobTitle.slice(0, 16) + '…' : j.jobTitle)

  // Chart 1 — Line: total vs accepted slots per job
  const slotsLine = {
    labels,
    datasets: [
      { label: 'Total Slots', data: breakdown.map(j => j.totalSlots),    borderColor: '#818CF8', backgroundColor: 'rgba(129,140,248,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#818CF8' },
      { label: 'Accepted',    data: breakdown.map(j => j.acceptedSlots), borderColor: '#2EE5B0', backgroundColor: 'rgba(46,229,176,0.08)',  borderWidth: 2, tension: 0.4, fill: true, pointRadius: 4, pointBackgroundColor: '#2EE5B0' },
    ],
  }

  // Chart 2 — Doughnut: acceptance rate
  const accepted  = data?.totalInterviews > 0 ? Math.round((data.acceptanceRate / 100) * data.totalInterviews) : 0
  const remaining = (data?.totalInterviews ?? 0) - accepted
  const acceptDoughnut = {
    labels: ['Accepted', 'Other'],
    datasets: [{ data: [accepted, remaining], backgroundColor: ['#2EE5B040', '#374151'], borderColor: ['#2EE5B0', '#4B5563'], borderWidth: 2 }],
  }

  // Chart 3 — Horizontal Bar: time-to-hire per job
  const timeBar = {
    labels,
    datasets: [{
      label: 'Days to Hire',
      data: breakdown.map(j => j.timeToHireDays ?? 0),
      backgroundColor: '#F59E0B40',
      borderColor: '#F59E0B',
      borderWidth: 2,
      borderRadius: 4,
    }],
  }

  // Chart 4 — Pie: job status distribution
  const statusCounts = data?.jobStatusCounts ?? {}
  const statusPie = {
    labels: ['Open', 'Closed', 'Archived'],
    datasets: [{
      data: [statusCounts.OPEN ?? 0, statusCounts.CLOSED ?? 0, statusCounts.ARCHIVED ?? 0],
      backgroundColor: ['#2EE5B040', '#818CF840', '#F59E0B40'],
      borderColor:     ['#2EE5B0',   '#818CF8',   '#F59E0B'],
      borderWidth: 2,
    }],
  }

  // Chart 5 — Bar: accepted slots per job (standalone)
  const acceptedBar = {
    labels,
    datasets: [{
      label: 'Accepted Slots',
      data: breakdown.map(j => j.acceptedSlots),
      backgroundColor: '#34D39940',
      borderColor: '#34D399',
      borderWidth: 2,
      borderRadius: 4,
    }],
  }

  // Chart 6 — Bar: ratings distribution (1★–5★)
  const ratingsBreakdown = data?.ratingsBreakdown ?? {}
  const ratingsBar = {
    labels: ['1★', '2★', '3★', '4★', '5★'],
    datasets: [{
      label: 'Reviews received',
      data: ['1★', '2★', '3★', '4★', '5★'].map(k => ratingsBreakdown[k] ?? 0),
      backgroundColor: ['#EF444430', '#F9731640', '#F59E0B40', '#34D39940', '#2EE5B040'],
      borderColor:     ['#EF4444',   '#F97316',   '#F59E0B',   '#34D399',   '#2EE5B0'],
      borderWidth: 2,
      borderRadius: 4,
    }],
  }

  const noData    = breakdown.length === 0
  const hasRatings = (data?.averageRating ?? 0) > 0

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Hiring Analytics</h1>
        <p className="page-subtitle">Overview of your company's hiring performance on Swift Hire.</p>
      </div>

      {noData && !hasRatings && (
        <div className="app-card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24, color: '#4B5563' }}>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>No Data Available</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#374151' }}>Post jobs and schedule interviews to see analytics here.</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {stats.map(({ label, value, Icon, color, suffix }) => (
          <div key={label} className="app-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: `0 0 18px ${color}25` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <p style={{ fontSize: '1.6rem', fontWeight: 700, color: '#E8EAF0', margin: '0 0 2px' }}>
              {value}{suffix && <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 400 }}> {suffix}</span>}
            </p>
            <p style={{ fontSize: '0.78rem', color: '#6B7280', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {noData ? (
        <div className="app-card" style={{ textAlign: 'center', padding: '48px 24px', color: '#4B5563' }}>
          <TrendingUp size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No interview data yet. Schedule interviews to see charts.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Row 1: slots line + acceptance doughnut */}
          <div className="chart-main-side">
            <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.08))' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Interview Slots per Job</p>
              <div style={{ position: 'relative', height: '280px' }}><Line data={slotsLine} options={{ ...darkGrid }} /></div>
            </div>
            <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(46,229,176,0.07))' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Acceptance Rate</p>
              <div style={{ position: 'relative', height: '220px' }}><Doughnut data={acceptDoughnut} plugins={[centerLabelPlugin]} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } }, cutout: '68%' }} /></div>
              <p style={{ textAlign: 'center', marginTop: 10, fontSize: '1.3rem', fontWeight: 700, color: '#2EE5B0' }}>{data?.acceptanceRate ?? 0}%</p>
            </div>
          </div>

          {/* Row 2: time-to-hire horizontal bar */}
          <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.07))' }}>
            <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Time to Hire per Job (days)</p>
            <div style={{ position: 'relative', height: `${Math.max(260, breakdown.length * 36)}px` }}><Bar data={timeBar} options={{ ...darkGridH }} /></div>
          </div>

          {/* Row 3: job status pie + accepted slots bar */}
          <div className="chart-side-main">
            <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(46,229,176,0.07))' }}>
              <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Job Status Distribution</p>
              <div style={{ position: 'relative', height: '220px' }}><Pie data={statusPie} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } } }} /></div>
            </div>
            <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.07))' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Accepted Slots per Job</p>
              <div style={{ position: 'relative', height: '260px' }}><Bar data={acceptedBar} options={{ ...darkGrid }} /></div>
            </div>
          </div>

          {/* Row 4: Ratings distribution */}
          {hasRatings && (
            <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.07))' }}>
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>
                Ratings Received (1★ – 5★)
              </p>
              <div style={{ position: 'relative', height: '260px' }}><Bar data={ratingsBar} options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
                  y: { ticks: { color: '#6B7280', stepSize: 1 }, grid: { color: '#1F2937' }, beginAtZero: true },
                },
              }} /></div>
            </div>
          )}

        </div>
      )}
    </AppLayout>
  )
}
