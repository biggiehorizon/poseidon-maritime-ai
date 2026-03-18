import pytest
from poseidon import build_system_prompt, format_weather_summary

def test_build_system_prompt_includes_vessel_type():
    prompt = build_system_prompt("monohull sailboat", 36, 5.75, "sail")
    assert "monohull sailboat" in prompt
    assert "36" in prompt

def test_build_system_prompt_includes_draft():
    prompt = build_system_prompt("motor yacht", 42, 4.0, "motor")
    assert "4.0" in prompt or "4'" in prompt

def test_format_weather_summary_converts_meters_to_feet():
    forecast = [
        {"lat": 37.8, "lon": -122.4, "eta": "2026-03-18T06:00",
         "wave_height": 1.5, "wave_period": 9.0, "wave_direction": 270,
         "wind_speed_knots": 15.0, "wind_direction": 280,
         "swell_height": 1.0, "swell_period": 11.0},
    ]
    summary = format_weather_summary(forecast)
    assert "15" in summary   # wind knots present
    assert "ft" in summary or "feet" in summary  # wave height in feet

def test_format_weather_summary_includes_wind_direction_name():
    forecast = [
        {"lat": 37.8, "lon": -122.4, "eta": "2026-03-18T06:00",
         "wave_height": 1.2, "wave_period": 8.0, "wave_direction": 270,
         "wind_speed_knots": 12.0, "wind_direction": 270,
         "swell_height": 0.8, "swell_period": 10.0},
    ]
    summary = format_weather_summary(forecast)
    assert "W" in summary  # 270° = West

def test_format_weather_summary_empty_returns_string():
    summary = format_weather_summary([])
    assert isinstance(summary, str)

def test_degrees_to_compass_cardinal_directions():
    from poseidon import degrees_to_compass
    assert degrees_to_compass(0) == "N"
    assert degrees_to_compass(90) == "E"
    assert degrees_to_compass(180) == "S"
    assert degrees_to_compass(270) == "W"

def test_degrees_to_compass_wrapping():
    from poseidon import degrees_to_compass
    assert degrees_to_compass(360) == "N"

def test_meters_to_feet_precision():
    from poseidon import meters_to_feet
    assert meters_to_feet(1.0) == 3.3
    assert meters_to_feet(0.0) == 0.0

def test_format_weather_summary_multiple_points_labels():
    forecast = [
        {"lat": 37.8, "lon": -122.4, "eta": "2026-03-18T06:00", "wave_height": 1.5,
         "wave_period": 9.0, "wave_direction": 270, "wind_speed_knots": 15.0,
         "wind_direction": 280, "swell_height": 1.0, "swell_period": 11.0},
        {"lat": 37.2, "lon": -122.1, "eta": "2026-03-18T09:00", "wave_height": 1.8,
         "wave_period": 9.5, "wave_direction": 275, "wind_speed_knots": 16.0,
         "wind_direction": 285, "swell_height": 1.1, "swell_period": 11.5},
        {"lat": 36.6, "lon": -121.9, "eta": "2026-03-18T12:00", "wave_height": 2.0,
         "wave_period": 10.0, "wave_direction": 280, "wind_speed_knots": 18.0,
         "wind_direction": 290, "swell_height": 1.2, "swell_period": 12.0},
    ]
    summary = format_weather_summary(forecast)
    lines = summary.split("\n")
    assert len(lines) == 3
    assert "Departure" in lines[0]
    assert "Waypoint 1" in lines[1]
    assert "Arrival" in lines[2]

def test_build_system_prompt_contains_poseidon_role():
    prompt = build_system_prompt("monohull sailboat", 36, 5.75, "sail")
    assert "Poseidon" in prompt

def test_degrees_to_compass_boundary_cases():
    from poseidon import degrees_to_compass
    assert degrees_to_compass(0) == "N"
    assert degrees_to_compass(360) == "N"
    assert degrees_to_compass(45) == "NE"
    assert degrees_to_compass(180) == "S"
    assert degrees_to_compass(270) == "W"
