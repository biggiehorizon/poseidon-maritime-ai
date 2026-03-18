import { useState, useEffect } from 'react'

interface RouteParams {
  origin_lat: number
  origin_lon: number
  dest_lat: number
  dest_lon: number
  departure_iso: string
  message: string
}

interface Props {
  onSubmit: (p: RouteParams) => void
  originPin: [number, number] | null
  destPin: [number, number] | null
  onSetOriginMode: () => void
  onSetDestMode: () => void
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.4rem 0.6rem',
  background: '#111', color: '#ddd',
  border: '1px solid #2a2a2a', borderRadius: 6,
  fontSize: '0.8rem', boxSizing: 'border-box',
}

const pinBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1, padding: '0.35rem 0.5rem',
  background: active ? 'rgba(239,68,68,0.15)' : '#0d0d0d',
  border: `1px solid ${active ? '#ef4444' : '#2a2a2a'}`,
  color: active ? '#ef4444' : '#777',
  borderRadius: 6, cursor: 'pointer', fontSize: '0.75rem',
  textAlign: 'left',
})

export default function RouteForm({ onSubmit, originPin, destPin, onSetOriginMode, onSetDestMode }: Props) {
  const [departure, setDeparture] = useState('')
  const [message, setMessage] = useState('')

  const originLat = originPin ? originPin[0] : null
  const originLon = originPin ? originPin[1] : null
  const destLat = destPin ? destPin[0] : null
  const destLon = destPin ? destPin[1] : null

  const canSubmit = originPin && destPin

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      origin_lat: originLat!,
      origin_lon: originLon!,
      dest_lat: destLat!,
      dest_lon: destLon!,
      departure_iso: departure || new Date().toISOString(),
      message: message || 'What should I know about this route?',
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ color: '#ef4444', margin: '0 0 1rem', fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Plot Your Course
      </h3>

      {/* Origin */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
          Origin
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button type="button" style={pinBtnStyle(!originPin)} onClick={onSetOriginMode}>
            {originPin
              ? `📍 ${originPin[0].toFixed(3)}, ${originPin[1].toFixed(3)}`
              : '📍 Click map to set'}
          </button>
          {originPin && (
            <button type="button" onClick={onSetOriginMode}
              style={{ padding: '0.35rem 0.5rem', background: 'none', border: '1px solid #2a2a2a', color: '#444', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>
              ↩
            </button>
          )}
        </div>
      </div>

      {/* Destination */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
          Destination
        </label>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button type="button" style={pinBtnStyle(!destPin)} onClick={onSetDestMode}>
            {destPin
              ? `🏁 ${destPin[0].toFixed(3)}, ${destPin[1].toFixed(3)}`
              : '🏁 Click map to set'}
          </button>
          {destPin && (
            <button type="button" onClick={onSetDestMode}
              style={{ padding: '0.35rem 0.5rem', background: 'none', border: '1px solid #2a2a2a', color: '#444', borderRadius: 6, cursor: 'pointer', fontSize: '0.7rem' }}>
              ↩
            </button>
          )}
        </div>
      </div>

      {/* Departure time */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
          Departure
        </label>
        <input
          type="datetime-local"
          value={departure}
          onChange={e => setDeparture(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Ask Poseidon */}
      <div style={{ marginBottom: '0.9rem' }}>
        <label style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.3rem' }}>
          Ask Poseidon
        </label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="What should I know about this route?"
          rows={2}
          style={{ ...inputStyle, resize: 'none' }}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '0.6rem',
          background: canSubmit ? '#ef4444' : '#1a1a1a',
          color: canSubmit ? '#fff' : '#444',
          border: 'none', borderRadius: 6,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.04em',
          transition: 'background 0.15s',
        }}
      >
        {canSubmit ? 'Get Forecast' : 'Set origin + destination first'}
      </button>
    </form>
  )
}
