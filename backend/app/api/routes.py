"""API route handlers."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.camera.interface import get_camera
from app.config import get_settings
from app.database.session import get_db
from app.decision_engine.fusion import DecisionEngine
from app.rover.controller import execute_rover_command, get_rover_status
from app.rover.esp32_serial import get_esp32
from app.schemas.api import (
  AIAnalysisResult,
  AlertResponse,
  DashboardSummary,
  FarmResponse,
  HealthResponse,
  ImageAnalyzeResponse,
  RecommendationResponse,
  RiskAssessmentResponse,
  RoverCommandRequest,
  RoverStatusResponse,
  SensorReadingResponse,
  SensorTelemetry,
  SystemStatusResponse,
  VisionPrediction,
  ZoneDetail,
  ZoneSummary,
)
from app.services.demo_data import get_all_demo_zones, get_demo_zone
from app.services.inference import inference_service
from app.sensors.validator import SensorValidator

router = APIRouter()
settings = get_settings()
decision_engine = DecisionEngine()
validator = SensorValidator()
esp32 = get_esp32()
camera = get_camera()


@router.get("/health", response_model=HealthResponse)
def health():
  return HealthResponse(
    status="ok",
    app=settings.app_name,
    version=settings.app_version,
    mock_mode=settings.mock_mode,
    demo_mode=settings.demo_mode,
    esp32_connected=esp32.is_connected(),
    camera_available=camera.is_available(),
    ai_models_loaded=inference_service.get_model_status(),
  )


@router.get("/system-status", response_model=SystemStatusResponse)
def system_status():
  return SystemStatusResponse(
    edge_ai="Connected" if any(inference_service.get_model_status().values()) else "Demo Mode",
    sensors="Connected" if esp32.is_connected() else "Disconnected",
    backend="Connected",
    esp32="Connected" if esp32.is_connected() else "Unavailable",
    camera="Available" if camera.is_available() else "Unavailable",
    internet="Optional",
  )


@router.get("/farm", response_model=FarmResponse)
def get_farm():
  zones = [
    ZoneSummary(
      id=z["id"], name=z["name"],
      soil_condition_score=z["soil_score"], moisture=z["soil_moisture"],
      ph=z["ph"], nitrogen=z["nitrogen"], phosphorus=z["phosphorus"],
      potassium=z["potassium"], crop_health=z["crop_health"],
      risk_level=z["risk_level"], sampling_coverage=z["sampling_coverage"],
    )
    for z in get_all_demo_zones()
  ]
  at_risk = sum(1 for z in zones if z.risk_level in ("MEDIUM", "HIGH"))
  status = "Healthy" if at_risk == 0 else "Attention Required" if at_risk < 3 else "Critical"
  return FarmResponse(id="demo-farm", name="Demo Farm", status=status, zones=zones)


@router.get("/zones", response_model=list[ZoneSummary])
def list_zones():
  return get_farm().zones


@router.get("/zones/{zone_id}", response_model=ZoneDetail)
def get_zone(zone_id: str):
  z = get_demo_zone(zone_id)
  return ZoneDetail(
    id=zone_id.upper(), name=z["name"],
    soil_condition_score=z["soil_score"], moisture=z["soil_moisture"],
    ph=z["ph"], nitrogen=z["nitrogen"], phosphorus=z["phosphorus"],
    potassium=z["potassium"], crop_health=z["crop_health"],
    risk_level=z["risk_level"], sampling_coverage=z["sampling_coverage"],
    air_temperature=z["air_temperature"], humidity=z["humidity"],
    latest_ai_detection=z["ai_detection"], ai_confidence=z["ai_confidence"],
    recommendation=z["recommendation"],
  )


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard():
  zone_b = get_demo_zone("ZONE_B")
  rover = get_rover_status()
  zones = get_all_demo_zones()
  at_risk = sum(1 for z in zones if z["risk_level"] in ("MEDIUM", "HIGH"))
  return DashboardSummary(
    farm_status="Attention Required" if at_risk > 0 else "Healthy",
    farm_name="Demo Farm",
    last_scan=rover.last_scan,
    rover_status=rover.state,
    connectivity="Connected",
    soil_condition_score=zone_b["soil_score"],
    soil_condition_status="Moderate",
    soil_moisture=zone_b["soil_moisture"],
    soil_moisture_status="Attention Required",
    temperature=zone_b["air_temperature"],
    soil_ph=zone_b["ph"],
    soil_ph_status="Optimal",
    electrical_conductivity=zone_b["ec"],
    crop_health=zone_b["crop_health"],
    water_stress="MEDIUM",
    last_synchronized=datetime.utcnow().strftime("%I:%M:%S %p"),
    active_alerts=at_risk,
    healthy_zones=len(zones) - at_risk,
    at_risk_zones=at_risk,
    is_demo=settings.demo_mode,
  )


@router.get("/sensors/latest", response_model=SensorReadingResponse)
def latest_sensors(zone_id: str = "ZONE_B"):
  telemetry = esp32.read_telemetry()
  if telemetry:
    telemetry.zone_id = zone_id
    validated, _ = validator.validate(telemetry)
    return SensorReadingResponse(id="latest", source="esp32" if not settings.mock_mode else "mock", **validated.model_dump())
  z = get_demo_zone(zone_id)
  return SensorReadingResponse(
    id="latest", zone_id=zone_id, source="demo",
    soil_moisture=z["soil_moisture"], soil_temperature=z["soil_temperature"],
    ph=z["ph"], ec=z["ec"], nitrogen=z["nitrogen"],
    phosphorus=z["phosphorus"], potassium=z["potassium"],
    air_temperature=z["air_temperature"], humidity=z["humidity"],
    timestamp=datetime.utcnow(),
  )


@router.post("/sensors/telemetry", response_model=SensorReadingResponse)
def ingest_telemetry(data: SensorTelemetry, db: Session = Depends(get_db)):
  validated, warnings = validator.validate(data)
  # TODO: persist to database
  return SensorReadingResponse(id="ingested", source="api", **validated.model_dump())


@router.get("/ai/results", response_model=AIAnalysisResult)
def ai_results(zone_id: str = "ZONE_B"):
  z = get_demo_zone(zone_id)
  telemetry = SensorTelemetry(
    zone_id=zone_id, soil_moisture=z["soil_moisture"],
    nitrogen=z["nitrogen"], air_temperature=z["air_temperature"],
  )
  preds = inference_service._demo_predictions(zone_id)
  fused = decision_engine.fuse(zone_id, telemetry, preds)
  return AIAnalysisResult(
    zone_id=zone_id,
    soil_condition_score=z["soil_score"],
    crop_health=z["crop_health"],
    water_stress_risk="MEDIUM" if z["scenario"] == "possible_water_stress" else "LOW",
    disease_risk="HIGH" if z["scenario"] == "possible_disease" else "LOW",
    nutrient_deficiency="Moderate Nitrogen Deficiency" if z["nitrogen"] < 50 else "None detected",
    yield_risk="LOW",
    vision_predictions=preds,
    sensor_evidence=fused.get("sensor_evidence", []),
    timestamp=datetime.utcnow(),
    is_demo=settings.demo_mode,
  )


@router.post("/images/analyze", response_model=ImageAnalyzeResponse)
def analyze_image(zone_id: str = "ZONE_B"):
  path = camera.capture(zone_id)
  if not path:
    raise HTTPException(status_code=503, detail="Camera unavailable")
  preds = inference_service.analyze_image(path, zone_id)
  z = get_demo_zone(zone_id)
  telemetry = SensorTelemetry(zone_id=zone_id, soil_moisture=z["soil_moisture"], nitrogen=z["nitrogen"])
  fused = decision_engine.fuse(zone_id, telemetry, preds)
  return ImageAnalyzeResponse(image_id=1, zone_id=zone_id, predictions=preds, fused_assessment=fused)


@router.get("/recommendations", response_model=list[RecommendationResponse])
def recommendations():
  icons = {"IRRIGATION": "💧", "NUTRIENTS": "🌱", "DISEASE": "🦠", "PEST": "🐛", "HEAT_STRESS": "🌡️"}
  results = []
  for z in get_all_demo_zones():
    if z["scenario"] != "healthy":
      cat = {
        "possible_water_stress": "IRRIGATION",
        "possible_disease": "DISEASE",
        "pest_detected": "PEST",
      }.get(z["scenario"], "GENERAL")
      results.append(RecommendationResponse(
        id=f"rec-{z['id']}", zone_id=z["id"], category=cat,
        issue=z["ai_detection"], severity=z["risk_level"],
        reason=f"Demo scenario: {z['scenario']}",
        action=z["recommendation"],
        timestamp=datetime.utcnow(),
        icon=icons.get(cat, "💡"),
      ))
  return results


@router.get("/alerts", response_model=list[AlertResponse])
def alerts():
  items = []
  for z in get_all_demo_zones():
    if z["risk_level"] in ("MEDIUM", "HIGH"):
      items.append(AlertResponse(
        id=f"alert-{z['id']}", type=z["scenario"].replace("_", " ").title(),
        severity=z["risk_level"], location=z["name"],
        message=z["ai_detection"], timestamp=datetime.utcnow(), status="active",
      ))
  return items


@router.get("/rover/status", response_model=RoverStatusResponse)
def rover_status():
  return get_rover_status()


@router.post("/rover/command", response_model=RoverStatusResponse)
def rover_command(req: RoverCommandRequest):
  return execute_rover_command(req.command)


# Legacy endpoints for existing frontend compatibility
@router.post("/rover/start", response_model=RoverStatusResponse)
def rover_start():
  return execute_rover_command("start")

@router.post("/rover/pause", response_model=RoverStatusResponse)
def rover_pause():
  return execute_rover_command("pause")

@router.post("/rover/resume", response_model=RoverStatusResponse)
def rover_resume():
  return execute_rover_command("resume")

@router.post("/rover/return", response_model=RoverStatusResponse)
def rover_return():
  return execute_rover_command("return")

@router.post("/rover/emergency-stop", response_model=RoverStatusResponse)
def rover_emergency():
  return execute_rover_command("emergency_stop")

@router.get("/ai-analysis", response_model=AIAnalysisResult)
def ai_analysis_compat(zone_id: str = "ZONE_B"):
  return ai_results(zone_id)

@router.get("/farm-zones", response_model=list[ZoneSummary])
def farm_zones_compat():
  return list_zones()
