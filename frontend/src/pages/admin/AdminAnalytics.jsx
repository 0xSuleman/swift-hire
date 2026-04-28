import { useEffect, useState } from 'react'
import { adminApi } from '../../api/adminApi'
import AppLayout from '../../components/common/AppLayout'
import { Users, Briefcase, CalendarDays, TrendingUp, Star, MessageSquare, Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Radar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
)

const centerLabelPlugin = {
  id: 'centerLabelAdmin',
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
  },
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

export default function AdminAnalytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAnalytics()
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

  const d = data ?? {}

  const stats = [
    { label: 'Total Users',       value: d.totalUsers      ?? 0,                                                   Icon: Users,       color: '#2EE5B0' },
    { label: 'Job Postings',      value: d.totalJobs       ?? 0,                                                   Icon: Briefcase,   color: '#818CF8' },
    { label: 'Interviews',        value: d.totalInterviews ?? 0,                                                   Icon: CalendarDays,color: '#F59E0B' },
    { label: 'Hired Candidates',  value: d.hiredCandidates ?? 0,                                                   Icon: TrendingUp,  color: '#34D399' },
    { label: 'Platform Rating',   value: d.platformAverageRating != null ? d.platformAverageRating.toFixed(1) : '—', Icon: Star,      color: '#F59E0B', suffix: '/ 5' },
    { label: 'Total Reviews',     value: d.totalReviews    ?? 0,                                                   Icon: MessageSquare, color: '#EF4444' },
  ]

  const hasData = (d.totalUsers ?? 0) > 0

  // ── Chart 1: Doughnut — Job Status ──────────────────────────────────────
  const jobStatusDoughnut = {
    labels: ['Open', 'Closed', 'Archived'],
    datasets: [{
      data: [d.openJobs ?? 0, d.closedJobs ?? 0, d.archivedJobs ?? 0],
      backgroundColor: ['#2EE5B040', '#F59E0B40', '#6B728040'],
      borderColor:     ['#2EE5B0',   '#F59E0B',   '#6B7280'],
      borderWidth: 2,
    }],
  }

  // ── Chart 2: Vertical Bar — Account Status ───────────────────────────────
  const accountStatusBar = {
    labels: ['Active', 'Banned', 'Deactivated'],
    datasets: [{
      label: 'Users',
      data: [d.activeUsers ?? 0, d.bannedUsers ?? 0, d.deactivatedUsers ?? 0],
      backgroundColor: ['#2EE5B040', '#EF444440', '#6B728040'],
      borderColor:     ['#2EE5B0',   '#EF4444',   '#6B7280'],
      borderWidth: 2,
      borderRadius: 4,
    }],
  }

  // ── Chart 3: Vertical Bar — User Role Distribution ───────────────────────
  const userRoleBar = {
    labels: ['Candidates', 'Employers'],
    datasets: [{
      label: 'Count',
      data: [d.totalCandidates ?? 0, d.totalEmployers ?? 0],
      backgroundColor: ['#2EE5B040', '#818CF840'],
      borderColor:     ['#2EE5B0',   '#818CF8'],
      borderWidth: 2,
      borderRadius: 4,
    }],
  }

  // ── Chart 4: Line — Recruitment Pipeline ─────────────────────────────────
  const pipelineLine = {
    labels: ['Total Users', 'Job Postings', 'Interviews', 'Reviews', 'Hired'],
    datasets: [{
      label: 'Count',
      data: [
        d.totalUsers      ?? 0,
        d.totalJobs       ?? 0,
        d.totalInterviews ?? 0,
        d.totalReviews    ?? 0,
        d.hiredCandidates ?? 0,
      ],
      borderColor: '#F59E0B',
      backgroundColor: 'rgba(245,158,11,0.12)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 6,
      pointBackgroundColor: '#F59E0B',
      pointHoverRadius: 8,
    }],
  }

  // ── Chart 5: Radar — Platform Strength ──────────────────────────────────
  const vals   = [d.totalUsers ?? 0, d.totalJobs ?? 0, d.totalInterviews ?? 0, d.totalReviews ?? 0, d.hiredCandidates ?? 0]
  const maxVal = Math.max(...vals, 1)
  const radarData = {
    labels: ['Users', 'Jobs', 'Interviews', 'Reviews', 'Hired'],
    datasets: [{
      label: 'Platform',
      data: vals.map(v => Math.round((v / maxVal) * 100)),
      backgroundColor: '#818CF820',
      borderColor: '#818CF8',
      borderWidth: 2,
      pointBackgroundColor: '#818CF8',
    }],
  }

  // ── Chart 6: Horizontal Bar — Top Employers ──────────────────────────────
  const topEmployers = d.topEmployers ?? []
  const employerBar = {
    labels: topEmployers.map(e => e.label.length > 20 ? e.label.slice(0, 20) + '…' : e.label),
    datasets: [{
      label: 'Job Postings',
      data: topEmployers.map(e => e.jobCount),
      backgroundColor: '#818CF840',
      borderColor: '#818CF8',
      borderWidth: 2,
      borderRadius: 4,
    }],
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Platform Analytics</h1>
        <p className="page-subtitle">System-wide overview of Swift Hire activity and growth.</p>
      </div>

      {!hasData && (
        <div className="app-card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 24, color: '#4B5563' }}>
          <p style={{ margin: 0, fontSize: '0.95rem' }}>No Platform Data Yet</p>
          <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#374151' }}>Data will appear here once users register and activity begins.</p>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Row 1: Job Status doughnut + Account Status bar + User Role bar */}
        <div className="three-col-grid">
          <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(46,229,176,0.07))' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Job Status</p>
            <div style={{ position: 'relative', height: '220px' }}>
              <Doughnut data={jobStatusDoughnut} plugins={[centerLabelPlugin]} options={{
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } },
                cutout: '65%',
              }} />
            </div>
          </div>
          <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(46,229,176,0.07))' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Account Status</p>
            <div style={{ position: 'relative', height: '220px' }}>
              <Bar data={accountStatusBar} options={{
                ...darkGrid,
                plugins: { legend: { display: false } },
              }} />
            </div>
          </div>
          <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.07))' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>User Roles</p>
            <div style={{ position: 'relative', height: '220px' }}>
              <Bar data={userRoleBar} options={{
                ...darkGrid,
                plugins: { legend: { display: false } },
              }} />
            </div>
          </div>
        </div>

        {/* Row 2: Recruitment Pipeline line (full width) */}
        <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(245,158,11,0.08))' }}>
          <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Recruitment Pipeline</p>
          <div style={{ position: 'relative', height: '260px' }}>
            <Line data={pipelineLine} options={{
              ...darkGrid,
              plugins: { legend: { display: false } },
              scales: {
                ...darkGrid.scales,
                y: { ...darkGrid.scales.y, beginAtZero: true },
              },
            }} />
          </div>
        </div>

        {/* Row 3: Top Employers horizontal bar + Platform Radar */}
        <div className="chart-main-side">
          <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.08))' }}>
            <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Top Employers by Job Count</p>
            {topEmployers.length === 0 ? (
              <p style={{ color: '#4B5563', fontSize: '0.8rem', textAlign: 'center', paddingTop: 40 }}>No employer job data yet.</p>
            ) : (
              <div style={{ position: 'relative', height: '280px' }}>
                <Bar data={employerBar} options={{ ...darkGridH, plugins: { legend: { display: false } } }} />
              </div>
            )}
          </div>
          <div className="app-card" style={{ filter: 'drop-shadow(0 0 10px rgba(129,140,248,0.07))' }}>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Platform Strength</p>
            <div style={{ position: 'relative', height: '280px' }}>
              <Radar data={radarData} options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  r: {
                    ticks: { display: false },
                    grid: { color: '#1F2937' },
                    pointLabels: { color: '#9CA3AF', font: { size: 10 } },
                    min: 0, max: 100,
                  },
                },
              }} />
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
