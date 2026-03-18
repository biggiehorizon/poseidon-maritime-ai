export interface VesselProfile {
  name: string
  type: string
  length_ft: number
  draft_ft: number
  propulsion: 'sail' | 'motor' | 'both'
}

export interface ForecastPoint {
  lat: number
  lon: number
  eta: string
  wave_height: number
  wave_period: number
  wave_direction: number
  wind_speed_knots: number
  wind_direction: number
  swell_height: number
  swell_period: number
}

export interface ChatMessage {
  role: 'user' | 'poseidon'
  content: string
}
