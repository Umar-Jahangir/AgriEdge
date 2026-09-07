"""Backend API tests — run without physical hardware."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root():
  r = client.get("/")
  assert r.status_code == 200
  assert r.json()["offline_capable"] is True


def test_health():
  r = client.get("/api/health")
  assert r.status_code == 200
  data = r.json()
  assert data["status"] == "ok"
  assert "mock_mode" in data


def test_zones():
  r = client.get("/api/zones")
  assert r.status_code == 200
  assert len(r.json()) == 4


def test_dashboard():
  r = client.get("/api/dashboard")
  assert r.status_code == 200
  assert "soil_condition_score" in r.json()


def test_rover_command():
  r = client.post("/api/rover/command", json={"command": "pause"})
  assert r.status_code == 200
  assert r.json()["state"] == "PAUSED"


def test_tts_endpoint_fallback():
  r = client.post("/api/tts/speak", json={"text": "पानी की कमी", "language": "hi"})
  assert r.status_code == 200
  # Without an API key configured, it returns fallback flag gracefully
  data = r.json()
  assert "fallback" in data or r.headers.get("content-type") == "audio/mpeg"


def test_live_weather():
  r = client.get("/api/weather/live")
  assert r.status_code == 200
  data = r.json()
  assert "current_weather" in data
  assert "predictions" in data
  assert "flood" in data["predictions"]
  assert "drought" in data["predictions"]
  assert "heat_stress" in data["predictions"]
  assert "daily_forecast" in data


def test_environmental_risk():
  r = client.get("/api/environmental-risk")
  assert r.status_code == 200
  data = r.json()
  assert "drought_risk" in data
  assert "flood_risk" in data
  assert "current_weather" in data
  assert data["weather_integration_pending"] is False


def test_irrigation_schedule():
  r = client.get("/api/irrigation/schedule")
  assert r.status_code == 200
  data = r.json()
  assert "status" in data
  assert "next_window" in data
  assert "duration_minutes" in data
  assert "water_volume_liters" in data
  assert "water_saved_liters" in data
  assert "relay_state" in data
  assert data["relay_state"]["mode"] in ("AUTO", "MANUAL")


def test_irrigation_valve_control():
  # Set to MANUAL ACTIVE
  r = client.post("/api/irrigation/valve", json={"mode": "MANUAL", "state": "ACTIVE"})
  assert r.status_code == 200
  data = r.json()
  assert data["status"] == "success"
  assert data["relay_state"]["mode"] == "MANUAL"
  assert data["relay_state"]["state"] == "ACTIVE"
  assert data["relay_state"]["pump_active"] is True

  # Set back to AUTO STANDBY
  r2 = client.post("/api/irrigation/valve", json={"mode": "AUTO", "state": "STANDBY"})
  assert r2.status_code == 200
  assert r2.json()["relay_state"]["pump_active"] is False


def test_yield_risk_forecast():
  r = client.get("/api/yield-risk")
  assert r.status_code == 200
  data = r.json()
  assert "overall_yield_risk" in data
  assert "projected_yield_risk_pct" in data
  assert data["yield_saved_quintals_per_acre"] == 1.8
  assert data["pesticide_savings_inr_per_ha"] == 3800
  assert data["revenue_preserved_inr_per_acre"] > 0
  assert len(data["zones"]) == 4
  assert data["zones"][0]["growth_stage"] == "Vegetative Stage"
  assert data["zones"][1]["growth_stage"] == "Flowering & Anthesis"


def test_zone_growth_stages_in_zones_endpoint():
  r = client.get("/api/zones")
  assert r.status_code == 200
  zones = r.json()
  assert len(zones) == 4
  for z in zones:
    assert "growth_stage" in z
    assert "stage_day" in z
    assert "yield_risk_pct" in z


