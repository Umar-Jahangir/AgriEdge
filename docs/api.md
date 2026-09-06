# API Documentation

Base URL: `http://localhost:8000/api`

Interactive docs: `http://localhost:8000/docs`

## Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health, mock mode, hardware status |
| GET | `/farm` | Farm overview with zones |
| GET | `/zones` | List all zones |
| GET | `/zones/{zone_id}` | Zone detail with AI + recommendations |
| GET | `/dashboard` | Dashboard summary KPIs |
| GET | `/sensors/latest` | Latest sensor readings |
| POST | `/sensors/telemetry` | Ingest telemetry (ESP32 or manual) |
| GET | `/ai/results` | AI analysis for a zone |
| POST | `/images/analyze` | Capture + analyze crop image |
| GET | `/recommendations` | Farmer recommendations |
| GET | `/alerts` | Active alerts |
| GET | `/rover/status` | Rover status |
| POST | `/rover/command` | Rover control (`start`, `pause`, `resume`, `return`, `emergency_stop`) |

## Legacy Compatibility

The frontend also supports these endpoints from the initial prototype:

- `GET /api/ai-analysis`
- `GET /api/farm-zones`
- `POST /api/rover/start`, `/pause`, `/resume`, `/return`, `/emergency-stop`

## Response Schemas

Defined in `backend/app/schemas/api.py` using Pydantic.

## Error Handling

- `503` — Camera or ESP32 unavailable (backend continues running)
- `422` — Validation error on sensor telemetry
- AI models unavailable → returns demo predictions with `is_demo: true`
