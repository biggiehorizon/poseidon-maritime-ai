import { useState } from 'react'
import type { ChatMessage, ForecastPoint } from '../types'

interface Route {
  origin_lat: number; origin_lon: number
  dest_lat: number; dest_lon: number
  departure_iso: string
}

interface Props {
  vesselId: string
  route: Route | null
  messages: ChatMessage[]
  onSend: (message: string) => void
  onForecastUpdate: (forecast: ForecastPoint[]) => void
}

export default function PoseidonChat({ messages, onSend }: Props) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSend(input)
    setInput('')
  }

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', display: 'flex', flexDirection: 'column', height: '500px' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>🔱</span>
        <span style={{ color: '#ef4444', fontWeight: 'bold', letterSpacing: '0.05em' }}>POSEIDON</span>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>Maritime Intelligence</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {messages.length === 0 && (
          <div style={{ color: '#444', textAlign: 'center', marginTop: '2rem', fontStyle: 'italic' }}>
            Register your vessel and plot a course to consult Poseidon.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
          }}>
            {msg.role === 'poseidon' && (
              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.25rem' }}>🔱 Poseidon</div>
            )}
            <div style={{
              background: msg.role === 'user' ? '#3b0d0d' : '#1a1a1a',
              color: '#e0e0e0',
              padding: '0.75rem 1rem',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              border: `1px solid ${msg.role === 'user' ? '#ef4444' : '#2a2a2a'}`,
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid #222', display: 'flex', gap: '0.5rem' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Poseidon about your route..."
          style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '4px', padding: '0.5rem 0.75rem' }}
        />
        <button type="submit" disabled={!input.trim()}
          style={{ background: input.trim() ? '#ef4444' : '#333', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: input.trim() ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
          Send
        </button>
      </form>
    </div>
  )
}
