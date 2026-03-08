import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { candidateApi } from '../../api/candidateApi'
import StarRating from '../../components/common/StarRating'

export default function RateEmployer() {
  const { slotId } = useParams()
  const navigate = useNavigate()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    if (!rating) { setError('Please select a valid rating (1–5).'); return }
    try {
      await candidateApi.rateEmployer({ slotId: Number(slotId), rating, comment })
      navigate('/candidate')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating.')
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: 24 }}>
      <h2>Rate Employer</h2>
      <form onSubmit={handleSubmit}>
        <StarRating value={rating} onChange={setRating} />
        <textarea rows={4} placeholder="Optional feedback..." value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ display: 'block', width: '100%', marginTop: 16, padding: 8 }} />
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ marginTop: 12, padding: '10px 24px' }}>Submit Rating</button>
      </form>
    </div>
  )
}
