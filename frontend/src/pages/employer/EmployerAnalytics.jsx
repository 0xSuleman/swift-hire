import { useEffect, useState } from 'react'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Star, Users, Clock, TrendingUp, Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const darkGrid = {
  plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
    y: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' }, beginAtZero: true },
  },
}

const darkGridH = {
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
    { label: 'Avg Time to Hire', value: data?.avgTimeToHireDays ?? '—',         Icon: Clock,      color: '#2EE5B0', suffix: 'days' },
    { label: 'Acceptance Rate',  value: data?.acceptanceRate ?? 0,              Icon: TrendingUp, color: '#34D399', suffix: '%' },
  ]

  const breakdown = data?.jobBreakdown ?? []
  const labels    = breakdown.map(j => j.jobTitle.length > 16 ? j.jobTitle.slice(0, 16) + '…' : j.jobTitle)

  // Chart 1 — Bar: total vs accepted slots per job
  const slotsBar = {
    labels,
    datasets: [
      { label: 'Total Slots', data: breakdown.map(j => j.totalSlots),    backgroundColor: '#818CF840', borderColor: '#818CF8', borderWidth: 1, borderRadius: 4 },
      { label: 'Accepted',    data: breakdown.map(j => j.acceptedSlots), backgroundColor: '#2EE5B040', borderColor: '#2EE5B0', borderWidth: 1, borderRadius: 4 },
    ],
  }

  // Chart 2 — Doughnut: acceptance rate
  const accepted  = data?.totalInterviews > 0 ? Math.round((data.acceptanceRate / 100) * data.totalInterviews) : 0
  const remaining = (data?.totalInterviews ?? 0) - accepted
  const acceptDoughnut = {
    labels: ['Accepted', 'Other'],
    datasets: [{ data: [accepted, remaining], backgroundColor: ['#2EE5B040', '#374151'], borderColor: ['#2EE5B0', '#4B5563'], borderWidth: 1 }],
  }

  // Chart 3 — Horizontal Bar: time-to-hire per job
  const timeBar = {
    labels,
    datasets: [{
      label: 'Days to Hire',
      data: breakdown.map(j => j.timeToHireDays ?? 0),
      backgroundColor: '#F59E0B40',
      borderColor: '#F59E0B',
      borderWidth: 1,
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
      borderWidth: 1,
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
      borderWidth: 1,
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
      borderWidth: 1,
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

      {/* Stat cards */}
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        {stats.map(({ label, value, Icon, color, suffix }) => (
          <div key={label} className="app-card" style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
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

          {/* Row 1: slots bar + acceptance doughnut */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20, alignItems: 'start' }}>
            <div className="app-card">
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Interview Slots per Job</p>
              <Bar data={slotsBar} options={{ ...darkGrid, responsive: true }} />
            </div>
            <div className="app-card">
              <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Acceptance Rate</p>
              <Doughnut data={acceptDoughnut} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } }, cutout: '68%' }} />
              <p style={{ textAlign: 'center', marginTop: 10, fontSize: '1.3rem', fontWeight: 700, color: '#2EE5B0' }}>{data?.acceptanceRate ?? 0}%</p>
            </div>
          </div>

          {/* Row 2: time-to-hire horizontal bar */}
          <div className="app-card">
            <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Time to Hire per Job (days)</p>
            <Bar data={timeBar} options={{ ...darkGridH, responsive: true }} />
          </div>

          {/* Row 3: job status pie + accepted slots bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
            <div className="app-card">
              <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Job Status Distribution</p>
              <Pie data={statusPie} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } } }} />
            </div>
            <div className="app-card">
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Accepted Slots per Job</p>
              <Bar data={acceptedBar} options={{ ...darkGrid, responsive: true }} />
            </div>
          </div>

          {/* Row 4: Ratings distribution */}
          {hasRatings && (
            <div className="app-card">
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>
                Ratings Received (1★ – 5★)
              </p>
              <Bar data={ratingsBar} options={{
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
                  y: { ticks: { color: '#6B7280', stepSize: 1 }, grid: { color: '#1F2937' }, beginAtZero: true },
                },
                responsive: true,
              }} />
            </div>
          )}

        </div>
      )}
    </AppLayout>
  )
}
