"""
AgriEdge Rover — AI Inference Module (Skeleton)

Usage:
  from ai.inference.predict import predict_disease, predict_pest

Models are trained on dev machine and exported to models/ directory.
Raspberry Pi runs ONNX inference locally.
"""

from pathlib import Path

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
    """Disease classification — returns class + confidence or 'not evaluated yet'."""
    if not is_model_available("disease"):
        return {"status": "not_evaluated", "message": "Disease model not yet trained/deployed"}
    # TODO: ONNX inference
    return {"status": "pending_implementation"}


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
