import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute'

// Auth
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'

// Shared
import MyInterviews from './pages/shared/MyInterviews'

// Candidate
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import Profile from './pages/candidate/Profile'
import JobPostings from './pages/candidate/JobPostings'
import RateEmployer from './pages/candidate/RateEmployer'
import CandidateAnalytics from './pages/candidate/CandidateAnalytics'

// Employer
import EmployerDashboard from './pages/employer/EmployerDashboard'
import HiringPrompt from './pages/employer/HiringPrompt'
import RecommendedCandidates from './pages/employer/RecommendedCandidates'
import AutoSchedule from './pages/employer/AutoSchedule'
import RateCandidate from './pages/employer/RateCandidate'
import EmployerProfile from './pages/employer/EmployerProfile'
import EmployerAnalytics from './pages/employer/EmployerAnalytics'
import MyJobs from './pages/employer/MyJobs'

// Admin
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import SystemReports from './pages/admin/SystemReports'
import AdminAnalytics from './pages/admin/AdminAnalytics'

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"         element={<Login />} />
      <Route path="/signup"        element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email"   element={<VerifyEmail />} />

      {/* Candidate */}
      <Route element={<ProtectedRoute allowedRoles={['CANDIDATE']} />}>
        <Route path="/candidate"            element={<CandidateDashboard />} />
        <Route path="/candidate/profile"    element={<Profile />} />
        <Route path="/candidate/jobs"       element={<JobPostings />} />
        <Route path="/candidate/interviews"  element={<MyInterviews />} />
        <Route path="/candidate/rate/:slotId" element={<RateEmployer />} />
        <Route path="/candidate/analytics"  element={<CandidateAnalytics />} />
      </Route>

      {/* Employer */}
      <Route element={<ProtectedRoute allowedRoles={['EMPLOYER']} />}>
        <Route path="/employer"                    element={<EmployerDashboard />} />
        <Route path="/employer/prompt"             element={<HiringPrompt />} />
        <Route path="/employer/candidates/:jobId"  element={<RecommendedCandidates />} />
        <Route path="/employer/schedule/:jobId"    element={<AutoSchedule />} />
        <Route path="/employer/rate/:slotId"       element={<RateCandidate />} />
        <Route path="/employer/profile"            element={<EmployerProfile />} />
        <Route path="/employer/analytics"          element={<EmployerAnalytics />} />
        <Route path="/employer/interviews"         element={<MyInterviews />} />
        <Route path="/employer/jobs"               element={<MyJobs />} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin"          element={<AdminDashboard />} />
        <Route path="/admin/users"    element={<ManageUsers />} />
        <Route path="/admin/reports"    element={<SystemReports />} />
        <Route path="/admin/analytics"  element={<AdminAnalytics />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
