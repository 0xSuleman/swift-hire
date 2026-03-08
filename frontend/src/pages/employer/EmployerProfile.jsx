import { useEffect, useState } from 'react'
import { employerApi } from '../../api/employerApi'

export default function EmployerProfile() {
  const [form, setForm] = useState({ companyName: '', companyDetails: '', companyLocation: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    employerApi.getProfile().then(res => {
      const d = res.data.data
      setForm({ companyName: d.companyName || '', companyDetails: d.companyDetails || '', companyLocation: d.companyLocation || '' })
    })
  }, [])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await employerApi.updateProfile(form)
      setMessage('Profile updated successfully.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Invalid Data Entered')
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '40px auto', padding: 24 }}>
      <h2>Company Profile</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSubmit}>
        {[
          { key: 'companyName', label: 'Company Name' },
          { key: 'companyLocation', label: 'Location' },
        ].map(({ key, label }) => (
          <input key={key} placeholder={label} value={form[key]}
            onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }} />
        ))}
        <textarea placeholder="Company Description" rows={4} value={form.companyDetails}
          onChange={e => setForm(f => ({ ...f, companyDetails: e.target.value }))}
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 12 }} />
        <button type="submit" style={{ padding: '10px 24px' }}>Confirm Changes</button>
      </form>
    </div>
  )
}
