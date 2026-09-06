# Smart Farming Assistant — Frontend Dashboard

AI-Powered Smart Farming Assistant dashboard for SIH 2026. A professional web interface for an autonomous agricultural rover + IoT sensing + Edge AI + farmer advisory platform.

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Recharts
- Lucide React
- React Router 7

## Installation

```bash
cd smart-farming-dashboard
npm install
```

## Run Development Server

```bash
npm run dev
```

Open http://localhost:5173 — login with any credentials (demo mode).

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ai/              # AI pipeline visualization
│   ├── alerts/          # Alert components
│   ├── farm/            # Farm map, zones, NPK gauges
│   ├── layout/          # Sidebar, Header
│   ├── recommendations/ # Recommendation cards
│   ├── rover/           # Rover status & controls
│   └── ui/              # Reusable UI (cards, charts, badges)
├── context/             # Auth context
├── data/
│   └── mockData.ts      # ← Replace with API calls
├── hooks/               # Data fetching hooks
├── layouts/             # Page layouts
├── pages/               # All route pages
├── services/
│   ├── api.ts           # ← API service layer (mock ↔ FastAPI)
│   └── config.ts        # API endpoints & config
├── types/               # TypeScript interfaces
└── utils/               # Formatting helpers
```

## Connecting to FastAPI Backend

### Step 1: Environment Variables

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCK=false
```

### Step 2: API Service Layer

All data flows through `src/services/api.ts`. Each function checks `API_CONFIG.USE_MOCK`:

- **Mock mode** (`VITE_USE_MOCK=true`, default): Returns data from `src/data/mockData.ts`
- **Live mode** (`VITE_USE_MOCK=false`): Calls FastAPI endpoints defined in `src/services/config.ts`

### Step 3: Replace Mock Data

When your FastAPI backend is ready, implement these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Dashboard summary KPIs |
| `/api/sensors/latest` | GET | Latest sensor readings |
| `/api/sensors/history?range=` | GET | Historical sensor data |
| `/api/soil-analysis` | GET | Soil condition analysis |
| `/api/crop-analysis` | GET | Crop image analyses |
| `/api/recommendations` | GET | AI recommendations |
| `/api/alerts?filter=` | GET | Alerts & events |
| `/api/rover/status` | GET | Rover status |
| `/api/rover/start` | POST | Start mission |
| `/api/rover/pause` | POST | Pause mission |
| `/api/rover/resume` | POST | Resume mission |
| `/api/rover/return` | POST | Return to base |
| `/api/rover/emergency-stop` | POST | Emergency stop |
| `/api/environmental-risk` | GET | Environmental risk data |
| `/api/analytics?range=` | GET | Historical analytics |
| `/api/farm-zones` | GET | Farm zone data |
| `/api/farm-map` | GET | Farm map & sampling points |
| `/api/ai-analysis` | GET | AI analysis results |
| `/api/system-status` | GET | System connectivity status |

Response shapes are defined in `src/types/index.ts`.

### Step 4: No UI Changes Needed

Components use hooks (`useDashboard`, `useSoilAnalysis`, etc.) which call the API service. Switching from mock to live requires only the env variable change.

## Real-Time Updates (WebSockets / MQTT)

For live sensor data when hardware is connected:

### Option A: WebSocket via FastAPI

```python
# FastAPI backend
@app.websocket("/ws/sensors")
async def sensor_ws(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await get_latest_sensor_reading()
        await websocket.send_json(data)
        await asyncio.sleep(5)
```

```typescript
// Frontend: src/hooks/useRealtimeSensors.ts
const ws = new WebSocket(`${WS_URL}/ws/sensors`);
ws.onmessage = (event) => setSensorData(JSON.parse(event.data));
```

### Option B: MQTT Bridge

ESP32 → MQTT Broker → FastAPI subscriber → WebSocket to frontend

1. ESP32 publishes sensor data to MQTT topics (e.g., `farm/soil/moisture`)
2. FastAPI subscribes and forwards to WebSocket clients
3. Frontend `useRealtimeSensors` hook updates dashboard in real-time

### Integration Points

- `src/hooks/useData.ts` — Add `useRealtimeSensors()` hook
- `src/services/api.ts` — Add WebSocket connection manager
- Dashboard/Rover pages — Subscribe to real-time updates

## Demo Mode

The app runs in demo mode by default with simulated sensor values. A "DEMO MODE" indicator is shown in the header. Rover control buttons simulate local state changes only.

## Login

Prototype authentication — any email/password combination works. Session persists in `sessionStorage`.
