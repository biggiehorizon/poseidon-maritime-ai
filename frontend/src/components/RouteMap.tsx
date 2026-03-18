import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { ForecastPoint } from '../types'

interface Props {
  forecast: ForecastPoint[]
  originPin: [number, number] | null
  destPin: [number, number] | null
  clickMode: 'origin' | 'dest' | null
  onMapClick: (latlng: { lat: number; lng: number }) => void
}

function windColor(kts: number): string {
  if (kts < 10) return '#22c55e'
  if (kts < 20) return '#eab308'
  return '#ef4444'
}

function compassDir(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(deg / 22.5) % 16]
}

function metersToFeet(m: number): string {
  return (m * 3.28084).toFixed(1)
}

function ClickHandler({ clickMode, onMapClick }: { clickMode: string | null; onMapClick: (ll: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => {
      if (clickMode) onMapClick(e.latlng)
    },
  })
  return null
}

function ZoomToRoute({ forecast, originPin, destPin }: { forecast: ForecastPoint[]; originPin: [number, number] | null; destPin: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (forecast.length > 0) {
      const lats = forecast.map(p => p.lat)
      const lons = forecast.map(p => p.lon)
      const pad = 0.3
      map.fitBounds([
        [Math.min(...lats) - pad, Math.min(...lons) - pad],
        [Math.max(...lats) + pad, Math.max(...lons) + pad],
      ], { animate: true, duration: 1 })
    } else if (originPin && destPin) {
      map.fitBounds([originPin, destPin], { padding: [60, 60], animate: true })
    }
  }, [forecast, originPin, destPin, map])

  return null
}

export default function RouteMap({ forecast, originPin, destPin, clickMode, onMapClick }: Props) {
  const positions: [number, number][] = forecast.map(p => [p.lat, p.lon])

  const mapCursor = clickMode ? 'crosshair' : 'grab'

  return (
    <MapContainer
      center={[37.5, -122.5]}
      zoom={7}
      style={{ width: '100%', height: '100%', cursor: mapCursor }}
      zoomControl={false}
    >
      {/* Esri Ocean basemap — high-contrast blue water with depth shading */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, NGA, NHD'
        maxZoom={13}
      />
      {/* Esri Ocean reference layer — labels and coastal features */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}"
        maxZoom={13}
        opacity={0.9}
      />
      {/* OpenSeaMap nautical overlay */}
      <TileLayer
        url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
        opacity={0.55}
      />

      <ClickHandler clickMode={clickMode} onMapClick={onMapClick} />
      <ZoomToRoute forecast={forecast} originPin={originPin} destPin={destPin} />

      {/* Origin pin */}
      {originPin && (
        <CircleMarker
          center={originPin}
          radius={10}
          pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#111', color: '#ccc', padding: '0.25rem' }}>
              <strong style={{ color: '#22c55e' }}>⚓ Origin</strong><br />
              {originPin[0].toFixed(4)}, {originPin[1].toFixed(4)}
            </div>
          </Popup>
        </CircleMarker>
      )}

      {/* Destination pin */}
      {destPin && (
        <CircleMarker
          center={destPin}
          radius={10}
          pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 1, weight: 2 }}
        >
          <Popup>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#111', color: '#ccc', padding: '0.25rem' }}>
              <strong style={{ color: '#ef4444' }}>🏁 Destination</strong><br />
              {destPin[0].toFixed(4)}, {destPin[1].toFixed(4)}
            </div>
          </Popup>
        </CircleMarker>
      )}

      {/* Connector line between pins when no forecast yet */}
      {originPin && destPin && positions.length === 0 && (
        <Polyline
          positions={[originPin, destPin]}
          pathOptions={{ color: '#3b82f6', weight: 2, dashArray: '6 4', opacity: 0.5 }}
        />
      )}

      {/* Forecast route line */}
      {positions.length > 1 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.85 }}
        />
      )}

      {/* Weather waypoints */}
      {forecast.map((pt, i) => {
        const color = windColor(pt.wind_speed_knots)
        const isEnd = i === 0 || i === forecast.length - 1
        return (
          <CircleMarker
            key={i}
            center={[pt.lat, pt.lon]}
            radius={isEnd ? 10 : 7}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.9, weight: isEnd ? 2.5 : 1.5 }}
          >
            <Popup>
              <div style={{
                fontFamily: 'monospace', fontSize: '0.8rem',
                background: '#0a0a0a', color: '#ccc', padding: '0.35rem 0.5rem',
                minWidth: 140,
              }}>
                <strong style={{ color }}>
                  {i === 0 ? '⚓ Departure' : i === forecast.length - 1 ? '🏁 Arrival' : `WP ${i}`}
                </strong>
                <div style={{ color: '#666', marginBottom: '0.25rem', fontSize: '0.72rem' }}>{pt.eta.slice(11, 16)} UTC</div>
                <div>💨 {pt.wind_speed_knots} kts {compassDir(pt.wind_direction)}</div>
                <div>🌊 {metersToFeet(pt.wave_height)}ft @ {pt.wave_period}s</div>
                <div>〰️ Swell {metersToFeet(pt.swell_height)}ft @ {pt.swell_period}s</div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
