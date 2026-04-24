import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'
import AppLayout from '../../components/common/AppLayout'
import { Zap, AlertCircle, Loader2, Lightbulb } from 'lucide-react'

const EXAMPLES = [
  'Need a Java developer with 3 years exp, Spring Boot, night shift in Lahore',
  'Looking for a React frontend dev, 2 years experience, remote, day shift',
  'Senior Python engineer, 5+ years, machine learning background, Karachi',
]

export default function HiringPrompt() {
  const navigate = useNavigate()
  const [prompt, setPrompt]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!prompt.trim()) {
      setError('Prompt cannot be empty.')
      return
    }
    setLoading(true)
    try {
      const res = await employerApi.submitPrompt(prompt)
      const { jobPostingId, candidatesFound } = res.data.data
      if (candidatesFound === 0) {
        setError('No matching candidates found. Try changing skills/experience/location.')
      } else {
        navigate(`/employer/candidates/${jobPostingId}`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process prompt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">New Hiring Prompt</h1>
        <p className="page-subtitle">Describe who you need — we'll find the best matches instantly.</p>
      </div>

      <div style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit}>
          <div className="app-card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* Textarea */}
            <textarea
              rows={6}
              value={prompt}
              onChange={e => { setPrompt(e.target.value); setError('') }}
              placeholder="e.g. Need a Java dev with 3 years exp, Spring Boot, night shift in Lahore"
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: '#E8EAF0', fontSize: '0.95rem', lineHeight: 1.7, resize: 'none',
                padding: '22px 24px', fontFamily: 'inherit',
              }}
            />

            {/* Footer bar */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: '0.75rem', color: prompt.length > 20 ? '#4B5563' : '#374151' }}>
                {prompt.length} characters
              </span>
              <button
                type="submit"
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 22px', borderRadius: 9999,
                  background: 'linear-gradient(135deg, #2ee5b0, #00c9a7)',
                  color: '#052015', fontWeight: 600, fontSize: '0.88rem',
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                  transition: 'filter 0.2s, box-shadow 0.2s',
                  boxShadow: '0 0 16px rgba(46,229,176,0.2)',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(46,229,176,0.35)' }}}
                onMouseLeave={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 0 16px rgba(46,229,176,0.2)' }}
              >
                {loading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Searching...</>
                  : <><Zap size={14} /> Find Candidates</>
                }
              </button>
            </div>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="error-banner" style={{ marginTop: 14 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Example prompts */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            <Lightbulb size={13} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: '0.75rem', color: '#4B5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Example prompts
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(ex)}
                style={{
                  textAlign: 'left', padding: '11px 16px', borderRadius: 10,
                  background: '#0F1215', border: '1px solid rgba(255,255,255,0.06)',
                  color: '#6B7280', fontSize: '0.82rem', cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#9CA3AF' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#6B7280' }}
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
