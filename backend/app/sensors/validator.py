"""Sensor validation and normalization."""

import logging
from datetime import datetime

from app.config import load_yaml_config
from app.schemas.api import SensorTelemetry

logger = logging.getLogger(__name__)


class SensorValidator:
  def __init__(self):
    self.thresholds = load_yaml_config("thresholds.yaml")
    self.units = self.thresholds.get("units", {})

  def validate(self, data: SensorTelemetry) -> tuple[SensorTelemetry, list[str]]:
    warnings: list[str] = []
    validated = data.model_copy()

  # Range sanity checks — reject clearly invalid values
    checks = [
      ("soil_moisture", 0, 100),
      ("ph", 0, 14),
      ("humidity", 0, 100),
      ("soil_temperature", -10, 60),
      ("air_temperature", -10, 55),
    ]
    for field, lo, hi in checks:
      val = getattr(validated, field, None)
      if val is not None and (val < lo or val > hi):
        warnings.append(f"{field}={val} out of expected range [{lo},{hi}]")
        logger.warning("Sensor validation: %s", warnings[-1])

    if not validated.timestamp:
      validated.timestamp = datetime.utcnow()

    return validated, warnings

  def classify_nutrient(self, value: float | None, nutrient: str, crop: str = "maize") -> str:
    if value is None:
      return "Unknown"
    profile = self.thresholds.get("profiles", {}).get(crop, {})
    thresholds = profile.get(nutrient, {})
    if not thresholds:
      return "Unknown"
    if value < thresholds.get("low", 0):
      return "Low"
    if value < thresholds.get("optimal_min", 0):
      return "Moderate"
    if value <= thresholds.get("optimal_max", 999):
      return "Good"
    return "High"
