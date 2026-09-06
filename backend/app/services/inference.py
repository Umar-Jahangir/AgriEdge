"""AI inference service — skeleton with mock predictions until models are trained."""

import logging
from pathlib import Path

from app.config import get_settings
from app.schemas.api import VisionPrediction

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_STATUS = {
  "disease": False,
  "pest": False,
  "nutrient": False,
  "nitrogen": False,
}


class InferenceService:
  """Loads ONNX models when available; falls back to demo predictions."""

  def __init__(self):
    self.models_loaded = dict(MODEL_STATUS)
    self._try_load_models()

  def _try_load_models(self):
    for model_type in self.models_loaded:
      path = settings.models_dir / model_type / "model.onnx"
      if path.exists():
        try:
          # import onnxruntime as ort
          # self._sessions[model_type] = ort.InferenceSession(str(path))
          self.models_loaded[model_type] = True
          logger.info("Model loaded: %s", model_type)
        except Exception as e:
          logger.warning("Failed to load %s model: %s", model_type, e)

  def get_model_status(self) -> dict[str, bool]:
    return self.models_loaded

  def analyze_image(self, image_path: Path, zone_id: str) -> list[VisionPrediction]:
    if not any(self.models_loaded.values()):
      return self._demo_predictions(zone_id)
    # TODO: real inference when models are trained and exported
    return self._demo_predictions(zone_id)

  def _demo_predictions(self, zone_id: str) -> list[VisionPrediction]:
    """Demo predictions mapped to zone scenarios."""
    from app.services.demo_data import get_demo_zone
    zone = get_demo_zone(zone_id)
    scenario = zone.get("scenario", "healthy")
    preds: list[VisionPrediction] = []

    if scenario == "possible_disease":
      preds.append(VisionPrediction(
        model_type="disease", prediction_class="Possible Disease",
        confidence=zone["ai_confidence"],
        note="Demo prediction — model not yet trained/evaluated",
      ))
    elif scenario == "pest_detected":
      preds.append(VisionPrediction(
        model_type="pest", prediction_class="Pest Detected",
        confidence=zone["ai_confidence"],
        note="Demo prediction — model not yet trained/evaluated",
      ))
    elif scenario == "possible_water_stress":
      preds.append(VisionPrediction(
        model_type="nutrient", prediction_class="Possible Water Stress",
        confidence=zone["ai_confidence"],
        note="Demo prediction — visual symptoms only",
      ))
    else:
      preds.append(VisionPrediction(
        model_type="disease", prediction_class="Healthy",
        confidence=zone["ai_confidence"],
        note="Demo prediction — no significant issues detected",
      ))
    return preds


inference_service = InferenceService()
