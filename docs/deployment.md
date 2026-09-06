# Deployment Guide

## Raspberry Pi (Production)

1. Install Raspberry Pi OS (64-bit)
2. Install Python 3.11+
3. Clone repository to Pi
4. Install backend dependencies: `pip install -r backend/requirements.txt`
5. Set `.env`: `MOCK_MODE=false`
6. Configure `config/hardware.yaml` with actual pins
7. Build frontend: `cd frontend && npm run build`
8. Serve frontend via backend static files or nginx
9. Run: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
10. Copy trained ONNX models to `models/`

## Development Machine

```bash
# Backend
cd backend
pip install -r requirements.txt
MOCK_MODE=true uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## ESP32

```bash
cd esp32
pio run -e esp32dev -t upload
```

## Systemd Service (Pi)

Create `/etc/systemd/system/agriedge.service` to auto-start backend on boot.

## Offline Verification

Disconnect Internet and verify:
- Dashboard loads on local network
- Sensor data stored in SQLite
- AI inference runs locally
- Recommendations generated
- Rover commands work via serial
