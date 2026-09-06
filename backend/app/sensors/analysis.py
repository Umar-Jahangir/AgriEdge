"""Configurable rule-based sensor analysis engine."""

import logging
from datetime import datetime

from app.config import load_yaml_config
from app.schemas.api import SensorTelemetry
from app.sensors.validator import SensorValidator

logger = logging.getLogger(__name__)


class SensorAnalysisEngine:
  def __init__(self):
    self.config = load_yaml_config("thresholds.yaml")
    self.validator = SensorValidator()
    self.crop = self.config.get("default_crop", "maize")

  def analyze(self, data: SensorTelemetry) -> list[dict]:
    validated, _ = self.validator.validate(data)
    profile = self.config.get("profiles", {}).get(self.crop, {})
    findings: list[dict] = []

    if validated.soil_moisture is not None:
      low = profile.get("soil_moisture", {}).get("low", 25)
      if validated.soil_moisture < low:
        findings.append(self._finding(
          "possible_water_stress", "medium",
          [f"soil moisture ({validated.soil_moisture}%) below configured threshold ({low}%)"],
          "Inspect zone and consider irrigation based on crop requirements and local agronomic guidance.",
          validated.zone_id,
        ))

    if validated.air_temperature is not None:
      stress = profile.get("air_temperature", {}).get("stress_min", 32)
      if validated.air_temperature > stress:
        findings.append(self._finding(
          "heat_stress", "low",
          [f"ambient temperature ({validated.air_temperature}°C) above stress threshold ({stress}°C)"],
          "Elevated temperature detected. Monitor crop stress indicators and soil moisture.",
          validated.zone_id,
        ))

    if validated.nitrogen is not None:
      low = profile.get("nitrogen", {}).get("low", 40)
      if validated.nitrogen < low:
        findings.append(self._finding(
          "possible_nutrient_deficiency", "medium",
          [f"nitrogen reading ({validated.nitrogen} ppm) below configured threshold ({low} ppm)"],
          "Possible nutrient deficiency detected. Verify soil nutrient readings before applying fertilizer.",
          validated.zone_id,
        ))

    return findings

  def _finding(self, risk: str, severity: str, evidence: list[str], recommendation: str, zone_id: str) -> dict:
    return {
      "zone": zone_id,
      "risk": risk,
      "severity": severity.upper(),
      "confidence": 0.75,
      "evidence": evidence,
      "recommendation": recommendation,
      "timestamp": datetime.utcnow(),
      "source": "sensor_analysis",
    }
