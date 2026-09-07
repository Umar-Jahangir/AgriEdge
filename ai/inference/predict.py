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
    "pest_pth": MODELS_DIR / "pest" / "vit_best_retrained.pth",
    "nutrient": MODELS_DIR / "nutrient" / "model.onnx",
    "nitrogen": MODELS_DIR / "nitrogen" / "model.onnx",
}

_PEST_MODEL = None
_PEST_METADATA = None


def is_model_available(model_type: str) -> bool:
    if model_type == "pest":
        return MODEL_PATHS["pest"].exists() or MODEL_PATHS["pest_pth"].exists()
    return MODEL_PATHS.get(model_type, Path()).exists()


def _get_pest_model():
    global _PEST_MODEL, _PEST_METADATA
    if _PEST_MODEL is not None:
        return _PEST_MODEL, _PEST_METADATA

    import torch
    import timm

    labels_file = MODELS_DIR / "pest" / "labels.json"
    with labels_file.open(encoding="utf-8") as f:
        _PEST_METADATA = json.load(f)

    class InsectModel(torch.nn.Module):
        def __init__(self, num_classes: int = 102):
            super().__init__()
            self.model = timm.create_model("vit_base_patch16_224", pretrained=False, num_classes=num_classes)

        def forward(self, x):
            return self.model(x)

    model = InsectModel(num_classes=_PEST_METADATA.get("num_classes", 102))
    model_path = MODEL_PATHS["pest_pth"]
    weights = torch.load(model_path, map_location="cpu", weights_only=True)
    model.load_state_dict(weights)
    model.eval()
    _PEST_MODEL = model
    return _PEST_MODEL, _PEST_METADATA


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
    """Classify insect/pest image using ViT-Base 102-class model."""
    if not is_model_available("pest"):
        return {"status": "not_evaluated", "message": "Pest model not yet trained/deployed"}
    try:
        import torch

        model, metadata = _get_pest_model()
        with Image.open(image_path) as image:
            image = image.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
            pixels = np.asarray(image, dtype=np.float32) / 255.0

        tensor = torch.from_numpy(pixels.transpose(2, 0, 1)).unsqueeze(0)
        with torch.no_grad():
            logits = model(tensor)
            prob = torch.nn.functional.softmax(logits, dim=1).squeeze(0)
            pred_idx = int(prob.argmax().item())
            confidence = float(prob[pred_idx].item())

        classes = metadata.get("classes", [])
        top_k_indices = torch.topk(prob, k=min(5, len(classes))).indices.tolist()
        top_k = []
        for idx in top_k_indices:
            entry = classes[idx] if idx < len(classes) else {"name": f"class_{idx}"}
            top_k.append({
                "index": idx,
                "name": entry.get("name", f"class_{idx}"),
                "pretty": entry.get("pretty", entry.get("name", f"class_{idx}")),
                "crop": entry.get("crop", "General"),
                "confidence": round(float(prob[idx].item()), 4),
                "hindi": entry.get("hindi", ""),
                "marathi": entry.get("marathi", ""),
                "treatment": entry.get("treatment", ""),
            })

        best = classes[pred_idx] if pred_idx < len(classes) else {"name": f"class_{pred_idx}"}
        return {
            "status": "ok",
            "prediction_class": best.get("pretty", best.get("name", f"class_{pred_idx}")),
            "confidence": round(confidence, 4),
            "crop": best.get("crop", "Field Crop"),
            "pest_name": best.get("raw_name", best.get("name", "")),
            "hindi_name": best.get("hindi", ""),
            "marathi_name": best.get("marathi", ""),
            "severity": best.get("severity", "Moderate"),
            "treatment": best.get("treatment", "Monitor foliage and apply appropriate bio-pesticide."),
            "top_k": top_k,
        }
    except Exception as exc:
        return {"status": "error", "message": str(exc)}


def predict_nutrient_deficiency(image_path: str) -> dict:
    if not is_model_available("nutrient"):
        return {"status": "not_evaluated", "message": "Nutrient model not yet trained/deployed"}
    return {"status": "pending_implementation"}


def predict_nitrogen_stress(image_path: str) -> dict:
    if not is_model_available("nitrogen"):
        return {"status": "not_evaluated", "message": "Nitrogen model not yet trained/deployed"}
    return {"status": "pending_implementation"}
