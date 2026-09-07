"""Local ONNX image inference used by the backend API.

Disease models are deliberately loaded from ``models/disease`` so the backend
does not depend on the training/output directory being present on the rover.
"""

import json
import logging
from pathlib import Path
from time import perf_counter

import numpy as np
from PIL import Image

from app.config import get_settings
from app.schemas.api import VisionPrediction

logger = logging.getLogger(__name__)
settings = get_settings()

MODEL_STATUS = {"disease": False, "pest": False, "nutrient": False, "nitrogen": False}
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


class InferenceService:
  """Load available ONNX models once and run CPU inference on captured images."""

  def __init__(self):
    self.models_loaded = dict(MODEL_STATUS)
    self._sessions: dict[str, object] = {}
    self._metadata: dict[str, dict] = {}
    self._try_load_models()

  def _try_load_models(self):
    try:
      import onnxruntime as ort
    except ImportError:
      logger.info("onnxruntime is not installed; AI inference is unavailable")
      return

    for model_type in self.models_loaded:
      model_dir = settings.models_dir / model_type
      path = model_dir / "model.onnx"
      labels_path = model_dir / "labels.json"
      if path.exists():
        try:
          session_options = ort.SessionOptions()
          session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
          session = ort.InferenceSession(str(path), session_options, providers=["CPUExecutionProvider"])
          metadata = self._load_metadata(labels_path, session)
          self._validate_model(session, metadata, model_type)
          self._sessions[model_type] = session
          self._metadata[model_type] = metadata
          self.models_loaded[model_type] = True
          logger.info("Model loaded: %s (%s)", model_type, path)
        except Exception as exc:  # A bad local artifact must not stop the API starting.
          logger.warning("Failed to load %s model: %s", model_type, exc)
      elif model_type == "pest":
        pth_path = model_dir / "vit_best_retrained.pth"
        if pth_path.exists() and labels_path.exists():
          try:
            import torch
            import timm

            with labels_path.open(encoding="utf-8") as file:
              metadata = json.load(file)

            class InsectModel(torch.nn.Module):
              def __init__(self, num_classes: int = 102):
                super().__init__()
                self.model = timm.create_model("vit_base_patch16_224", pretrained=False, num_classes=num_classes)

              def forward(self, x):
                return self.model(x)

            pest_model = InsectModel(num_classes=metadata.get("num_classes", 102))
            weights = torch.load(pth_path, map_location="cpu", weights_only=True)
            pest_model.load_state_dict(weights)
            pest_model.eval()

            self._sessions["pest"] = pest_model
            self._metadata["pest"] = metadata
            self.models_loaded["pest"] = True
            logger.info("Model loaded: pest ViT PyTorch (%s)", pth_path)
          except Exception as exc:
            logger.warning("Failed to load pest PyTorch model: %s", exc)

  @staticmethod
  def _load_metadata(labels_path: Path, session) -> dict:
    if labels_path.exists():
      with labels_path.open(encoding="utf-8") as file:
        metadata = json.load(file)
    else:
      custom = session.get_modelmeta().custom_metadata_map
      metadata = {"classes": json.loads(custom["classes"])} if "classes" in custom else {}
    metadata.setdefault("img_size", 224)
    metadata.setdefault("mean", IMAGENET_MEAN)
    metadata.setdefault("std", IMAGENET_STD)
    metadata.setdefault("classes", [])
    return metadata

  @staticmethod
  def _validate_model(session, metadata: dict, model_type: str) -> None:
    input_shape = session.get_inputs()[0].shape
    if len(input_shape) != 4 or input_shape[1] != 3:
      raise ValueError(f"expected NCHW RGB input, got {input_shape}")
    output_shape = session.get_outputs()[0].shape
    classes = metadata["classes"]
    if classes and isinstance(output_shape[-1], int) and output_shape[-1] != len(classes):
      raise ValueError(f"{model_type} has {output_shape[-1]} outputs but {len(classes)} labels")

  def get_model_status(self) -> dict[str, bool]:
    return self.models_loaded

  @staticmethod
  def _load_image(image_input: "Path | str | bytes | Image.Image") -> Image.Image:
    """Load and normalize an image from a path, raw bytes, or PIL Image."""
    import io
    if isinstance(image_input, Image.Image):
      img = image_input.copy()
    elif isinstance(image_input, (bytes, bytearray)):
      img = Image.open(io.BytesIO(image_input))
    else:
      img = Image.open(image_input)
    if img.mode == "P" and "transparency" in img.info:
      img = img.convert("RGBA")
    if img.mode != "RGB":
      img = img.convert("RGB")
    return img

  @staticmethod
  def _preprocess(image: Image.Image, metadata: dict, input_shape: list) -> np.ndarray:
    fallback = int(metadata["img_size"])
    height = input_shape[2] if isinstance(input_shape[2], int) else fallback
    width = input_shape[3] if isinstance(input_shape[3], int) else fallback
    original_width, original_height = image.size
    scale = int(min(height, width) * 1.14) / min(original_width, original_height)
    image = image.resize((max(width, round(original_width * scale)), max(height, round(original_height * scale))), Image.BILINEAR)
    left, top = (image.width - width) // 2, (image.height - height) // 2
    image = image.crop((left, top, left + width, top + height))
    pixels = np.asarray(image, dtype=np.float32) / 255.0
    pixels = (pixels - np.asarray(metadata["mean"], dtype=np.float32)) / np.asarray(metadata["std"], dtype=np.float32)
    return pixels.transpose(2, 0, 1)[None].astype(np.float32)

  @staticmethod
  def _parse_label(label: str) -> tuple[str, str, bool]:
    """Parse a class label into (crop, condition, is_healthy)."""
    if ":" in label:
      parts = label.split(":", 1)
      crop = parts[0].strip()
      condition = parts[1].strip()
    elif "___" in label:
      parts = label.split("___", 1)
      crop = parts[0].replace("_", " ").title()
      condition = parts[1].replace("_", " ")
    else:
      crop = "Crop"
      condition = label
    is_healthy = "healthy" in condition.lower()
    return crop, condition, is_healthy

  @staticmethod
  def _get_treatment(condition: str) -> str:
    """Agricultural treatment recommendations based on identified leaf condition."""
    c = condition.lower()
    if "healthy" in c:
      return "Crop foliage appears healthy. Continue regular irrigation and scheduled nutrient monitoring."
    if "scab" in c:
      return "Apply protective fungicide (captan or sulfur). Prune and destroy infected foliage to prevent spore dispersal."
    if "rot" in c:
      return "Remove infected fruit and foliage immediately. Apply targeted copper or mancozeb fungicide during early growth."
    if "rust" in c:
      return "Apply approved protective fungicide (e.g. azoxystrobin or mancozeb) and ensure adequate crop spacing for airflow."
    if "mildew" in c:
      return "Apply neem oil, potassium bicarbonate, or sulfur fungicide. Avoid wetting foliage during irrigation."
    if "blight" in c:
      return "Remove affected foliage immediately. Apply chlorothalonil or copper-based fungicide; avoid overhead watering."
    if "bacterial" in c:
      return "Apply copper bactericide. Avoid handling wet plants and sterilize pruning tools to prevent bacterial spread."
    if "mold" in c:
      return "Improve air circulation; reduce canopy humidity and apply preventive bio-fungicide."
    if "spot" in c:
      return "Prune infected lower leaves and apply copper or bio-fungicide spray; maintain drip irrigation."
    if "spider" in c or "mite" in c:
      return "Apply insecticidal soap, horticultural oil, or neem oil spray. Avoid water stress."
    if "virus" in c or "curl" in c or "mosaic" in c:
      return "Remove infected plants immediately to prevent transmission. Control vector insects (whiteflies, thrips, aphids)."
    if "greening" in c:
      return "Quarantine infected citrus trees and treat against Asian citrus psyllid vector with recommended systemic insecticides."
    if "nitrogen" in c:
      return "Apply nitrogen-rich fertilizer (urea, ammonium sulfate, or compost) to restore canopy vigor."
    if "phosphorus" in c:
      return "Apply phosphorus fertilizer (rock phosphate or superphosphate) to support root strength and flowering."
    if "potassium" in c:
      return "Apply potassium sulfate or muriate of potash to enhance disease resistance and drought tolerance."
    if "magnesium" in c:
      return "Apply Epsom salts (magnesium sulfate) as a foliar spray or soil drench to correct interveinal chlorosis."
    return "Isolate infected plant, monitor progression, and consult local agricultural extension agent."

  def analyze_pest(
    self,
    image_input: "Path | str | bytes | Image.Image",
    top_k_count: int = 5,
  ) -> VisionPrediction | None:
    if not self.models_loaded.get("pest"):
      return None
    try:
      model = self._sessions["pest"]
      metadata = self._metadata["pest"]
      img = self._load_image(image_input)
      img = img.resize((224, 224), Image.Resampling.BILINEAR)
      pixels = np.asarray(img, dtype=np.float32) / 255.0

      start = perf_counter()
      if hasattr(model, "forward"):  # PyTorch model
        import torch

        tensor = torch.from_numpy(pixels.transpose(2, 0, 1)).unsqueeze(0)
        with torch.no_grad():
          logits = model(tensor)
          prob = torch.nn.functional.softmax(logits, dim=1).squeeze(0).cpu().numpy()
      else:  # ONNX session
        tensor = pixels.transpose(2, 0, 1)[None].astype(np.float32)
        logits = model.run(None, {model.get_inputs()[0].name: tensor})[0].reshape(-1)
        prob = np.exp(logits - logits.max())
        prob /= prob.sum()

      latency_ms = (perf_counter() - start) * 1000

      top_indices = np.argsort(-prob)[:top_k_count]
      best_idx = int(top_indices[0])
      classes = metadata.get("classes", [])

      top_k_list = []
      for idx in top_indices:
        c_entry = classes[int(idx)] if int(idx) < len(classes) else {"name": f"class_{idx}"}
        top_k_list.append({
          "index": int(idx),
          "name": c_entry.get("name", f"class_{idx}"),
          "pretty": c_entry.get("pretty", c_entry.get("name", f"class_{idx}")),
          "crop": c_entry.get("crop", "General"),
          "confidence": round(float(prob[idx]), 4),
          "hindi": c_entry.get("hindi", ""),
          "marathi": c_entry.get("marathi", ""),
          "treatment": c_entry.get("treatment", ""),
        })

      best_entry = classes[best_idx] if best_idx < len(classes) else {"name": f"class_{best_idx}"}
      pred_class = best_entry.get("pretty", best_entry.get("name", f"class_{best_idx}"))
      pest_name = best_entry.get("raw_name", best_entry.get("name", "Pest"))
      crop = best_entry.get("crop", "Field Crop")
      hindi_name = best_entry.get("hindi", "")
      marathi_name = best_entry.get("marathi", "")
      severity = best_entry.get("severity", "Moderate")
      treatment = best_entry.get("treatment", "Monitor foliage and apply appropriate bio-pesticide.")

      return VisionPrediction(
        model_type="pest",
        prediction_class=pred_class,
        confidence=round(float(prob[best_idx]), 4),
        crop=crop,
        condition=pest_name,
        is_healthy=False,
        treatment=treatment,
        top_k=top_k_list,
        pest_name=pest_name,
        hindi_name=hindi_name,
        marathi_name=marathi_name,
        severity=severity,
        note=f"ViT-Base IP102 local inference ({latency_ms:.1f} ms)",
      )
    except Exception as exc:
      logger.exception("Pest inference failed: %s", exc)
      return None

  def analyze_image(
    self,
    image_input: "Path | str | bytes | Image.Image",
    zone_id: str = "ZONE_B",
    scan_type: str = "disease",
    top_k_count: int = 5,
  ) -> list[VisionPrediction]:
    # Specific pest scan requested
    if scan_type == "pest":
      pest_res = self.analyze_pest(image_input, top_k_count)
      if pest_res:
        return [pest_res]

    disease_pred = None
    if self.models_loaded.get("disease"):
      try:
        session = self._sessions["disease"]
        metadata = self._metadata["disease"]
        img = self._load_image(image_input)
        tensor = self._preprocess(img, metadata, session.get_inputs()[0].shape)
        start = perf_counter()
        logits = session.run(None, {session.get_inputs()[0].name: tensor})[0].reshape(-1)
        latency_ms = (perf_counter() - start) * 1000
        probabilities = np.exp(logits - logits.max())
        probabilities /= probabilities.sum()
        
        top_indices = np.argsort(-probabilities)[:top_k_count]
        best_idx = int(top_indices[0])
        best_class = self._class_name(metadata, best_idx)
        crop, condition, is_healthy = self._parse_label(best_class)
        treatment = self._get_treatment(condition)
        
        top_k_list = []
        for idx in top_indices:
          c_name = self._class_name(metadata, int(idx))
          c_crop, c_cond, c_healthy = self._parse_label(c_name)
          top_k_list.append({
            "index": int(idx),
            "class_name": c_name,
            "crop": c_crop,
            "condition": c_cond,
            "is_healthy": c_healthy,
            "confidence": round(float(probabilities[idx]), 4),
          })
        
        disease_pred = VisionPrediction(
          model_type="disease",
          prediction_class=best_class,
          confidence=float(probabilities[best_idx]),
          crop=crop,
          condition=condition,
          is_healthy=is_healthy,
          treatment=treatment,
          top_k=top_k_list,
          note=f"MobileNetV3 ONNX local inference ({latency_ms:.1f} ms)",
        )
      except Exception as exc:
        logger.exception("Disease inference failed for image input: %s", exc)

    if scan_type == "disease":
      return [disease_pred] if disease_pred else self._demo_predictions(zone_id)

    pest_pred = self.analyze_pest(image_input, top_k_count) if self.models_loaded.get("pest") else None

    results: list[VisionPrediction] = []
    if disease_pred:
      results.append(disease_pred)
    if pest_pred:
      results.append(pest_pred)

    if results:
      return sorted(results, key=lambda p: p.confidence, reverse=True)

    return self._demo_predictions(zone_id)

  @staticmethod
  def _class_name(metadata: dict, index: int) -> str:
    classes = metadata["classes"]
    if index >= len(classes):
      return f"class_{index}"
    entry = classes[index]
    return entry.get("pretty", entry.get("name", f"class_{index}")) if isinstance(entry, dict) else str(entry)

  def _demo_predictions(self, zone_id: str) -> list[VisionPrediction]:
    """Demo fallback used only when no disease model is installed."""
    from app.services.demo_data import get_demo_zone
    zone = get_demo_zone(zone_id)
    scenario = zone.get("scenario", "healthy")
    mapping = {
      "possible_disease": "Tomato: Early blight",
      "pest_detected": "Tomato: Spider mites Two-spotted spider mite",
      "possible_water_stress": "Corn: healthy",
    }
    pred_class = mapping.get(scenario, "Corn: healthy")
    crop, condition, is_healthy = self._parse_label(pred_class)
    treatment = self._get_treatment(condition)
    return [VisionPrediction(
      model_type="disease",
      prediction_class=pred_class,
      confidence=zone["ai_confidence"],
      crop=crop,
      condition=condition,
      is_healthy=is_healthy,
      treatment=treatment,
      note="Demo prediction — disease model unavailable",
    )]


inference_service = InferenceService()
