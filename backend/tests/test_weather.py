import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from weather import sample_route_points, fetch_marine_weather, build_route_forecast

def test_sample_route_points_returns_correct_count():
    # SF to Monterey
    points = sample_route_points(37.8, -122.4, 36.6, -121.9, n=5)
    assert len(points) == 5

def test_sample_route_points_start_and_end():
    points = sample_route_points(37.8, -122.4, 36.6, -121.9, n=5)
    assert abs(points[0][0] - 37.8) < 0.001
    assert abs(points[-1][0] - 36.6) < 0.001

def test_sample_route_points_minimum_two():
    points = sample_route_points(37.8, -122.4, 36.6, -121.9, n=2)
    assert len(points) == 2

@pytest.mark.asyncio
async def test_fetch_marine_weather_returns_expected_keys():
    mock_marine = {
        "hourly": {
            "time": ["2026-03-18T00:00", "2026-03-18T01:00"],
            "wave_height": [1.2, 1.4],
            "wave_period": [8.0, 8.5],
            "wave_direction": [270, 272],
            "swell_wave_height": [0.8, 0.9],
            "swell_wave_period": [10.0, 10.5],
        }
    }
    mock_wind = {
        "hourly": {
            "time": ["2026-03-18T00:00", "2026-03-18T01:00"],
            "wind_speed_10m": [6.2, 6.7],
            "wind_direction_10m": [280, 282],
        }
    }
    with patch("weather.httpx.AsyncClient") as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        # asyncio.gather calls client.get() twice — return different responses per call
        marine_resp = MagicMock()
        marine_resp.json.return_value = mock_marine
        wind_resp = MagicMock()
        wind_resp.json.return_value = mock_wind
        mock_client.get = AsyncMock(side_effect=[marine_resp, wind_resp])
        mock_client_class.return_value = mock_client

        result = await fetch_marine_weather(37.8, -122.4, "2026-03-18T06:00")
        assert "wave_height" in result
        assert "wind_speed_knots" in result  # converted from m/s

@pytest.mark.asyncio
async def test_build_route_forecast_returns_list():
    with patch("weather.fetch_marine_weather") as mock_fetch:
        mock_fetch.return_value = {
            "wave_height": 1.5,
            "wave_period": 9.0,
            "wave_direction": 270,
            "wind_speed_knots": 12.0,
            "wind_direction": 280,
            "swell_height": 1.0,
            "swell_period": 11.0,
        }
        points = await build_route_forecast(37.8, -122.4, 36.6, -121.9, "2026-03-18T06:00", vessel_speed_kts=6.0)
        assert isinstance(points, list)
        assert len(points) >= 3
        assert "lat" in points[0]
        assert "wave_height" in points[0]
