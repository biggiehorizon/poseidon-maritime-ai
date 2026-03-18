import { render, screen } from '@testing-library/react'
import App from './App'

// Mock react-leaflet so tests don't break on jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Polyline: () => null,
  CircleMarker: () => null,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

test('shows vessel setup screen on load', () => {
  render(<App />)
  expect(screen.getByText(/register your vessel/i)).toBeInTheDocument()
})
