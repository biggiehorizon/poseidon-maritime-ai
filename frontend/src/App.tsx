import { useState, useCallback } from 'react'
import VesselSetup from './components/VesselSetup'
import RouteForm from './components/RouteForm'
import RouteMap from './components/RouteMap'
import PoseidonChat from './components/PoseidonChat'
import { saveVessel, sendChat } from './api'
import type { VesselProfile, ForecastPoint, ChatMessage } from './types'

type Screen = 'setup' | 'forecast'
type ClickMode = 'origin' | 'dest' | null

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [vesselId, setVesselId] = useState<string | null>(null)
  const [vessel, setVessel] = useState<VesselProfile | null>(null)
  const [route, setRoute] = useState<{ origin_lat: number; origin_lon: number; dest_lat: number; dest_lon: number; departure_iso: string } | null>(null)
  const [forecast, setForecast] = useState<ForecastPoint[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [originPin, setOriginPin] = useState<[number, number] | null>(null)
  const [destPin, setDestPin] = useState<[number, number] | null>(null)
  const [clickMode, setClickMode] = useState<ClickMode>(null)

  const handleVesselSave = async (profile: VesselProfile) => {
    const id = await saveVessel(profile)
    setVesselId(id)
    setVessel(profile)
    setScreen('forecast')
    setClickMode('origin')
  }

  const handleMapClick = useCallback((latlng: { lat: number; lng: number }) => {
    if (clickMode === 'origin') {
      setOriginPin([latlng.lat, latlng.lng])
      setClickMode('dest')
    } else if (clickMode === 'dest') {
      setDestPin([latlng.lat, latlng.lng])
      setClickMode(null)
    }
  }, [clickMode])

  const handleRouteSubmit = useCallback(async (params: { origin_lat: number; origin_lon: number; dest_lat: number; dest_lon: number; departure_iso: string; message: string }) => {
    if (!vesselId) return
    setRoute(params)
    const userMsg = params.message
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const { response, forecast: fc } = await sendChat({ vessel_id: vesselId, ...params })
      setForecast(fc)
      setMessages(prev => [...prev, { role: 'poseidon', content: response }])
    } catch {
      setMessages(prev => [...prev, { role: 'poseidon', content: 'The seas are not answering. Check your connection.' }])
    } finally {
      setLoading(false)
    }
  }, [vesselId])

  const handleChatSend = useCallback(async (message: string) => {
    if (!vesselId || !route) return
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setLoading(true)
    try {
      const { response, forecast: fc } = await sendChat({ vessel_id: vesselId, ...route, message })
      setForecast(fc)
      setMessages(prev => [...prev, { role: 'poseidon', content: response }])
    } catch {
      setMessages(prev => [...prev, { role: 'poseidon', content: 'Lost the signal. Try again.' }])
    } finally {
      setLoading(false)
    }
  }, [vesselId, route])

  const resetVessel = () => {
    setScreen('setup')
    setMessages([])
    setForecast([])
    setOriginPin(null)
    setDestPin(null)
    setClickMode(null)
    setRoute(null)
  }

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 64,
    left: 16,
    width: 340,
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
    zIndex: 10,
    background: 'rgba(6,6,6,0.88)',
    backdropFilter: 'blur(10px)',
    border: '1px solid #1e1e1e',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* Full-screen map — always behind everything */}
      <RouteMap
        forecast={forecast}
        originPin={originPin}
        destPin={destPin}
        clickMode={clickMode}
        onMapClick={handleMapClick}
      />

      {/* Header overlay */}
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        background: 'rgba(6,6,6,0.82)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
        padding: '0 1.25rem', height: 56,
        display: 'flex', alignItems: 'center', gap: '0.75rem',
      }}>
        <span style={{ fontSize: '1.6rem' }}>🔱</span>
        <span style={{ color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em', fontSize: '1.1rem' }}>POSEIDON</span>
        <span style={{ color: '#444', fontSize: '0.8rem' }}>Maritime Intelligence</span>
        {vessel && (
          <span style={{ marginLeft: 'auto', color: '#555', fontSize: '0.8rem' }}>
            ⚓ {vessel.name} · {vessel.type}
          </span>
        )}
        {screen !== 'setup' && (
          <button onClick={resetVessel} style={{
            marginLeft: vessel ? '0.75rem' : 'auto',
            background: 'none', border: '1px solid #2a2a2a',
            color: '#555', padding: '0.2rem 0.6rem',
            borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem',
          }}>
            New Vessel
          </button>
        )}
      </header>

      {/* Click-mode instruction banner */}
      {clickMode && (
        <div style={{
          position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, background: 'rgba(239,68,68,0.9)', color: '#fff',
          padding: '0.4rem 1.2rem', borderRadius: 20, fontSize: '0.85rem',
          fontWeight: 600, pointerEvents: 'none',
          boxShadow: '0 2px 12px rgba(239,68,68,0.4)',
        }}>
          {clickMode === 'origin' ? '📍 Click map to set origin' : '🏁 Click map to set destination'}
        </div>
      )}

      {/* Left side panel */}
      <div style={panelStyle}>
        {screen === 'setup' && (
          <div style={{ padding: '1.25rem' }}>
            <VesselSetup onSave={handleVesselSave} />
          </div>
        )}
        {screen === 'forecast' && (
          <div>
            <div style={{ padding: '1.25rem', borderBottom: messages.length > 0 ? '1px solid #1a1a1a' : 'none' }}>
              <RouteForm
                onSubmit={handleRouteSubmit}
                originPin={originPin}
                destPin={destPin}
                onSetOriginMode={() => setClickMode('origin')}
                onSetDestMode={() => setClickMode('dest')}
              />
            </div>
            {messages.length > 0 && (
              <div style={{ padding: '1.25rem' }}>
                {loading && (
                  <div style={{ color: '#444', fontStyle: 'italic', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                    Poseidon is reading the sea...
                  </div>
                )}
                <PoseidonChat
                  vesselId={vesselId!}
                  route={route}
                  messages={messages}
                  onSend={handleChatSend}
                  onForecastUpdate={setForecast}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Weather legend — bottom right */}
      {forecast.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 24, right: 16, zIndex: 10,
          background: 'rgba(6,6,6,0.85)', backdropFilter: 'blur(8px)',
          border: '1px solid #1e1e1e', borderRadius: 8,
          padding: '0.6rem 0.9rem', fontSize: '0.75rem', color: '#aaa',
        }}>
          <div style={{ color: '#666', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wind</div>
          {[['#22c55e', '< 10 kts'], ['#eab308', '10–20 kts'], ['#ef4444', '> 20 kts']].map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
