"""
PlantDoc → PlantVillage label mapping for disease training.

Uses normalized snake_case labels as stored in JSONL manifests
(see ai.datasets.utils.normalize_label).

Rules:
- Only map when crop + disease concept clearly aligns.
- Do NOT invent mappings for ambiguous healthy/generic leaf classes.
- Unmapped PlantDoc classes are excluded from joint training.
"""

from __future__ import annotations

from ai.datasets.utils import normalize_label

# Original folder names → PlantVillage folder names (pre-normalization)
_PLANTDOC_TO_PLANTVILLAGE_RAW: dict[str, str] = {
    "Apple Scab Leaf": "Apple___Apple_scab",
    "Apple rust leaf": "Apple___Cedar_apple_rust",
    "Bell_pepper leaf spot": "Pepper,_bell___Bacterial_spot",
    "Corn Gray leaf spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn leaf blight": "Corn_(maize)___Northern_Leaf_Blight",
    "Corn rust leaf": "Corn_(maize)___Common_rust_",
    "Potato leaf early blight": "Potato___Early_blight",
    "Potato leaf late blight": "Potato___Late_blight",
    "Squash Powdery mildew leaf": "Squash___Powdery_mildew",
    "Tomato Early blight leaf": "Tomato___Early_blight",
    "Tomato leaf bacterial spot": "Tomato___Bacterial_spot",
    "Tomato leaf late blight": "Tomato___Late_blight",
    "Tomato leaf mosaic virus": "Tomato___Tomato_mosaic_virus",
    "Tomato leaf yellow virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato mold leaf": "Tomato___Leaf_Mold",
    "Tomato Septoria leaf spot": "Tomato___Septoria_leaf_spot",
    "Tomato two spotted spider mites leaf": "Tomato___Spider_mites Two-spotted_spider_mite",
    "grape leaf black rot": "Grape___Black_rot",
}

_EXCLUDED_PLANTDOC_RAW: list[str] = [
    "Apple leaf",
    "Bell_pepper leaf",
    "Blueberry leaf",
    "Cherry leaf",
    "Peach leaf",
    "Raspberry leaf",
    "Soyabean leaf",
    "Strawberry leaf",
    "Tomato leaf",
    "grape leaf",
]

# Normalized keys used in manifests / training
PLANTDOC_TO_PLANTVILLAGE: dict[str, str] = {
    normalize_label(k): normalize_label(v) for k, v in _PLANTDOC_TO_PLANTVILLAGE_RAW.items()
}

EXCLUDED_PLANTDOC_CLASSES: list[str] = [normalize_label(x) for x in _EXCLUDED_PLANTDOC_RAW]

MAPPING_NOTES = [
    "PlantVillage taxonomy is authoritative for this disease model (38 classes).",
    "PlantDoc uses different naming and includes generic leaf classes without disease labels.",
    "Mapped PlantDoc samples improve real-world robustness for overlapping diseases.",
    "Unmapped PlantDoc classes are excluded from training to avoid inventing labels.",
    "PlantDoc 'Apple rust leaf' → Cedar apple rust (closest PlantVillage apple rust class).",
    "PlantDoc 'Bell_pepper leaf spot' → bacterial spot (closest bell-pepper disease class).",
]


def map_plantdoc_label(label: str) -> str | None:
    """Return PlantVillage-normalized label, or None if excluded/unmapped."""
    key = normalize_label(label) if " " in label or label != label.lower() else label
    # Already-normalized manifests use snake_case; also accept raw
    if key in PLANTDOC_TO_PLANTVILLAGE:
        return PLANTDOC_TO_PLANTVILLAGE[key]
    if label in PLANTDOC_TO_PLANTVILLAGE:
        return PLANTDOC_TO_PLANTVILLAGE[label]
    raw_norm = normalize_label(label)
    if raw_norm in PLANTDOC_TO_PLANTVILLAGE:
        return PLANTDOC_TO_PLANTVILLAGE[raw_norm]
    return None
