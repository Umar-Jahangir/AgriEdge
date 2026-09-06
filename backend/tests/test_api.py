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
