import { useEffect, useState } from 'react'
import { candidateApi } from '../../api/candidateApi'

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [file, setFile] = useState(null)
  const [prefs, setPrefs] = useState({ location: '', shift: '', workType: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    candidateApi.getProfile().then(res => {
      setProfile(res.data.data)
      setPrefs({
        location: res.data.data.preferredLocation || '',
        shift: res.data.data.preferredShift || '',
        workType: res.data.data.workType || '',
      })
    })
  }, [])

  const uploadCv = async e => {
    e.preventDefault()
    if (!file) return
    try {
      await candidateApi.uploadCv(file)
      setMessage('CV uploaded and parsed successfully.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed.')
    }
  }

  const savePrefs = async e => {
    e.preventDefault()
    try {
      await candidateApi.setPreferences(prefs)
      setMessage('Preferences saved.')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save preferences.')
    }
  }

  if (!profile) return <p>Loading profile...</p>

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
      <h2>My Profile</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <p><strong>Name:</strong> {profile.name}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Parsed Skills:</strong> {profile.parsedSkills || 'None yet — upload your CV'}</p>
      <p><strong>Profile Views:</strong> {profile.profileViews}</p>

      {/* UC-09: CV Upload */}
      <h3>Upload CV (PDF only, max 10 MB)</h3>
      <form onSubmit={uploadCv}>
        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
        <button type="submit" style={{ marginLeft: 12 }}>Upload & Parse</button>
      </form>

      {/* UC-10: Preferences */}
      <h3>Job Preferences</h3>
      <form onSubmit={savePrefs}>
        <input placeholder="Preferred Location (e.g. Lahore)" value={prefs.location}
          onChange={e => setPrefs(p => ({ ...p, location: e.target.value }))}
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8 }} />
        <select value={prefs.shift} onChange={e => setPrefs(p => ({ ...p, shift: e.target.value }))}
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8 }}>
          <option value="">Any Shift</option>
          <option value="DAY">Day</option>
          <option value="NIGHT">Night</option>
        </select>
        <select value={prefs.workType} onChange={e => setPrefs(p => ({ ...p, workType: e.target.value }))}
          style={{ display: 'block', width: '100%', padding: 8, marginBottom: 8 }}>
          <option value="">Any Work Type</option>
          <option value="REMOTE">Remote</option>
          <option value="ON_SITE">On-Site</option>
          <option value="HYBRID">Hybrid</option>
        </select>
        <button type="submit">Save Preferences</button>
      </form>
    </div>
  )
}
