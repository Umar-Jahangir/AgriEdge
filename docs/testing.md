# Testing Guide

## Backend Tests

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

Tests run **without physical hardware** using mock mode.

## Test Coverage

| Area | Location | Hardware Required |
|------|----------|-------------------|
| API endpoints | `backend/tests/test_api.py` | No |
| Sensor parsing | TODO | No |
| Decision engine | TODO | No |
| Serial communication | TODO (mock) | No |
| AI inference | TODO (mock) | No |
| Frontend components | TODO | No |

## Mock Mode Testing

Set `MOCK_MODE=true` to test the full pipeline without rover, sensors, or camera.

## Demo Mode Testing

Set `DEMO_MODE=true` to verify all four zone scenarios:
- ZONE_A: Healthy
- ZONE_B: Water stress
- ZONE_C: Disease
- ZONE_D: Pest

## End-to-End Demo Checklist

1. Rover enters zone → ESP32 sends telemetry
2. Pi receives and stores data
3. Camera captures image
4. AI models analyze image
5. Sensor analysis runs
6. Decision engine fuses results
7. Recommendation generated
8. Dashboard updates
9. Disconnect Internet → system continues
