# AgriEdge Rover

**Offline-First Edge AI Smart Farming Assistant**

SIH 2026 — Autonomous 4-wheel agricultural rover with local AI, IoT sensing, and farmer advisory.

## Core Principle

```
LOCAL AI + LOCAL DATA + LOCAL DECISIONS
```

The system works **completely offline**. Internet is optional.

## What It Does

An autonomous rover moves through farm zones collecting:
- **Soil data** — moisture, temperature, pH, EC, NPK
- **Environmental data** — air temperature, humidity (DHT22)
- **Crop images** — disease, pest, nutrient visual analysis

Data flows: `Sensors → ESP32 → Raspberry Pi → Local AI → Recommendations → Dashboard`

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- (Optional) PlatformIO for ESP32 firmware

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
# From backend/ directory:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://localhost:5173

Login with any credentials (demo mode).

### 3. Connect Frontend to Backend

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

With `VITE_USE_MOCK=true` (default), frontend uses its own mock data without backend.

## Project Structure

```
agriedge-rover/
├── frontend/          React + TypeScript farmer dashboard
├── backend/           FastAPI + SQLite local server
├── ai/                  Training & inference pipelines
├── esp32/               Rover firmware (PlatformIO)
├── data/                Datasets (raw/processed/own)
├── models/              Exported ONNX models
├── config/              app.yaml, hardware.yaml, thresholds.yaml
├── scripts/             Dataset preparation
├── docs/                Architecture, API, deployment docs
└── tests/
```

## Operating Modes

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCK_MODE` | `true` | Simulated sensors/camera/rover |
| `DEMO_MODE` | `true` | Predefined zone scenarios for demo |
| `CLOUD_SYNC_ENABLED` | `false` | Cloud disabled |

## Demo Zones

| Zone | Scenario |
|------|----------|
| ZONE_A | Healthy |
| ZONE_B | Possible water stress |
| ZONE_C | Possible disease |
| ZONE_D | Pest detected |

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Done | Architecture & repository structure |
| 2 | ✅ Done | Backend + SQLite skeleton |
| 3 | ✅ Done | Frontend dashboard (mock data) |
| 4 | 🔲 | ESP32 serial integration (real hardware) |
| 5 | ✅ Done (Main PC) | Dataset acquisition scripts + PV/PlantDoc/IP102 verified locally |
| 6 | 🔄 In progress | Disease model — MobileNetV3 CPU benchmark done; EfficientNet → GPU laptop |
| 7 | 🔲 | Train pest model |
| 8 | 🔲 | Train nutrient model |
| 9 | 🔲 | Train nitrogen model |
| 10 | 🔲 | Raspberry Pi inference deployment |
| 11 | 🔲 | Sensor analysis (production thresholds) |
| 12 | 🔲 | Multimodal fusion (production) |
| 13 | 🔲 | Real ESP32 telemetry |
| 14 | 🔲 | Real Pi camera |
| 15 | 🔲 | Rover motor control |
| 16 | 🔲 | End-to-end field testing |

## Multi-machine workflow

- **Main PC + Cursor** — software / integration
- **GPU laptop + Antigravity** — model training / evaluation (CUDA)
- **GitHub** — source of truth (code/docs/config; **not** datasets or weight binaries)
- **Raspberry Pi 4** — Edge deployment

See [Development workflow](docs/dev_workflow.md).

## Documentation

- [Architecture](docs/architecture.md)
- [Development workflow](docs/dev_workflow.md)
- [AI Pipeline](docs/ai_pipeline.md)
- [Disease model report](docs/disease_model_report.md)
- [Software status](docs/software_status.md)
- [Datasets](docs/dataset.md)
- [API](docs/api.md)
- [Hardware Interface](docs/hardware_interface.md)
- [Deployment](docs/deployment.md)
- [Testing](docs/testing.md)

## Hardware Info Still Required

The following must be provided by the hardware team before final integration:

- ESP32 board model and GPIO pin assignments
- Soil sensor models, interfaces, and calibration
- Motor driver IC and wiring
- Battery specifications
- Raspberry Pi model
- Camera module model
- Exact serial port on Pi

Until then, all hardware config uses **placeholders** in `config/hardware.yaml`.

## License

SIH 2026 Academic Project
