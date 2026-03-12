import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/common/AppLayout'
import { User, Briefcase, BarChart2, ArrowRight } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Complete Profile',      desc: 'Upload your CV and set preferences',  to: '/candidate/profile',   Icon: User,     color: '#2EE5B0' },
  { label: 'Browse Job Postings',   desc: 'See roles matched to your skills',    to: '/candidate/jobs',      Icon: Briefcase, color: '#818CF8' },
  { label: 'View Analytics',        desc: 'Profile views and interview stats',   to: '/candidate/analytics', Icon: BarChart2, color: '#F59E0B' },
]

export default function CandidateDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="page-header">
        <p style={{ fontSize: '0.82rem', color: '#2EE5B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Welcome back
        </p>
        <h1 className="page-title">{user?.name}</h1>
        <p className="page-subtitle">Here's what's waiting for you today.</p>
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
