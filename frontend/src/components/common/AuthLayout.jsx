import { Briefcase } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-12 text-white relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Swift Hire</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-3xl font-light leading-snug">
              The smarter way to<br />
              <span className="font-bold">hire and get hired.</span>
            </p>
            <p className="text-blue-200 text-base leading-relaxed">
              AI-powered matching, automated scheduling, and real-time analytics — all in one platform built for modern recruitment.
            </p>
          </blockquote>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
            {[
              { value: '2×', label: 'Faster Hiring' },
              { value: '95%', label: 'Match Accuracy' },
              { value: '0 hrs', label: 'Manual Scheduling' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-blue-200 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Swift Hire</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
