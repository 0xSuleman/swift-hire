import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, User, Briefcase, BarChart2,
  Zap, Building2, Users, FileText, LogOut, CalendarDays, Menu, X, ClipboardList,
} from 'lucide-react'

const NAV = {
  CANDIDATE: [
    { to: '/candidate',              label: 'Dashboard',    Icon: LayoutDashboard },
    { to: '/candidate/profile',      label: 'My Profile',   Icon: User },
    { to: '/candidate/jobs',         label: 'Job Postings', Icon: Briefcase },
    { to: '/candidate/interviews',   label: 'Interviews',   Icon: CalendarDays },
    { to: '/candidate/applications', label: 'Applications', Icon: ClipboardList },
    { to: '/candidate/analytics',    label: 'Analytics',    Icon: BarChart2 },
  ],
  EMPLOYER: [
    { to: '/employer',               label: 'Dashboard',    Icon: LayoutDashboard },
    { to: '/employer/prompt',        label: 'Hire Now',     Icon: Zap },
    { to: '/employer/jobs',          label: 'My Jobs',      Icon: Briefcase },
    { to: '/employer/interviews',    label: 'Interviews',   Icon: CalendarDays },
    { to: '/employer/profile',       label: 'Company',      Icon: Building2 },
    { to: '/employer/analytics',     label: 'Analytics',    Icon: BarChart2 },
  ],
  ADMIN: [
    { to: '/admin',               label: 'Dashboard',    Icon: LayoutDashboard },
    { to: '/admin/users',         label: 'Manage Users', Icon: Users },
    { to: '/admin/reports',       label: 'Reports',      Icon: FileText },
    { to: '/admin/analytics',     label: 'Analytics',    Icon: BarChart2 },
  ],
}

const ROLE_BADGE = {
  CANDIDATE: { label: 'Candidate', color: '#2EE5B0' },
  EMPLOYER:  { label: 'Employer',  color: '#818CF8' },
  ADMIN:     { label: 'Admin',     color: '#F59E0B' },
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navItems = NAV[user?.role] ?? []
  const badge    = ROLE_BADGE[user?.role]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-layout">

      {/* ── Mobile top bar ────────────────────────────────────────── */}
      <div className="mobile-topbar">
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(v => !v)}>
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="mobile-topbar-logo">
          <span className="sidebar-logo-teal">swift</span>
          <span className="sidebar-logo-white">hire</span>
        </div>
      </div>

      {/* ── Overlay (mobile) ─────────────────────────────────────── */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-teal">swift</span>
          <span className="sidebar-logo-white">hire</span>
        </div>

        <div className="sidebar-divider" />

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length === 2}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
              onClick={closeSidebar}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ flex: 1 }} />
        <div className="sidebar-divider" />

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.name}</p>
            <p className="sidebar-user-role" style={{ color: badge?.color }}>
              {badge?.label}
            </p>
          </div>
        </div>

        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={14} />
          Sign Out
        </button>

      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <main className="app-main">
        {children}
      </main>

    </div>
  )
}
