import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/common/AppLayout'
import { Users, FileText, ArrowRight, BarChart2 } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Manage Users',    desc: 'Search, filter, ban or approve accounts', to: '/admin/users',   Icon: Users,    color: '#F59E0B' },
  { label: 'System Reports',  desc: 'Generate reports by category and date',   to: '/admin/reports', Icon: FileText, color: '#818CF8' },
  { label: 'Analytics',       desc: 'View platform metrics and ATS trends',     to: '/admin/analytics', Icon: BarChart2, color: '#2EE5B0' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="page-header">
        <p style={{ fontSize: '0.82rem', color: '#F59E0B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Admin Panel
        </p>
        <h1 className="page-title">{user?.name}</h1>
        <p className="page-subtitle">Manage the Swift Hire platform.</p>
      </div>

      <div className="stat-grid">
        {QUICK_LINKS.map(({ label, desc, to, Icon, color }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="stat-card"
            style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.07)', transition: 'border-color 0.2s, transform 0.15s', background: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon size={17} style={{ color }} />
            </div>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#E8EAF0', margin: '0 0 4px' }}>{label}</p>
            <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>{desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, color, fontSize: '0.75rem', fontWeight: 500 }}>
              Go <ArrowRight size={12} />
            </div>
          </button>
        ))}
      </div>
    </AppLayout>
  )
}
