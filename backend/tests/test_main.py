import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from main import app

@pytest.fixture(autouse=True)
def clear_vessels():
    from main import vessels
    vessels.clear()
    yield
    vessels.clear()

@pytest.mark.asyncio
async def test_save_and_retrieve_vessel():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/vessel", json={
            "name": "Sea Witch",
            "type": "monohull sailboat",
            "length_ft": 36,
            "draft_ft": 5.75,
            "propulsion": "sail",
        })
        assert resp.status_code == 200
        vessel_id = resp.json()["vessel_id"]

        resp2 = await ac.get(f"/api/vessel/{vessel_id}")
        assert resp2.status_code == 200
        assert resp2.json()["name"] == "Sea Witch"

@pytest.mark.asyncio
async def test_get_vessel_not_found():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.get("/api/vessel/nonexistent")
        assert resp.status_code == 404

@pytest.mark.asyncio
async def test_chat_endpoint_returns_poseidon_response():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Create vessel first
        vessel_resp = await ac.post("/api/vessel", json={
            "name": "Sea Witch", "type": "monohull sailboat",
            "length_ft": 36, "draft_ft": 5.75, "propulsion": "sail",
        })
        vessel_id = vessel_resp.json()["vessel_id"]

        with patch("main.build_route_forecast") as mock_wx, \
             patch("main.gradient_client.chat") as mock_chat:
            mock_wx.return_value = [
                {"lat": 37.8, "lon": -122.4, "eta": "2026-03-18T06:00",
                 "wave_height": 1.5, "wave_period": 9.0, "wave_direction": 270,
                 "wind_speed_knots": 15.0, "wind_direction": 280,
                 "swell_height": 1.0, "swell_period": 11.0},
            ]
            mock_chat.return_value = "The Pacific is in a cooperative mood today. Mostly."

            resp = await ac.post("/api/chat", json={
                "vessel_id": vessel_id,
                "origin_lat": 37.8, "origin_lon": -122.4,
                "dest_lat": 36.6, "dest_lon": -121.9,
                "departure_iso": "2026-03-18T06:00",
                "message": "What's the forecast for Half Moon Bay to Santa Cruz?",
            })
            assert resp.status_code == 200
            assert resp.json()["response"] == "The Pacific is in a cooperative mood today. Mostly."

@pytest.mark.asyncio
async def test_chat_unknown_vessel_returns_404():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        resp = await ac.post("/api/chat", json={
            "vessel_id": "bad-id",
            "origin_lat": 37.8, "origin_lon": -122.4,
            "dest_lat": 36.6, "dest_lon": -121.9,
            "departure_iso": "2026-03-18T06:00",
            "message": "What's the weather?",
        })
        assert resp.status_code == 404
