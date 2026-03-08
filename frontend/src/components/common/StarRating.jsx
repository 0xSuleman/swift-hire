import { useState } from 'react'

export default function StarRating({ value, onChange, readOnly = false }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value

  return (
    <div style={{ display: 'flex', gap: 4, cursor: readOnly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{ fontSize: 24, color: star <= display ? '#f5a623' : '#ccc' }}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          onClick={() => !readOnly && onChange && onChange(star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
