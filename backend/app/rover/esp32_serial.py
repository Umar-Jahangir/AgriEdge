"""ESP32 serial communication — mock and real implementations."""

import json
import logging
import random
from datetime import datetime
from typing import Protocol

from app.config import get_settings
from app.schemas.api import SensorTelemetry

logger = logging.getLogger(__name__)
settings = get_settings()


class ESP32Interface(Protocol):
  def is_connected(self) -> bool: ...
  def read_telemetry(self) -> SensorTelemetry | None: ...
  def send_command(self, command: str) -> bool: ...


class MockESP32:
  """Simulates ESP32 telemetry for development without hardware."""

  def __init__(self):
    self._connected = True
    self._zone = "ZONE_B"
    self._point = 14

  def is_connected(self) -> bool:
    return self._connected

  def read_telemetry(self) -> SensorTelemetry | None:
    if not self._connected:
      return None
    return SensorTelemetry(
      zone_id=self._zone,
      timestamp=datetime.utcnow(),
      soil_moisture=round(35 + random.uniform(-8, 8), 1),
      soil_temperature=round(25 + random.uniform(-2, 3), 1),
      ph=round(6.5 + random.uniform(-0.3, 0.3), 1),
      ec=round(1.2 + random.uniform(-0.2, 0.2), 2),
      nitrogen=round(48 + random.uniform(-10, 10), 1),
      phosphorus=round(27 + random.uniform(-5, 5), 1),
      potassium=round(42 + random.uniform(-5, 5), 1),
      air_temperature=round(30 + random.uniform(-3, 4), 1),
      humidity=round(60 + random.uniform(-10, 10), 1),
      obstacle_distance_cm=round(80 + random.uniform(-20, 40), 1),
    )

  def send_command(self, command: str) -> bool:
    logger.info("Mock ESP32 command: %s", command)
    return True

  def simulate_disconnect(self):
    self._connected = False
    logger.warning("Mock ESP32 disconnected")


class SerialESP32:
  """Real ESP32 serial communication — activated when MOCK_MODE=false and hardware connected."""

  def __init__(self, port: str, baud: int):
    self.port = port
    self.baud = baud
    self._serial = None
    self._connected = False

  def connect(self) -> bool:
    try:
      import serial
      self._serial = serial.Serial(self.port, self.baud, timeout=2)
      self._connected = True
      logger.info("ESP32 connected on %s", self.port)
      return True
    except Exception as e:
      logger.error("ESP32 connection failed: %s", e)
      self._connected = False
      return False

  def is_connected(self) -> bool:
    return self._connected and self._serial is not None and self._serial.is_open

  def read_telemetry(self) -> SensorTelemetry | None:
    if not self.is_connected():
      return None
    try:
      line = self._serial.readline().decode("utf-8").strip()
      if not line:
        return None
      data = json.loads(line)
      if data.get("type") != "telemetry":
        return None
      return SensorTelemetry(
        zone_id=data.get("zone", "UNKNOWN"),
        soil_moisture=data.get("soil_moisture"),
        soil_temperature=data.get("soil_temperature"),
        ph=data.get("ph"),
        ec=data.get("ec"),
        nitrogen=data.get("n"),
        phosphorus=data.get("p"),
        potassium=data.get("k"),
        air_temperature=data.get("air_temperature"),
        humidity=data.get("humidity"),
        obstacle_distance_cm=data.get("obstacle_distance_cm"),
      )
    except Exception as e:
      logger.error("ESP32 telemetry parse error: %s", e)
      return None

  def send_command(self, command: str) -> bool:
    if not self.is_connected():
      return False
    try:
      payload = json.dumps({"type": "command", "action": command})
      self._serial.write((payload + "\n").encode())
      return True
    except Exception as e:
      logger.error("ESP32 command error: %s", e)
      return False


def get_esp32() -> ESP32Interface:
  if settings.mock_mode:
    return MockESP32()
  esp = SerialESP32(settings.esp32_serial_port, settings.esp32_baud_rate)
  esp.connect()
  return esp
