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
    crop_type: str | None = "Tomato (Abhinav F1)"
    growth_stage: str | None = "Vegetative Stage"
    growth_stage_hi: str | None = None
    growth_stage_mr: str | None = None
    stage_day: int | None = 34
    gdd_accumulated: int | None = 500
    yield_risk_pct: float | None = 10.0


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
    crop: str | None = None
    condition: str | None = None
    is_healthy: bool = False
    treatment: str | None = None
    top_k: list[dict[str, Any]] | None = None
    bbox: list[float] | None = None
    note: str | None = None
    pest_name: str | None = None
    hindi_name: str | None = None
    marathi_name: str | None = None
    severity: str | None = None


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
    image_id: int | str
    zone_id: str
    image_url: str | None = None
    predictions: list[VisionPrediction]
    top_prediction: VisionPrediction | None = None
    crop_health: str | None = None
    crop_health_percent: int | None = None
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
    soil_temperature: float | None = None
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
    telemetry_zone_id: str | None = None
    telemetry_source: str | None = None


class DashboardNPK(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    nitrogen_status: str
    phosphorus_status: str
    potassium_status: str
    timestamp: str


class ZoneYieldRisk(BaseModel):
    zone_id: str
    zone_name: str
    crop_type: str
    growth_stage: str
    growth_stage_hi: str | None = None
    growth_stage_mr: str | None = None
    stage_day: int
    gdd_accumulated: int
    yield_risk_level: str
    yield_risk_pct: float
    expected_yield_quintals_per_acre: float
    potential_yield_quintals_per_acre: float
    yield_saved_quintals_per_acre: float
    water_penalty_pct: float
    nutrient_penalty_pct: float
    disease_penalty_pct: float
    critical_sensitivity: bool


class YieldRiskResponse(BaseModel):
    overall_yield_risk: str
    projected_yield_risk_pct: float
    yield_saved_quintals_per_acre: float
    pesticide_savings_inr_per_ha: int
    revenue_preserved_inr_per_acre: int
    potential_yield_quintals_per_acre: float
    crop_type: str
    blanket_spray_cost_inr_per_ha: float
    targeted_spray_cost_inr_per_ha: float
    zones: list[ZoneYieldRisk]
    decision_insights: dict[str, str]
    timestamp: str


class SMSDispatchRequest(BaseModel):
    phone_number: str
    channel: str = "SMS"  # "SMS" | "WHATSAPP"
    language: str = "hi"  # "hi" | "mr" | "en"
    message_text: str
    recipient_name: str | None = "Ramesh Patil"
    alert_id: str | None = None
    fast2sms_api_key: str | None = None
    callmebot_api_key: str | None = None



class SMSDispatchResponse(BaseModel):
    status: str
    channel: str
    recipient_name: str
    phone_number: str
    operator: str
    reference_id: str
    char_count: int
    sms_parts: int
    cost_inr: float
    delivered_at: str
    payload_preview: str
    live_dispatched: bool = False
    whatsapp_url: str | None = None
    sms_uri: str | None = None

