import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AppLayout from '../../components/common/AppLayout'
import { Zap, Building2, BarChart2, ArrowRight, Briefcase, CalendarDays } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Start Hiring',     desc: 'Type a prompt and match candidates', to: '/employer/prompt',     Icon: Zap,          color: '#2EE5B0' },
  { label: 'My Jobs',          desc: 'Manage postings and candidates',     to: '/employer/jobs',       Icon: Briefcase,    color: '#818CF8' },
  { label: 'Interviews',       desc: 'Review scheduled interview slots',   to: '/employer/interviews', Icon: CalendarDays, color: '#F59E0B' },
  { label: 'Company Profile',  desc: 'Update your company details',        to: '/employer/profile',    Icon: Building2,    color: '#38BDF8' },
  { label: 'Hiring Analytics', desc: 'Track hiring and ATS performance',    to: '/employer/analytics',  Icon: BarChart2,    color: '#A78BFA' },
]

export default function EmployerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <AppLayout>
      <div className="page-header">
        <p style={{ fontSize: '0.82rem', color: '#818CF8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Recruiter Portal
        </p>
        <h1 className="page-title">{user?.name}</h1>
        <p className="page-subtitle">Find your next great hire.</p>
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
