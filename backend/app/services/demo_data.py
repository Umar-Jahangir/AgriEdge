"""Demo zone scenarios for SIH presentation."""

from datetime import datetime

DEMO_ZONES = {
    "ZONE_A": {
        "name": "Zone A",
        "scenario": "healthy",
        "soil_moisture": 45.0,
        "soil_temperature": 24.5,
        "ph": 6.9,
        "ec": 1.3,
        "nitrogen": 58.0,
        "phosphorus": 32.0,
        "potassium": 48.0,
        "air_temperature": 27.0,
        "humidity": 65.0,
        "crop_health": 91,
        "soil_score": 88,
        "risk_level": "LOW",
        "sampling_coverage": 92,
        "ai_detection": "No significant issues detected",
        "ai_confidence": 0.94,
        "recommendation": "Zone A appears healthy. Continue regular monitoring.",
    },
    "ZONE_B": {
        "name": "Zone B",
        "scenario": "possible_water_stress",
        "soil_moisture": 24.0,
        "soil_temperature": 28.0,
        "ph": 6.5,
        "ec": 1.1,
        "nitrogen": 48.0,
        "phosphorus": 27.0,
        "potassium": 42.0,
        "air_temperature": 34.0,
        "humidity": 48.0,
        "crop_health": 72,
        "soil_score": 68,
        "risk_level": "MEDIUM",
        "sampling_coverage": 76,
        "ai_detection": "Possible water stress indicators",
        "ai_confidence": 0.81,
        "recommendation": "Inspect Zone B and consider irrigation based on crop requirements and local agronomic guidance.",
    },
    "ZONE_C": {
        "name": "Zone C",
        "scenario": "possible_disease",
        "soil_moisture": 38.0,
        "soil_temperature": 26.0,
        "ph": 6.4,
        "ec": 1.0,
        "nitrogen": 42.0,
        "phosphorus": 24.0,
        "potassium": 38.0,
        "air_temperature": 29.0,
        "humidity": 72.0,
        "crop_health": 65,
        "soil_score": 62,
        "risk_level": "HIGH",
        "sampling_coverage": 58,
        "ai_detection": "Possible disease detected",
        "ai_confidence": 0.87,
        "recommendation": "Inspect affected plants in Zone C. Visual symptoms suggest possible disease.",
    },
    "ZONE_D": {
        "name": "Zone D",
        "scenario": "pest_detected",
        "soil_moisture": 42.0,
        "soil_temperature": 25.0,
        "ph": 7.0,
        "ec": 1.2,
        "nitrogen": 52.0,
        "phosphorus": 30.0,
        "potassium": 45.0,
        "air_temperature": 28.0,
        "humidity": 60.0,
        "crop_health": 70,
        "soil_score": 75,
        "risk_level": "MEDIUM",
        "sampling_coverage": 84,
        "ai_detection": "Pest activity detected",
        "ai_confidence": 0.91,
        "recommendation": "Pest activity detected in Zone D. Inspect affected plants and consider appropriate integrated pest-management action.",
    },
}


def get_demo_zone(zone_id: str) -> dict:
    return DEMO_ZONES.get(zone_id.upper(), DEMO_ZONES["ZONE_A"])


def get_all_demo_zones() -> list[dict]:
    return [{"id": k, **v} for k, v in DEMO_ZONES.items()]
