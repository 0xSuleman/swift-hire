import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { employerApi } from '../../api/employerApi'

export default function HiringPrompt() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await employerApi.submitPrompt(prompt)
      const { jobPostingId } = res.data.data
      navigate(`/employer/candidates/${jobPostingId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process prompt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24 }}>
      <h2>New Hiring Prompt</h2>
      <p>Type what you need — the system will find matching candidates instantly.</p>
      <form onSubmit={handleSubmit}>
        <textarea
          rows={5}
          style={{ width: '100%', padding: 12, fontSize: 16, marginBottom: 12 }}
          placeholder="e.g. Need a Java dev with 3 years exp, Spring Boot, night shift in Lahore"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          required
        />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: '10px 24px' }}>
          {loading ? 'Processing...' : 'Find Candidates'}
        </button>
      </form>
    </div>
  )
}
