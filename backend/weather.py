import asyncio
import math
from datetime import datetime, timedelta
import httpx

OPEN_METEO_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"

MS_TO_KNOTS = 1.94384


def sample_route_points(lat1: float, lon1: float, lat2: float, lon2: float, n: int = 5) -> list:
    """Linear interpolation of N points between two lat/lon coordinates."""
    if n < 1:
        raise ValueError("n must be >= 1")
    points = []
    for i in range(n):
        t = i / (n - 1) if n > 1 else 0.0
        lat = lat1 + t * (lat2 - lat1)
        lon = lon1 + t * (lon2 - lon1)
        points.append((lat, lon))
    return points


async def fetch_marine_weather(lat: float, lon: float, target_time_iso: str) -> dict:
    """Fetch marine weather for a lat/lon at a specific hour.

    Uses parallel requests: marine API for wave/swell data, forecast API for wind data.
    Wind variables (wind_speed_10m, wind_direction_10m) are NOT available on the marine endpoint.
    """
    marine_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period",
        "forecast_days": 7,
        "timezone": "UTC",
    }
    wind_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "wind_speed_10m,wind_direction_10m",
        "forecast_days": 7,
        "timezone": "UTC",
    }
    async with httpx.AsyncClient() as client:
        marine_resp, wind_resp = await asyncio.gather(
            client.get(OPEN_METEO_MARINE_URL, params=marine_params),
            client.get("https://api.open-meteo.com/v1/forecast", params=wind_params),
        )
        marine = marine_resp.json()
        wind = wind_resp.json()

    target_dt = datetime.fromisoformat(target_time_iso.replace("Z", ""))
    times = [datetime.fromisoformat(t) for t in marine["hourly"]["time"]]
    idx = min(range(len(times)), key=lambda i: abs((times[i] - target_dt).total_seconds()))

    return {
        "wave_height": marine["hourly"]["wave_height"][idx],
        "wave_period": marine["hourly"]["wave_period"][idx],
        "wave_direction": marine["hourly"]["wave_direction"][idx],
        "wind_speed_knots": round(wind["hourly"]["wind_speed_10m"][idx] * MS_TO_KNOTS, 1),
        "wind_direction": wind["hourly"]["wind_direction_10m"][idx],
        "swell_height": marine["hourly"]["swell_wave_height"][idx],
        "swell_period": marine["hourly"]["swell_wave_period"][idx],
    }


async def build_route_forecast(
    lat1: float, lon1: float,
    lat2: float, lon2: float,
    departure_iso: str,
    vessel_speed_kts: float = 6.0,
    n_points: int = 5,
) -> list:
    """Sample N points along route, fetch weather at estimated arrival time for each."""
    if vessel_speed_kts <= 0:
        raise ValueError("vessel_speed_kts must be > 0")

    points = sample_route_points(lat1, lon1, lat2, lon2, n=n_points)
    departure = datetime.fromisoformat(departure_iso.replace("Z", ""))

    def haversine_nm(lat_a, lon_a, lat_b, lon_b):
        R = 3440.065  # nautical miles
        phi1, phi2 = math.radians(lat_a), math.radians(lat_b)
        dphi = math.radians(lat_b - lat_a)
        dlambda = math.radians(lon_b - lon_a)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    total_nm = haversine_nm(lat1, lon1, lat2, lon2)

    result = []
    for i, (lat, lon) in enumerate(points):
        t = i / (len(points) - 1) if len(points) > 1 else 0
        nm_covered = t * total_nm
        hours_elapsed = nm_covered / vessel_speed_kts
        eta = departure + timedelta(hours=hours_elapsed)
        weather = await fetch_marine_weather(lat, lon, eta.isoformat())
        result.append({"lat": lat, "lon": lon, "eta": eta.isoformat(), **weather})

    return result
