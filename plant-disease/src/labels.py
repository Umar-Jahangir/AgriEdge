"""Unified label space: PlantVillage's 38 classes + 4 maize nutrient-deficiency classes."""

PLANTVILLAGE_CLASSES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
]

NUTRIENT_CLASSES = [
    "Corn_(maize)___Magnesium_deficiency",
    "Corn_(maize)___Nitrogen_deficiency",
    "Corn_(maize)___Phosphorus_deficiency",
    "Corn_(maize)___Potassium_deficiency",
]

CLASSES = PLANTVILLAGE_CLASSES + NUTRIENT_CLASSES
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}

PLANTDOC_TO_CLASS = {
    "Apple Scab Leaf": "Apple___Apple_scab",
    "Apple leaf": "Apple___healthy",
    "Apple rust leaf": "Apple___Cedar_apple_rust",
    "Bell_pepper leaf spot": "Pepper,_bell___Bacterial_spot",
    "Bell_pepper leaf": "Pepper,_bell___healthy",
    "Blueberry leaf": "Blueberry___healthy",
    "Cherry leaf": "Cherry_(including_sour)___healthy",
    "Corn Gray leaf spot": "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn leaf blight": "Corn_(maize)___Northern_Leaf_Blight",
    "Corn rust leaf": "Corn_(maize)___Common_rust_",
    "Peach leaf": "Peach___healthy",
    "Potato leaf early blight": "Potato___Early_blight",
    "Potato leaf late blight": "Potato___Late_blight",
    "Raspberry leaf": "Raspberry___healthy",
    "Soyabean leaf": "Soybean___healthy",
    "Squash Powdery mildew leaf": "Squash___Powdery_mildew",
    "Strawberry leaf": "Strawberry___healthy",
    "Tomato Early blight leaf": "Tomato___Early_blight",
    "Tomato Septoria leaf spot": "Tomato___Septoria_leaf_spot",
    "Tomato leaf bacterial spot": "Tomato___Bacterial_spot",
    "Tomato leaf late blight": "Tomato___Late_blight",
    "Tomato leaf mosaic virus": "Tomato___Tomato_mosaic_virus",
    "Tomato leaf yellow virus": "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato leaf": "Tomato___healthy",
    "Tomato mold leaf": "Tomato___Leaf_Mold",
    "Tomato two spotted spider mites leaf": "Tomato___Spider_mites Two-spotted_spider_mite",
    "grape leaf black rot": "Grape___Black_rot",
    "grape leaf": "Grape___healthy",
}

MAIZE_NUTRIENT_TO_CLASS = {
    "Healthy": "Corn_(maize)___healthy",
    "Magnesium": "Corn_(maize)___Magnesium_deficiency",
    "Nitrogen": "Corn_(maize)___Nitrogen_deficiency",
    "Phosphorus": "Corn_(maize)___Phosphorus_deficiency",
    "Potassium": "Corn_(maize)___Potassium_deficiency",
}

# Whole-canopy plot photos by fertilizer rate; off by default (see build_manifest --include-canopy).
MAIZE_CANOPY_TO_CLASS = {
    "N0": "Corn_(maize)___Nitrogen_deficiency",
    "NFull": "Corn_(maize)___healthy",
}


def pretty(name: str) -> str:
    crop, _, cond = name.partition("___")
    crop = crop.replace("_(maize)", "").replace("_(including_sour)", "").replace(",_bell", " (bell)").replace("_", " ")
    cond = cond.strip("_").replace("_", " ")
    return f"{crop}: {cond}"
