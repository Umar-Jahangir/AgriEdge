# Hardware Interface

## Communication

| Link | Protocol | Notes |
|------|----------|-------|
| ESP32 ↔ Raspberry Pi | USB Serial, JSON lines | Primary data path |
| Pi ↔ Farmer device | Local Wi-Fi HTTP | Optional |
| Internet | Optional | Cloud sync disabled by default |

**LoRa is NOT used.**

## ESP32 Serial Protocol

### Telemetry (ESP32 → Pi)

```json
{
  "type": "telemetry",
  "zone": "ZONE_A",
  "soil_moisture": 34.2,
  "soil_temperature": 27.4,
  "ph": 6.8,
  "ec": 1.2,
  "n": 45,
  "p": 21,
  "k": 37,
  "air_temperature": 31.1,
  "humidity": 67.2,
  "obstacle_distance_cm": 84
}
```

### Command (Pi → ESP32)

```json
{
  "type": "command",
  "action": "forward"
}
```

## Pin Configuration

All GPIO pins are **placeholders** in `config/hardware.yaml` and `esp32/include/pins.h`.

**Required from hardware team:**

- ESP32 board model
- Soil sensor models and interfaces (analog/digital/I2C)
- DS18B20 wiring pin
- DHT22 pin
- Ultrasonic trigger/echo pins
- Motor driver IC and pin mapping
- Battery voltages
- Raspberry Pi model
- Camera module model

## Failure Handling

| Failure | Behavior |
|---------|----------|
| ESP32 disconnect | Dashboard shows "Sensor connection unavailable" |
| Camera failure | "Camera unavailable" — sensors continue |
| AI model missing | "AI analysis unavailable" — demo mode fallback |
| Database error | Logged, API returns error without crash |
