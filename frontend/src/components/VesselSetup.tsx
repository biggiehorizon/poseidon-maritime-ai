import { useState } from 'react'
import type { VesselProfile } from '../types'

interface Props { onSave: (v: VesselProfile) => void }

const VESSEL_TYPES = ['monohull sailboat', 'catamaran', 'motor yacht', 'center console', 'fishing trawler', 'RIB']

export default function VesselSetup({ onSave }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState(VESSEL_TYPES[0])
  const [length_ft, setLength] = useState(36)
  const [draft_ft, setDraft] = useState(4.5)
  const [propulsion, setPropulsion] = useState<'sail' | 'motor' | 'both'>('sail')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const profile = { name, type, length_ft, draft_ft, propulsion }
    localStorage.setItem('poseidon_vessel', JSON.stringify(profile))
    onSave(profile)
  }

  const inputStyle: React.CSSProperties = { width: '100%', padding: '0.5rem', marginBottom: '1rem', background: '#222', color: '#fff', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }

  return (
    <form onSubmit={handleSubmit} style={{ background: '#111', color: '#fff', padding: '2rem', borderRadius: '8px', maxWidth: '480px' }}>
      <h2 style={{ color: '#ef4444', marginBottom: '1.5rem' }}>Register Your Vessel</h2>

      <label htmlFor="vessel-name" style={{ display: 'block', marginBottom: '0.5rem' }}>Vessel Name</label>
      <input id="vessel-name" aria-label="Vessel Name" value={name} onChange={e => setName(e.target.value)}
        required style={inputStyle} />

      <label htmlFor="vessel-type" style={{ display: 'block', marginBottom: '0.5rem' }}>Vessel Type</label>
      <select id="vessel-type" aria-label="Vessel Type" value={type} onChange={e => setType(e.target.value)}
        style={inputStyle}>
        {VESSEL_TYPES.map(t => <option key={t}>{t}</option>)}
      </select>

      <label htmlFor="length" style={{ display: 'block', marginBottom: '0.5rem' }}>Length (ft)</label>
      <input id="length" aria-label="Length" type="number" value={length_ft} onChange={e => setLength(Number(e.target.value))}
        style={inputStyle} />

      <label htmlFor="draft" style={{ display: 'block', marginBottom: '0.5rem' }}>Draft (ft)</label>
      <input id="draft" aria-label="Draft" type="number" step="0.25" value={draft_ft} onChange={e => setDraft(Number(e.target.value))}
        style={inputStyle} />

      <label htmlFor="propulsion" style={{ display: 'block', marginBottom: '0.5rem' }}>Propulsion</label>
      <select id="propulsion" aria-label="Propulsion" value={propulsion} onChange={e => setPropulsion(e.target.value as 'sail' | 'motor' | 'both')}
        style={{ ...inputStyle, marginBottom: '1.5rem' }}>
        <option value="sail">Sail</option>
        <option value="motor">Motor</option>
        <option value="both">Sail + Motor</option>
      </select>

      <button type="submit" style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.75rem 2rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
        Save Vessel
      </button>
    </form>
  )
}
