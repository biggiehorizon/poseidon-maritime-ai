import type { VesselProfile, ForecastPoint } from './types'

const BASE = import.meta.env.VITE_API_URL ?? ''

export async function saveVessel(profile: VesselProfile): Promise<string> {
  const resp = await fetch(`${BASE}/api/vessel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!resp.ok) throw new Error('Failed to save vessel')
  const data = await resp.json()
  return data.vessel_id
}

export async function sendChat(params: {
  vessel_id: string
  origin_lat: number
  origin_lon: number
  dest_lat: number
  dest_lon: number
  departure_iso: string
  message: string
}): Promise<{ response: string; forecast: ForecastPoint[] }> {
  const resp = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ detail: 'Unknown error' }))
    const detail = Array.isArray(err.detail) ? err.detail.map((e: { msg: string }) => e.msg).join('; ') : err.detail
    throw new Error(detail)
  }
  return resp.json()
}
