"""Camera abstraction layer — PiCamera2 and mock implementations."""

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CameraInterface(ABC):
  @abstractmethod
  def is_available(self) -> bool: ...
  @abstractmethod
  def capture(self, zone_id: str) -> Path | None: ...


class MockCamera(CameraInterface):
  def is_available(self) -> bool:
    return True

  def capture(self, zone_id: str) -> Path | None:
    settings.images_dir.mkdir(parents=True, exist_ok=True)
    filename = f"mock_{zone_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
    path = settings.images_dir / filename
    # Create placeholder file for development
    path.write_bytes(b"MOCK_IMAGE_PLACEHOLDER")
    logger.info("Mock camera captured: %s", path)
    return path


class PiCamera2Adapter(CameraInterface):
  def __init__(self):
    self._camera = None

  def is_available(self) -> bool:
    try:
      from picamera2 import Picamera2  # type: ignore
      self._camera = Picamera2()
      return True
    except Exception as e:
      logger.error("PiCamera2 unavailable: %s", e)
      return False

  def capture(self, zone_id: str) -> Path | None:
    try:
      from picamera2 import Picamera2  # type: ignore
      if not self._camera:
        self._camera = Picamera2()
        self._camera.start()
      settings.images_dir.mkdir(parents=True, exist_ok=True)
      filename = f"{zone_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.jpg"
      path = settings.images_dir / filename
      self._camera.capture_file(str(path))
      logger.info("Camera captured: %s", path)
      return path
    except Exception as e:
      logger.error("Camera capture failed: %s", e)
      return None


def get_camera() -> CameraInterface:
  if settings.mock_mode:
    return MockCamera()
  cam = PiCamera2Adapter()
  if cam.is_available():
    return cam
  logger.warning("Falling back to mock camera")
  return MockCamera()
