"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# --- Health & System ---

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    mock_mode: bool
    demo_mode: bool
    offline_capable: bool = True
    esp32_connected: bool
    camera_available: bool
    ai_models_loaded: dict[str, bool]


class SystemStatusResponse(BaseModel):
    edge_ai: str
    sensors: str
    backend: str
    esp32: str
    camera: str
    internet: str


# --- Farm & Zones ---

class ZoneSummary(BaseModel):
    id: str
    name: str
    soil_condition_score: int
    moisture: float
    ph: float
    nitrogen: float
    phosphorus: float
    potassium: float
    crop_health: int
    risk_level: str
    sampling_coverage: int


class ZoneDetail(ZoneSummary):
    air_temperature: float
    humidity: float
    latest_ai_detection: str | None = None
    ai_confidence: float | None = None
    recommendation: str | None = None


class FarmResponse(BaseModel):
    id: str
    name: str
    status: str
    zones: list[ZoneSummary]


# --- Sensors ---

class SensorTelemetry(BaseModel):
    zone_id: str
    timestamp: datetime | None = None
    soil_moisture: float | None = None
    soil_temperature: float | None = None
    ph: float | None = None
    ec: float | None = None
    nitrogen: float | None = None
    phosphorus: float | None = None
    potassium: float | None = None
    air_temperature: float | None = None
    humidity: float | None = None
    obstacle_distance_cm: float | None = None


class SensorReadingResponse(SensorTelemetry):
    id: int | str
    source: str = "mock"


# --- AI ---

class VisionPrediction(BaseModel):
    model_type: str
    prediction_class: str
    confidence: float
    bbox: list[float] | None = None
    note: str | None = None


class AIAnalysisResult(BaseModel):
    zone_id: str
    soil_condition_score: int
    crop_health: int
    water_stress_risk: str
    disease_risk: str
    nutrient_deficiency: str
    yield_risk: str
    vision_predictions: list[VisionPrediction] = []
    sensor_evidence: list[str] = []
    timestamp: datetime
    is_demo: bool = True


class ImageAnalyzeRequest(BaseModel):
    zone_id: str


class ImageAnalyzeResponse(BaseModel):
    image_id: int
    zone_id: str
    predictions: list[VisionPrediction]
    fused_assessment: dict[str, Any] | None = None


# --- Decision Engine ---

class RiskAssessmentResponse(BaseModel):
    zone: str
    risk: str
    severity: str
    confidence: float
    evidence: list[str]
    recommendation: str
    timestamp: datetime
    vision_evidence: list[str] = []
    sensor_evidence: list[str] = []


# --- Recommendations & Alerts ---

class RecommendationResponse(BaseModel):
    id: str
    zone_id: str
    category: str
    issue: str
    severity: str
    reason: str
    action: str
    timestamp: datetime
    icon: str = "💡"


class AlertResponse(BaseModel):
    id: str
    type: str
    severity: str
    location: str
    message: str
    timestamp: datetime
    status: str


# --- Rover ---

class RoverStatusResponse(BaseModel):
    state: str
    battery: float
    current_zone: str
    current_sampling_point: int
    distance_covered: float
    total_sampling_points: int
    completed_sampling_points: int
    obstacle_status: str
    connection: str
    last_scan: str


class RoverCommandRequest(BaseModel):
    command: str = Field(..., pattern="^(start|pause|resume|return|emergency_stop)$")


# --- Dashboard ---

class DashboardSummary(BaseModel):
    farm_status: str
    farm_name: str
    last_scan: str
    rover_status: str
    connectivity: str
    soil_condition_score: int
    soil_condition_status: str
    soil_moisture: float
    soil_moisture_status: str
    temperature: float
    soil_ph: float
    soil_ph_status: str
    electrical_conductivity: float
    npk: "DashboardNPK"
    crop_health: int
    water_stress: str
    last_synchronized: str
    active_alerts: int
    healthy_zones: int
    at_risk_zones: int
    is_demo: bool = True


class DashboardNPK(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    nitrogen_status: str
    phosphorus_status: str
    potassium_status: str
    timestamp: str
