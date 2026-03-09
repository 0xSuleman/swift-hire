export default function AuthLayout({ headingTeal, headingWhite, tagline, children }) {
  return (
    <div className="relative min-h-screen bg-[#0D0F11] flex flex-col items-center justify-center px-4 py-12 overflow-hidden">

      {/* Ambient teal radial glow — top center */}
      <div
        className="animate-glow-pulse pointer-events-none select-none"
        style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '700px',
          height: '420px',
          background: 'radial-gradient(ellipse at center, rgba(46,229,176,0.13) 0%, transparent 68%)',
          zIndex: 0,
        }}
      />

      {/* Secondary warm glow — bottom right */}
      <div
        className="pointer-events-none select-none"
        style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.07) 0%, transparent 65%)',
          zIndex: 0,
        }}
      />

      {/* Giant ghost background text */}
      <div
        className="pointer-events-none select-none"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 'clamp(80px, 18vw, 200px)',
          fontWeight: 900,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.025)',
          whiteSpace: 'nowrap',
          zIndex: 0,
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        SWIFT<br />HIRE
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">

        {/* Hero heading */}
        <div className="text-center mb-8">
          {headingTeal && (
            <p
              className="text-sm font-semibold uppercase tracking-[0.25em] mb-2"
              style={{ color: '#2EE5B0', textShadow: '0 0 30px rgba(46,229,176,0.6)' }}
            >
              {headingTeal}
            </p>
          )}
          {headingWhite && (
            <h1
              className="font-black uppercase tracking-tight"
              style={{
                fontSize: 'clamp(28px, 6vw, 42px)',
                background: 'linear-gradient(180deg, #FFFFFF 30%, rgba(255,255,255,0.55) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.1,
              }}
            >
              {headingWhite}
            </h1>
          )}
          {tagline && (
            <p className="mt-3 text-sm" style={{ color: '#6B7280' }}>{tagline}</p>
          )}
        </div>

        {/* Card */}
        <div
          className="animate-slide-up-delay rounded-2xl p-7"
          style={{
            background: '#13171B',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="relative z-10 mt-10 text-xs" style={{ color: '#374151' }}>
        © 2026 Swift Hire. All Rights Reserved.
      </p>
    </div>
  )
}
