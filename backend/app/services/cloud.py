"""Cloud service placeholders — disabled by default."""

import logging

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class CloudSyncService:
  """Optional cloud synchronization — not required for core operation."""

  def __init__(self):
    self.enabled = settings.cloud_sync_enabled

  def sync(self) -> bool:
    if not self.enabled:
      logger.debug("Cloud sync disabled")
      return False
  # TODO: implement when cloud backend is defined
    return False


class WeatherService:
  """External weather data — requires Internet, optional."""

  def __init__(self):
    self.available = False

  def get_forecast(self, location: str) -> dict | None:
    return None  # Integration pending


class RemoteMonitoringService:
  """Remote monitoring — optional cloud feature."""

  def __init__(self):
    self.enabled = settings.cloud_sync_enabled

  def publish_status(self, data: dict) -> bool:
    return False
