import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { Eye, Calendar, Star, Code2, Loader2 } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement,
  Tooltip, Legend, Filler,
)

const darkGrid = {
  plugins: { legend: { labels: { color: '#9CA3AF', font: { size: 12 } } } },
  scales: {
    x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
    y: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' }, beginAtZero: true, max: 100 },
  },
}

export default function CandidateAnalytics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    candidateApi.getAnalytics()
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
    { label: 'Profile Views',        value: data?.profileViews ?? 0,                                          Icon: Eye,      color: '#2EE5B0' },
    { label: 'Interviews Scheduled', value: data?.interviewCount ?? 0,                                        Icon: Calendar, color: '#818CF8' },
    { label: 'Average Rating',       value: data?.averageRating != null ? data.averageRating.toFixed(1) : '—', Icon: Star,     color: '#F59E0B', suffix: '/ 5' },
    { label: 'Skills Parsed',        value: data?.parsedSkillsCount ?? 0,                                     Icon: Code2,    color: '#34D399' },
  ]

  const statusBreakdown = data?.interviewStatusBreakdown ?? {}
  const topMatches      = data?.topJobMatches ?? []

  // Chart 1 — Doughnut: interview status breakdown
  const statusDoughnut = {
    labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        statusBreakdown.PENDING   ?? 0,
        statusBreakdown.CONFIRMED ?? 0,
        statusBreakdown.COMPLETED ?? 0,
        statusBreakdown.CANCELLED ?? 0,
      ],
      backgroundColor: ['#F59E0B40', '#2EE5B040', '#818CF840', '#EF444440'],
      borderColor:     ['#F59E0B',   '#2EE5B0',   '#818CF8',   '#EF4444'],
      borderWidth: 1,
    }],
  }

  // Chart 2 — Bar: ATS score per job (top matches)
  const atsBar = {
    labels: topMatches.map(m => m.jobTitle.length > 16 ? m.jobTitle.slice(0, 16) + '…' : m.jobTitle),
    datasets: [{
      label: 'ATS Score (%)',
      data: topMatches.map(m => m.atsScore),
      backgroundColor: '#818CF840',
      borderColor: '#818CF8',
      borderWidth: 1,
      borderRadius: 4,
    }],
  }

  // Chart 3 — Radar: profile strength
  const maxViews = Math.max(data?.profileViews ?? 0, 1)
  const radarData = {
    labels: ['Profile Views', 'Interviews', 'Rating', 'Skills', 'Job Matches'],
    datasets: [{
      label: 'Your Profile',
      data: [
        Math.min((data?.profileViews ?? 0) / maxViews * 100, 100),
        Math.min((data?.interviewCount ?? 0) * 10, 100),
        ((data?.averageRating ?? 0) / 5) * 100,
        Math.min((data?.parsedSkillsCount ?? 0) * 5, 100),
        Math.min(topMatches.length * 16.7, 100),
      ],
      backgroundColor: '#2EE5B020',
      borderColor: '#2EE5B0',
      borderWidth: 2,
      pointBackgroundColor: '#2EE5B0',
    }],
  }

  // Chart 4 — Horizontal Bar: ATS scores (same data, different axis — shows ranking clearly)
  const atsBarH = {
    labels: topMatches.map(m => m.jobTitle.length > 20 ? m.jobTitle.slice(0, 20) + '…' : m.jobTitle),
    datasets: [{
      label: 'Match %',
      data: topMatches.map(m => m.atsScore),
      backgroundColor: topMatches.map(m =>
        m.atsScore >= 70 ? '#2EE5B040' : m.atsScore >= 40 ? '#F59E0B40' : '#EF444430'
      ),
      borderColor: topMatches.map(m =>
        m.atsScore >= 70 ? '#2EE5B0' : m.atsScore >= 40 ? '#F59E0B' : '#EF4444'
      ),
      borderWidth: 1,
      borderRadius: 4,
    }],
  }

  // Chart 5 — Doughnut: interview outcome (completed vs not)
  const completedCount = statusBreakdown.COMPLETED ?? 0
  const otherCount     = (data?.interviewCount ?? 0) - completedCount
  const outcomeDoughnut = {
    labels: ['Completed', 'Other'],
    datasets: [{
      data: [completedCount, otherCount],
      backgroundColor: ['#818CF840', '#374151'],
      borderColor:     ['#818CF8',   '#4B5563'],
      borderWidth: 1,
    }],
  }

  const hasInterviews = (data?.interviewCount ?? 0) > 0
  const hasMatches    = topMatches.length > 0

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">My Analytics</h1>
        <p className="page-subtitle">Track how employers are discovering your profile.</p>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Row 1: interview status doughnut + outcome doughnut + radar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div className="app-card">
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Interview Status</p>
            {hasInterviews
              ? <Doughnut data={statusDoughnut} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } }, cutout: '60%' }} />
              : <p style={{ color: '#4B5563', fontSize: '0.8rem', textAlign: 'center', paddingTop: 40 }}>No interviews yet.</p>}
          </div>
          <div className="app-card">
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Interview Outcomes</p>
            {hasInterviews
              ? <>
                  <Doughnut data={outcomeDoughnut} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#9CA3AF', font: { size: 11 } } } }, cutout: '60%' }} />
                  <p style={{ textAlign: 'center', marginTop: 10, fontSize: '1.2rem', fontWeight: 700, color: '#818CF8' }}>{completedCount} completed</p>
                </>
              : <p style={{ color: '#4B5563', fontSize: '0.8rem', textAlign: 'center', paddingTop: 40 }}>No interviews yet.</p>}
          </div>
          <div className="app-card">
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Profile Strength</p>
            <Radar data={radarData} options={{
              plugins: { legend: { display: false } },
              scales: { r: { ticks: { display: false }, grid: { color: '#1F2937' }, pointLabels: { color: '#9CA3AF', font: { size: 10 } }, min: 0, max: 100 } },
            }} />
          </div>
        </div>

        {/* Row 2: ATS bar + ATS horizontal bar */}
        {hasMatches && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="app-card">
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>ATS Score per Job</p>
              <Bar data={atsBar} options={{ ...darkGrid, responsive: true }} />
            </div>
            <div className="app-card">
              <p style={{ margin: '0 0 16px', fontWeight: 600, color: '#E8EAF0', fontSize: '0.9rem' }}>Job Match Ranking</p>
              <Bar data={atsBarH} options={{
                indexAxis: 'y',
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' }, beginAtZero: true, max: 100 },
                  y: { ticks: { color: '#6B7280' }, grid: { color: '#1F2937' } },
                },
                responsive: true,
              }} />
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
