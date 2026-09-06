# AgriEdge Rover — System Architecture

## Overview

AgriEdge Rover is an **offline-first, edge-AI smart farming platform** built around an autonomous 4-wheel agricultural rover. The system collects soil, environmental, and crop image data across farm zones, processes it locally on a Raspberry Pi, and provides farmer-friendly recommendations — **without requiring Internet connectivity**.

## Core Principle

```
LOCAL AI + LOCAL DATA + LOCAL DECISIONS
```

Internet/cloud is an optional enhancement, never a hard dependency.

## Architecture Diagram

```
                         AGRIEDGE ROVER

       ┌──────────────────────┐
       │      ESP32           │
       │  Soil Sensors        │
       │  DHT22               │
       │  Ultrasonic          │
       │  Motor Control       │
       └──────────┬───────────┘
                  │ USB / Serial (JSON)
                  ▼
       ┌──────────────────────┐
       │    RASPBERRY PI      │
       │  FastAPI Backend     │
       │  SQLite Database     │
       │  Camera (PiCamera2)  │
       │  AI Inference (ONNX) │
       │  Decision Engine     │
       │  Dashboard Server    │
       └──────────┬───────────┘
                  │ Local Wi-Fi (optional)
                  ▼
             FARMER PHONE / LAPTOP
                  │
                  ▼
          LOCAL WEB DASHBOARD

Optional (disabled by default):
  Raspberry Pi ──[Internet]──► Cloud Sync / Weather API
```

## Data Flow Pipeline

```
Sensors → ESP32 → Serial → Raspberry Pi Backend
                                ↓
                          Camera Capture
                                ↓
                    ┌───────────┴───────────┐
                    ▼                       ▼
              Sensor Analysis          AI Vision Models
              (rule engine)            (disease/pest/nutrient)
                    │                       │
                    └───────────┬───────────┘
                                ▼
                        Decision Engine
                        (multimodal fusion)
                                ▼
                        Recommendations
                                ▼
                     SQLite + Dashboard
```

## Monorepo Structure

| Directory | Purpose |
|-----------|---------|
| `frontend/` | React farmer dashboard |
| `backend/` | FastAPI local server |
| `ai/` | Training, inference, export pipelines |
| `esp32/` | Rover firmware (PlatformIO) |
| `data/` | Datasets (raw, processed, own) |
| `models/` | Exported ONNX models for Pi inference |
| `config/` | App, hardware, threshold configuration |
| `scripts/` | Dataset preparation scripts |
| `docs/` | Documentation |

## Operating Modes

| Mode | Description |
|------|-------------|
| `MOCK_MODE=true` | Simulated sensors, camera, rover — no hardware needed |
| `DEMO_MODE=true` | Predefined zone scenarios for SIH presentation |
| `CLOUD_SYNC_ENABLED=false` | Cloud disabled by default |

## Demo Zone Scenarios

| Zone | Scenario |
|------|----------|
| ZONE_A | Healthy |
| ZONE_B | Possible water stress |
| ZONE_C | Possible disease |
| ZONE_D | Pest detected |

## Key Design Decisions

1. **SQLite** for local-first storage (no PostgreSQL/cloud DB required)
2. **Configurable thresholds** in `config/thresholds.yaml` (not hard-coded agronomic values)
3. **Hardware-agnostic** pin configuration in `config/hardware.yaml` (placeholders until wiring confirmed)
4. **Separate AI models** for disease, pest, nutrient, nitrogen — not a single monolithic model
5. **Multimodal fusion** in `decision_engine/` — combines vision + sensor evidence
6. **Scientifically responsible** language — "possible disease", not "confirmed diagnosis"

## Phase Roadmap

See root `README.md` for the 16-phase development plan.
