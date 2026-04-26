import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { candidateApi } from '../../api/candidateApi'
import AppLayout from '../../components/common/AppLayout'
import { User, Briefcase, BarChart2, ArrowRight, CheckCircle2, Mail } from 'lucide-react'

const QUICK_LINKS = [
  { label: 'Complete Profile',      desc: 'Upload your CV and set preferences',  to: '/candidate/profile',   Icon: User,     color: '#2EE5B0' },
  { label: 'Browse Job Postings',   desc: 'See roles matched to your skills',    to: '/candidate/jobs',      Icon: Briefcase, color: '#818CF8' },
  { label: 'View Analytics',        desc: 'Profile views and interview stats',   to: '/candidate/analytics', Icon: BarChart2, color: '#F59E0B' },
]

export default function CandidateDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    candidateApi.getProfile().then(res => setProfile(res.data.data)).catch(() => {})
  }, [])

  return (
    <AppLayout>
      <div className="page-header">
        <p style={{ fontSize: '0.82rem', color: '#2EE5B0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
          Welcome back
        </p>
        <h1 className="page-title">{user?.name}</h1>
        <p className="page-subtitle">Here's what's waiting for you today.</p>
      </div>

      {/* Hired banner */}
      {profile?.hiredAt && (
        <div style={{
          marginBottom: 28, padding: '20px 24px', borderRadius: 14,
          background: 'rgba(46,229,176,0.06)', border: '1px solid rgba(46,229,176,0.25)',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(46,229,176,0.12)', border: '1px solid rgba(46,229,176,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} style={{ color: '#2EE5B0' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#2EE5B0' }}>
                You've been hired by {profile.hiredCompanyName}!
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#6B7280' }}>
                Role: <span style={{ color: '#9CA3AF' }}>{profile.hiredJobTitle}</span>
                {' · '}
                Since {new Date(profile.hiredAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 46 }}>
            <Mail size={13} style={{ color: '#4B5563', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>
              Contact your employer at{' '}
              <a href={`mailto:${profile.hiredEmployerEmail}`} style={{ color: '#2EE5B0', textDecoration: 'none' }}>
                {profile.hiredEmployerEmail}
              </a>
              {' '}for onboarding details. Check your email for your offer confirmation.
            </span>
          </div>
        </div>
      )}

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
