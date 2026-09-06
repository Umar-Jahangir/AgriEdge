"""Multimodal sensor + vision fusion decision engine."""

import logging
from datetime import datetime

from app.schemas.api import SensorTelemetry, VisionPrediction
from app.sensors.analysis import SensorAnalysisEngine

logger = logging.getLogger(__name__)


class DecisionEngine:
  """Fuses sensor analysis and vision model outputs into risk assessments."""

  def __init__(self):
    self.sensor_engine = SensorAnalysisEngine()

  def fuse(
    self,
    zone_id: str,
    sensor_data: SensorTelemetry | None,
    vision_predictions: list[VisionPrediction] | None = None,
  ) -> dict:
    evidence: list[str] = []
    vision_evidence: list[str] = []
    sensor_evidence: list[str] = []
    risks: list[dict] = []
    severity_order = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
    top_severity = "LOW"
    top_risk = "HEALTHY"
    confidence = 0.5

    if sensor_data:
      sensor_findings = self.sensor_engine.analyze(sensor_data)
      for f in sensor_findings:
        risks.append(f)
        sensor_evidence.extend(f["evidence"])
        if severity_order.get(f["severity"], 0) > severity_order.get(top_severity, 0):
          top_severity = f["severity"]
          top_risk = f["risk"].upper()

    if vision_predictions:
      for pred in vision_predictions:
        label = pred.prediction_class.lower()
        if "disease" in label or "blight" in label or "rust" in label:
          vision_evidence.append(f"Vision model: possible disease ({pred.prediction_class}, {pred.confidence:.0%})")
          risks.append({
            "zone": zone_id, "risk": "DISEASE_RISK", "severity": "HIGH",
            "confidence": pred.confidence,
            "evidence": vision_evidence[-1:],
            "recommendation": "Inspect affected plants. Visual symptoms suggest possible disease.",
            "timestamp": datetime.utcnow(), "source": "vision",
          })
          top_risk, top_severity, confidence = "DISEASE_RISK", "HIGH", pred.confidence
        elif "pest" in label or "insect" in label:
          vision_evidence.append(f"Vision model: pest detected ({pred.prediction_class}, {pred.confidence:.0%})")
          risks.append({
            "zone": zone_id, "risk": "PEST_RISK", "severity": "HIGH",
            "confidence": pred.confidence,
            "evidence": vision_evidence[-1:],
            "recommendation": "Pest activity detected. Inspect affected plants and consider appropriate integrated pest-management action.",
            "timestamp": datetime.utcnow(), "source": "vision",
          })
          top_risk, top_severity, confidence = "PEST_RISK", "HIGH", pred.confidence
        elif "nitrogen" in label or "deficiency" in label or "nutrient" in label:
          vision_evidence.append(f"Vision model: possible nutrient deficiency ({pred.prediction_class}, {pred.confidence:.0%})")
          risks.append({
            "zone": zone_id, "risk": "NUTRIENT_DEFICIENCY", "severity": "MEDIUM",
            "confidence": pred.confidence,
            "evidence": vision_evidence[-1:],
            "recommendation": "Possible nutrient deficiency detected. Verify soil nutrient readings before applying fertilizer.",
            "timestamp": datetime.utcnow(), "source": "vision",
          })
          if severity_order.get("MEDIUM", 0) >= severity_order.get(top_severity, 0):
            top_risk, top_severity = "NUTRIENT_DEFICIENCY", "MEDIUM"
            confidence = max(confidence, pred.confidence)

    # Cross-modal fusion: vision + sensor agreement boosts confidence
    if vision_evidence and sensor_evidence:
      if any("nitrogen" in e.lower() for e in sensor_evidence) and any("nutrient" in e.lower() for e in vision_evidence):
        evidence.append("Sensor and vision evidence both suggest possible nutrient/water stress")
        top_risk = "COMBINED_NUTRIENT_WATER_STRESS"
        top_severity = "MEDIUM"
        confidence = min(0.95, confidence + 0.1)

    evidence = evidence + vision_evidence + sensor_evidence
    recommendation = risks[-1]["recommendation"] if risks else "No significant risks detected. Continue monitoring."

    return {
      "zone": zone_id,
      "risk": top_risk,
      "severity": top_severity,
      "confidence": round(confidence, 2),
      "evidence": evidence,
      "vision_evidence": vision_evidence,
      "sensor_evidence": sensor_evidence,
      "recommendation": recommendation,
      "timestamp": datetime.utcnow(),
      "risks": risks,
    }
