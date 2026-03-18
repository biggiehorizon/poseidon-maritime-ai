import { useState, useCallback, useRef, useEffect } from 'react'
import VesselSetup from './components/VesselSetup'
import RouteForm from './components/RouteForm'
import RouteMap from './components/RouteMap'
import PoseidonChat from './components/PoseidonChat'
import { saveVessel, sendChat } from './api'
import type { VesselProfile, ForecastPoint, ChatMessage } from './types'

type Screen = 'setup' | 'forecast'
type ClickMode = 'origin' | 'dest' | null

const MIN_W = 200
const MAX_W = 600

function VesselCard({ vessel, onReset }: { vessel: VesselProfile; onReset: () => void }) {
  const row = (label: string, value: string | number) => (
    <div key={label} style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.55rem 0', borderBottom: '1px solid #1a1a1a',
    }}>
      <span style={{ color: '#555', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ color: '#ccc', fontSize: '0.82rem' }}>{value}</span>
    </div>
  )
  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.2rem' }}>{vessel.name}</div>
        <div style={{ color: '#555', fontSize: '0.78rem' }}>{vessel.type}</div>
      </div>
      {row('Length', `${vessel.length_ft} ft`)}
      {row('Draft', `${vessel.draft_ft} ft`)}
      {row('Propulsion', vessel.propulsion)}
      <button
        onClick={onReset}
        style={{
          marginTop: '1.5rem', width: '100%',
          background: 'none', border: '1px solid #2a2a2a',
          color: '#555', padding: '0.45rem 0',
          borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = '#ef4444'; (e.target as HTMLElement).style.color = '#ef4444' }}
        onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = '#2a2a2a'; (e.target as HTMLElement).style.color = '#555' }}
      >
        Change Vessel
      </button>
    </div>
  )
}

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

  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(340)
  const dragging = useRef<'left' | 'right' | null>(null)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragging.current === 'left') {
        setLeftWidth(Math.max(MIN_W, Math.min(MAX_W, e.clientX)))
      } else if (dragging.current === 'right') {
        setRightWidth(Math.max(MIN_W, Math.min(MAX_W, window.innerWidth - e.clientX)))
      }
    }
    const onUp = () => { dragging.current = null; document.body.style.cursor = '' }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

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

  const panelStyle = (width: number): React.CSSProperties => ({
    width,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#080808',
    overflow: 'hidden',
  })

  const handleStyle: React.CSSProperties = {
    width: 5,
    flexShrink: 0,
    cursor: 'col-resize',
    background: '#111',
    borderLeft: '1px solid #1a1a1a',
    borderRight: '1px solid #1a1a1a',
    transition: 'background 0.15s',
    position: 'relative',
    zIndex: 5,
  }

  const panelHeaderStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #1a1a1a',
    flexShrink: 0,
    color: '#ef4444',
    fontWeight: 700,
    fontSize: '0.68rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>

      {/* Header */}
      <header style={{
        height: 52, flexShrink: 0,
        background: 'rgba(6,6,6,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1a1a1a',
        padding: '0 1.25rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        zIndex: 20,
      }}>
        <span style={{ fontSize: '1.5rem' }}>🔱</span>
        <span style={{ color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em', fontSize: '1.05rem' }}>POSEIDON</span>
        <span style={{ color: '#333', fontSize: '0.78rem' }}>Maritime Intelligence</span>
      </header>

      {/* Main row */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT PANEL — Vessel */}
        <div style={panelStyle(leftWidth)}>
          <div style={panelHeaderStyle}>⚓ Vessel</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {screen === 'setup' ? (
              <VesselSetup onSave={handleVesselSave} />
            ) : vessel ? (
              <VesselCard vessel={vessel} onReset={resetVessel} />
            ) : null}
          </div>
        </div>

        {/* Left resize handle */}
        <div
          style={handleStyle}
          onMouseDown={() => { dragging.current = 'left'; document.body.style.cursor = 'col-resize' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ef444422' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#111' }}
        />

        {/* MAP */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', overflow: 'hidden' }}>
          <RouteMap
            forecast={forecast}
            originPin={originPin}
            destPin={destPin}
            clickMode={clickMode}
            onMapClick={handleMapClick}
          />

          {/* Click-mode instruction banner */}
          {clickMode && (
            <div style={{
              position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20, background: 'rgba(239,68,68,0.9)', color: '#fff',
              padding: '0.35rem 1.1rem', borderRadius: 20, fontSize: '0.82rem',
              fontWeight: 600, pointerEvents: 'none',
              boxShadow: '0 2px 12px rgba(239,68,68,0.4)',
              whiteSpace: 'nowrap',
            }}>
              {clickMode === 'origin' ? '📍 Click map to set origin' : '🏁 Click map to set destination'}
            </div>
          )}

          {/* Weather legend */}
          {forecast.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 16, right: 12, zIndex: 10,
              background: 'rgba(6,6,6,0.88)', backdropFilter: 'blur(8px)',
              border: '1px solid #1e1e1e', borderRadius: 8,
              padding: '0.55rem 0.8rem', fontSize: '0.72rem', color: '#aaa',
            }}>
              <div style={{ color: '#555', marginBottom: '0.35rem', fontWeight: 600, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wind</div>
              {[['#22c55e', '< 10 kts'], ['#eab308', '10–20 kts'], ['#ef4444', '> 20 kts']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.18rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Route (forecast screen only) */}
        {screen === 'forecast' && (
          <>
            {/* Right resize handle */}
            <div
              style={handleStyle}
              onMouseDown={() => { dragging.current = 'right'; document.body.style.cursor = 'col-resize' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ef444422' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#111' }}
            />

            <div style={panelStyle(rightWidth)}>
              <div style={panelHeaderStyle}>🗺 Route</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <RouteForm
                  onSubmit={handleRouteSubmit}
                  originPin={originPin}
                  destPin={destPin}
                  onSetOriginMode={() => setClickMode('origin')}
                  onSetDestMode={() => setClickMode('dest')}
                />
                {messages.length > 0 && (
                  <div style={{ marginTop: '1.25rem', borderTop: '1px solid #1a1a1a', paddingTop: '1rem' }}>
                    {loading && (
                      <div style={{ color: '#444', fontStyle: 'italic', marginBottom: '0.5rem', fontSize: '0.78rem' }}>
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}
