import { render, screen } from '@testing-library/react'
import RouteMap from '../RouteMap'
import type { ForecastPoint } from '../../types'

// Leaflet requires DOM methods that jsdom doesn't fully support — mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Polyline: () => null,
  CircleMarker: () => null,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockForecast: ForecastPoint[] = [
  { lat: 37.8, lon: -122.4, eta: '2026-03-18T06:00', wave_height: 1.5,
    wave_period: 9, wave_direction: 270, wind_speed_knots: 15, wind_direction: 280,
    swell_height: 1.0, swell_period: 11 },
  { lat: 36.6, lon: -121.9, eta: '2026-03-18T08:00', wave_height: 1.2,
    wave_period: 8, wave_direction: 265, wind_speed_knots: 12, wind_direction: 275,
    swell_height: 0.8, swell_period: 10 },
]

test('renders map container', () => {
  render(<RouteMap forecast={mockForecast} />)
  expect(screen.getByTestId('map')).toBeInTheDocument()
})

test('renders without forecast', () => {
  render(<RouteMap forecast={[]} />)
  expect(screen.getByTestId('map')).toBeInTheDocument()
})
