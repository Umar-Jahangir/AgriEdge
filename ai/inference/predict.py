"""
AgriEdge Rover — AI Inference Module

Usage:
  from ai.inference.predict import predict_disease, predict_pest

Models are trained on dev machine and exported to models/ directory.
Raspberry Pi runs ONNX inference locally.
"""

from pathlib import Path
import json

import numpy as np
from PIL import Image

MODELS_DIR = Path(__file__).resolve().parents[2] / "models"

MODEL_PATHS = {
    "disease": MODELS_DIR / "disease" / "model.onnx",
    "pest": MODELS_DIR / "pest" / "model.onnx",
    "nutrient": MODELS_DIR / "nutrient" / "model.onnx",
    "nitrogen": MODELS_DIR / "nitrogen" / "model.onnx",
}


def is_model_available(model_type: str) -> bool:
    return MODEL_PATHS.get(model_type, Path()).exists()


def predict_disease(image_path: str) -> dict:
    """Classify a leaf image with the deployed disease ONNX model."""
    if not is_model_available("disease"):
        return {"status": "not_evaluated", "message": "Disease model not yet trained/deployed"}
    try:
        import onnxruntime as ort
        model_dir = MODEL_PATHS["disease"].parent
        with (model_dir / "labels.json").open(encoding="utf-8") as file:
            metadata = json.load(file)
        session = ort.InferenceSession(str(MODEL_PATHS["disease"]), providers=["CPUExecutionProvider"])
        with Image.open(image_path) as image:
            size = metadata.get("img_size", 224)
            image = image.convert("RGB")
            scale = int(size * 1.14) / min(image.size)
            image = image.resize((max(size, round(image.width * scale)), max(size, round(image.height * scale))), Image.BILINEAR)
            left, top = (image.width - size) // 2, (image.height - size) // 2
            image = image.crop((left, top, left + size, top + size))
            pixels = np.asarray(image, dtype=np.float32) / 255
        pixels = (pixels - np.asarray(metadata["mean"], dtype=np.float32)) / np.asarray(metadata["std"], dtype=np.float32)
        logits = session.run(None, {session.get_inputs()[0].name: pixels.transpose(2, 0, 1)[None].astype(np.float32)})[0].reshape(-1)
        probabilities = np.exp(logits - logits.max())
        probabilities /= probabilities.sum()
        index = int(np.argmax(probabilities))
        label = metadata["classes"][index]
        return {"status": "ok", "prediction_class": label.get("pretty", label["name"]), "confidence": float(probabilities[index])}
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


def predict_pest(image_path: str) -> dict:
    """Pest detection (YOLO) — returns detections or 'not evaluated yet'."""
    if not is_model_available("pest"):
        return {"status": "not_evaluated", "message": "Pest model not yet trained/deployed"}
    return {"status": "pending_implementation"}


def predict_nutrient_deficiency(image_path: str) -> dict:
    if not is_model_available("nutrient"):
        return {"status": "not_evaluated", "message": "Nutrient model not yet trained/deployed"}
    return {"status": "pending_implementation"}


def predict_nitrogen_stress(image_path: str) -> dict:
    if not is_model_available("nitrogen"):
        return {"status": "not_evaluated", "message": "Nitrogen model not yet trained/deployed"}
    return {"status": "pending_implementation"}
