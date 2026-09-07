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
        pred_treatment = getattr(pred, "treatment", None)

        if getattr(pred, "is_healthy", False) or "healthy" in label:
          vision_evidence.append(f"Vision model: healthy foliage detected ({pred.prediction_class}, {pred.confidence:.0%})")
          if top_risk == "HEALTHY":
            confidence = max(confidence, pred.confidence)
        elif any(k in label for k in ("spider", "mite", "pest", "insect")):
          vision_evidence.append(f"Vision model: pest detected ({pred.prediction_class}, {pred.confidence:.0%})")
          rec = pred_treatment or "Pest activity detected. Inspect affected foliage and apply integrated pest management or miticide."
          risks.append({
            "zone": zone_id, "risk": "PEST_RISK", "severity": "HIGH",
            "confidence": pred.confidence,
            "evidence": vision_evidence[-1:],
            "recommendation": rec,
            "timestamp": datetime.utcnow(), "source": "vision",
          })
          top_risk, top_severity, confidence = "PEST_RISK", "HIGH", pred.confidence
        elif any(k in label for k in ("nitrogen", "deficiency", "nutrient", "phosphorus", "potassium", "magnesium")):
          vision_evidence.append(f"Vision model: nutrient deficiency detected ({pred.prediction_class}, {pred.confidence:.0%})")
          rec = pred_treatment or "Nutrient deficiency detected. Verify soil NPK levels and apply targeted fertilizer."
          risks.append({
            "zone": zone_id, "risk": "NUTRIENT_DEFICIENCY", "severity": "MEDIUM",
            "confidence": pred.confidence,
            "evidence": vision_evidence[-1:],
            "recommendation": rec,
            "timestamp": datetime.utcnow(), "source": "vision",
          })
          if severity_order.get("MEDIUM", 0) >= severity_order.get(top_severity, 0):
            top_risk, top_severity = "NUTRIENT_DEFICIENCY", "MEDIUM"
            confidence = max(confidence, pred.confidence)
        else:
          # Any other non-healthy plant leaf symptom is a disease (scab, rot, rust, blight, spot, mildew, mold, virus, scorch, etc.)
          vision_evidence.append(f"Vision model: plant disease detected ({pred.prediction_class}, {pred.confidence:.0%})")
          rec = pred_treatment or "Inspect affected plants. Visual symptoms indicate active disease; apply recommended treatment."
          risks.append({
            "zone": zone_id, "risk": "DISEASE_RISK", "severity": "HIGH",
            "confidence": pred.confidence,
            "evidence": vision_evidence[-1:],
            "recommendation": rec,
            "timestamp": datetime.utcnow(), "source": "vision",
          })
          top_risk, top_severity, confidence = "DISEASE_RISK", "HIGH", pred.confidence

    # Cross-modal fusion: vision + sensor agreement boosts confidence
    if vision_evidence and sensor_evidence:
      if any("nitrogen" in e.lower() for e in sensor_evidence) and any("nutrient" in e.lower() or "deficiency" in e.lower() for e in vision_evidence):
        evidence.append("Sensor and vision evidence both confirm nutrient stress")
        top_risk = "COMBINED_NUTRIENT_WATER_STRESS"
        top_severity = "HIGH"
        confidence = min(0.95, confidence + 0.1)

    evidence = evidence + vision_evidence + sensor_evidence
    recommendation = risks[-1]["recommendation"] if risks else "No significant risks detected. Continue monitoring."

    # Compute fused crop health score (0 - 100%)
    if top_risk == "HEALTHY":
      crop_health_score = min(98, max(85, int(round(95 * confidence))))
      crop_health_status = "Healthy"
    elif top_risk == "DISEASE_RISK":
      crop_health_score = max(25, int(round(100 - confidence * 55)))
      crop_health_status = "Possible Disease Detected"
    elif top_risk == "PEST_RISK":
      crop_health_score = max(35, int(round(100 - confidence * 50)))
      crop_health_status = "Possible Disease Detected"
    elif top_risk in ("NUTRIENT_DEFICIENCY", "COMBINED_NUTRIENT_WATER_STRESS"):
      crop_health_score = max(40, int(round(100 - confidence * 45)))
      crop_health_status = "Possible Nutrient Deficiency"
    else:
      crop_health_score = 75
      crop_health_status = "Attention Required"

    return {
      "zone": zone_id,
      "risk": top_risk,
      "severity": top_severity,
      "confidence": round(confidence, 2),
      "evidence": evidence,
      "vision_evidence": vision_evidence,
      "sensor_evidence": sensor_evidence,
      "recommendation": recommendation,
      "crop_health_score": crop_health_score,
      "crop_health_status": crop_health_status,
      "timestamp": datetime.utcnow(),
      "risks": risks,
    }
