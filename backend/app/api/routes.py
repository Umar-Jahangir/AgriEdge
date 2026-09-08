"""API route handlers."""

from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.camera.interface import get_camera
from app.config import get_settings
from app.database.session import get_db
from app.decision_engine.fusion import DecisionEngine
from app.models.entities import AIPrediction, ImageRecord, RiskAssessment
from app.rover.controller import execute_rover_command, get_rover_status
from app.rover.esp32_serial import get_esp32
from app.schemas.api import (
  AIAnalysisResult,
  AlertResponse,
  DashboardSummary,
  DashboardNPK,
  FarmResponse,
  HealthResponse,
  ImageAnalyzeResponse,
  RecommendationResponse,
  RiskAssessmentResponse,
  RoverCommandRequest,
  RoverStatusResponse,
  SensorReadingResponse,
  SensorTelemetry,
  SMSDispatchRequest,
  SMSDispatchResponse,
  SystemStatusResponse,
  VisionPrediction,
  YieldRiskResponse,
  ZoneDetail,
  ZoneSummary,
)
from app.services.demo_data import get_all_demo_zones, get_demo_zone
from app.services.inference import inference_service
from app.services.weather import live_weather_service
from app.services.yield_risk import yield_risk_service
from app.sensors.validator import SensorValidator

router = APIRouter()
settings = get_settings()
decision_engine = DecisionEngine()
validator = SensorValidator()
esp32 = get_esp32()
camera = get_camera()

# Latest telemetry received from ESP32 over Wi-Fi.
# Prototype storage: kept in memory until database persistence is added.
latest_wifi_telemetry: SensorTelemetry | None = None


def _wifi_telemetry_live() -> bool:
  return latest_wifi_telemetry is not None


def _moisture_status(moisture: float) -> str:
  if moisture < 30:
    return "Attention Required"
  if moisture < 38:
    return "Moderate"
  if moisture <= 55:
    return "Optimal"
  return "Moderate"


@router.get("/health", response_model=HealthResponse)
def health():
  return HealthResponse(
    status="ok",
    app=settings.app_name,
    version=settings.app_version,
    mock_mode=settings.mock_mode,
    demo_mode=settings.demo_mode,
    esp32_connected=_wifi_telemetry_live() or esp32.is_connected(),
    camera_available=camera.is_available(),
    ai_models_loaded=inference_service.get_model_status(),
  )


@router.get("/system-status", response_model=SystemStatusResponse)
def system_status():
  sensors_live = _wifi_telemetry_live() or esp32.is_connected()
  return SystemStatusResponse(
    edge_ai="Connected" if any(inference_service.get_model_status().values()) else "Demo Mode",
    sensors="Connected" if sensors_live else "Disconnected",
    backend="Connected",
    esp32="Connected" if sensors_live else "Unavailable",
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
      crop_type=z.get("crop_type", "Tomato (Abhinav F1)"),
      growth_stage=z.get("growth_stage", "Vegetative Stage"),
      growth_stage_hi=z.get("growth_stage_hi"),
      growth_stage_mr=z.get("growth_stage_mr"),
      stage_day=z.get("stage_day", 34),
      gdd_accumulated=z.get("gdd_accumulated", 500),
      yield_risk_pct=z.get("yield_risk_pct", 10.0),
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
    crop_type=z.get("crop_type", "Tomato (Abhinav F1)"),
    growth_stage=z.get("growth_stage", "Vegetative Stage"),
    growth_stage_hi=z.get("growth_stage_hi"),
    growth_stage_mr=z.get("growth_stage_mr"),
    stage_day=z.get("stage_day", 34),
    gdd_accumulated=z.get("gdd_accumulated", 500),
    yield_risk_pct=z.get("yield_risk_pct", 10.0),
    air_temperature=z["air_temperature"], humidity=z["humidity"],
    latest_ai_detection=z["ai_detection"], ai_confidence=z["ai_confidence"],
    recommendation=z["recommendation"],
  )


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard():
  # Keep demo zone list / crop-health context; overlay live Wi-Fi telemetry when present.
  zone_b = get_demo_zone("ZONE_B")
  rover = get_rover_status()
  zones = get_all_demo_zones()
  at_risk = sum(1 for z in zones if z["risk_level"] in ("MEDIUM", "HIGH"))

  soil_moisture = zone_b["soil_moisture"]
  soil_temperature = zone_b.get("soil_temperature")
  air_temperature = zone_b["air_temperature"]
  soil_ph = zone_b["ph"]
  ec = zone_b["ec"]
  nitrogen = zone_b["nitrogen"]
  phosphorus = zone_b["phosphorus"]
  potassium = zone_b["potassium"]
  telemetry_zone_id = None
  telemetry_source = None
  is_demo = settings.demo_mode

  live = latest_wifi_telemetry
  if live is not None:
    telemetry_zone_id = live.zone_id
    telemetry_source = "api"
    is_demo = False
    if live.soil_moisture is not None:
      soil_moisture = live.soil_moisture
    if live.soil_temperature is not None:
      soil_temperature = live.soil_temperature
    if live.air_temperature is not None:
      air_temperature = live.air_temperature
    if live.ph is not None:
      soil_ph = live.ph
    if live.ec is not None:
      ec = live.ec
    if live.nitrogen is not None:
      nitrogen = live.nitrogen
    if live.phosphorus is not None:
      phosphorus = live.phosphorus
    if live.potassium is not None:
      potassium = live.potassium

  return DashboardSummary(
    farm_status="Attention Required" if at_risk > 0 else "Healthy",
    farm_name="Demo Farm",
    last_scan=rover.last_scan,
    rover_status=rover.state,
    connectivity="Connected",
    soil_condition_score=zone_b["soil_score"],
    soil_condition_status="Moderate",
    soil_moisture=soil_moisture,
    soil_moisture_status=_moisture_status(soil_moisture),
    temperature=air_temperature,
    soil_temperature=soil_temperature,
    soil_ph=soil_ph,
    soil_ph_status="Optimal",
    electrical_conductivity=ec,
    npk=DashboardNPK(
      nitrogen=nitrogen,
      phosphorus=phosphorus,
      potassium=potassium,
      nitrogen_status="Good" if nitrogen >= 50 else "Moderate",
      phosphorus_status="Good" if phosphorus >= 30 else "Moderate",
      potassium_status="Good" if potassium >= 45 else "Moderate",
      timestamp=datetime.utcnow().isoformat(),
    ),
    crop_health=zone_b["crop_health"],
    water_stress="MEDIUM",
    last_synchronized=datetime.utcnow().strftime("%I:%M:%S %p"),
    active_alerts=at_risk,
    healthy_zones=len(zones) - at_risk,
    at_risk_zones=at_risk,
    is_demo=is_demo,
    telemetry_zone_id=telemetry_zone_id,
    telemetry_source=telemetry_source,
  )


@router.get("/sensors/latest", response_model=SensorReadingResponse)
def latest_sensors(zone_id: str = "ZONE_A"):
    # Prefer the latest ESP32 Wi-Fi telemetry.
    if latest_wifi_telemetry is not None:
        return SensorReadingResponse(
            id="latest",
            source="api",
            **latest_wifi_telemetry.model_dump()
        )

    # Legacy Serial ESP32 fallback.
    telemetry = esp32.read_telemetry()
    if telemetry:
        telemetry.zone_id = zone_id
        validated, _ = validator.validate(telemetry)

        return SensorReadingResponse(
            id="latest",
            source="esp32",
            **validated.model_dump()
        )

    # Final fallback: existing demo data.
    z = get_demo_zone(zone_id)

    return SensorReadingResponse(
        id="latest",
        zone_id=zone_id,
        source="demo",
        soil_moisture=z["soil_moisture"],
        soil_temperature=z["soil_temperature"],
        ph=z["ph"],
        ec=z["ec"],
        nitrogen=z["nitrogen"],
        phosphorus=z["phosphorus"],
        potassium=z["potassium"],
        air_temperature=z["air_temperature"],
        humidity=z["humidity"],
        timestamp=datetime.utcnow(),
    )


def _history_points(values: list[float]) -> list[dict]:
  """Create recent, timestamped demo measurements for dashboard charts."""
  start = datetime.utcnow() - timedelta(days=len(values) - 1)
  return [
    {"timestamp": (start + timedelta(days=index)).isoformat(), "value": value}
    for index, value in enumerate(values)
  ]


@router.get("/sensors/history")
def sensor_history(range: str = "7d"):
  """Historical sensor data used by the Soil Health and Risk pages in demo mode."""
  # The range is accepted for API compatibility. Demo data is a representative
  # recent sequence until persisted sensor history is connected.
  return {
    "soil_moisture": _history_points([41, 39, 37, 35, 33, 34, 35.3]),
    "soil_temperature": _history_points([24.1, 24.5, 25.0, 25.4, 25.8, 25.5, 25.6]),
    "ph": _history_points([6.7, 6.7, 6.6, 6.6, 6.5, 6.5, 6.5]),
    "ec": _history_points([1.2, 1.2, 1.15, 1.1, 1.1, 1.12, 1.1]),
    "nitrogen": _history_points([54, 53, 52, 50, 49, 48, 48]),
    "phosphorus": _history_points([30, 30, 29, 28, 28, 27, 27]),
    "potassium": _history_points([46, 46, 45, 44, 43, 42, 42]),
  }


@router.get("/soil-analysis")
def soil_analysis():
  zone = get_demo_zone("ZONE_B")
  return {
    "overall_score": zone["soil_score"],
    "moisture": "Moderate",
    "ph": "Good",
    "npk": "Moderate",
    "ec": "Good",
    "temperature": "Good",
    "derived_from": "Derived from simulated moisture, pH, EC, NPK and temperature readings.",
    "timestamp": datetime.utcnow().isoformat(),
  }


@router.get("/crop-analysis")
def crop_analysis(db: Session = Depends(get_db)):
  records = (
    db.query(ImageRecord, AIPrediction)
    .outerjoin(AIPrediction, AIPrediction.image_id == ImageRecord.id)
    .order_by(ImageRecord.id.desc())
    .limit(20)
    .all()
  )
  if records:
    items = []
    for img, pred in records:
      meta = pred.metadata_json or {} if pred else {}
      is_healthy = meta.get("is_healthy", False) if meta else False
      cond = meta.get("condition") or (pred.prediction_class if pred else "No disease detected")
      
      if pred and pred.model_type == "pest":
        crop_status = "Pest Infestation Detected"
      elif is_healthy or "healthy" in cond.lower():
        crop_status = "Healthy"
      elif any(k in cond.lower() for k in ("deficiency", "nitrogen", "nutrient", "phosphorus", "potassium", "magnesium")):
        crop_status = "Possible Nutrient Deficiency"
      else:
        crop_status = "Possible Disease Detected"
        
      conf_val = round((pred.confidence * 100) if pred else 90.0, 1)
      crop_percent = max(25, int(round((1.0 - (pred.confidence * 0.6 if pred and not is_healthy else 0.05)) * 100)))
      items.append({
        "id": f"scan-{img.id}",
        "timestamp": img.timestamp.isoformat(),
        "image_url": f"/images/{Path(img.file_path).name}" if Path(img.file_path).name else "",
        "disease_detection": pred.prediction_class if pred else "No disease detected",
        "confidence": conf_val,
        "crop_health": crop_status,
        "crop_health_percent": crop_percent,
        "zone_id": img.zone_id,
        "model_type": pred.model_type if pred else "disease",
        "pest_name": meta.get("pest_name"),
        "hindi_name": meta.get("hindi_name"),
        "marathi_name": meta.get("marathi_name"),
        "severity": meta.get("severity"),
        "treatment": meta.get("treatment"),
        "top_k": meta.get("top_k"),
        "notes": meta.get("treatment") or (meta.get("note") if meta else "Edge AI inference scan."),
      })
    return items

  return [
    {
      "id": "scan-zone-c",
      "timestamp": datetime.utcnow().isoformat(),
      "image_url": "",
      "disease_detection": "Tomato: Early blight",
      "confidence": 87.0,
      "crop_health": "Possible Disease Detected",
      "crop_health_percent": 65,
      "zone_id": "ZONE_C",
      "notes": "Remove affected foliage immediately. Apply chlorothalonil or copper fungicide.",
    },
    {
      "id": "scan-zone-a",
      "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
      "image_url": "",
      "disease_detection": "Corn: healthy",
      "confidence": 94.0,
      "crop_health": "Healthy",
      "crop_health_percent": 91,
      "zone_id": "ZONE_A",
      "notes": "Crop foliage appears healthy. Continue regular irrigation and monitoring.",
    },
  ]


@router.get("/weather/live")
async def live_weather(lat: float | None = None, lon: float | None = None):
  """Returns live weather, 7-day forecast, GloFAS river discharge, and agro-climatic predictions."""
  weather = await live_weather_service.get_live_weather(lat, lon)
  flood = await live_weather_service.get_flood_forecast(lat, lon)
  zone = get_demo_zone("ZONE_B")
  predictions = live_weather_service.predict_risks(
    weather=weather,
    flood=flood,
    soil_moisture=zone.get("soil_moisture", 28.0),
    soil_temp=zone.get("soil_temperature", 24.0),
    lat=lat,
    lon=lon,
  )
  return predictions


@router.get("/environmental-risk")
async def environmental_risk(lat: float | None = None, lon: float | None = None):
  """Aggregates in-situ rover sensors with live Open-Meteo & GloFAS agro-meteorological models."""
  zone = get_demo_zone("ZONE_B")
  weather = await live_weather_service.get_live_weather(lat, lon)
  flood = await live_weather_service.get_flood_forecast(lat, lon)
  predictions = live_weather_service.predict_risks(
    weather=weather,
    flood=flood,
    soil_moisture=zone.get("soil_moisture", 28.0),
    soil_temp=zone.get("soil_temperature", 24.0),
    lat=lat,
    lon=lon,
  )
  current = predictions.get("current_weather", {})
  preds = predictions.get("predictions", {})

  return {
    "drought_risk": preds.get("drought", {}).get("severity", "MEDIUM"),
    "flood_risk": preds.get("flood", {}).get("severity", "LOW"),
    "heat_stress_risk": preds.get("heat_stress", {}).get("severity", "MEDIUM"),
    "crop_disease_risk": preds.get("foliar_disease", {}).get("severity", "LOW"),
    "water_stress_risk": preds.get("water_stress", {}).get("severity", "MEDIUM"),
    "air_temperature": current.get("temperature", zone["air_temperature"]),
    "humidity": current.get("humidity", zone["humidity"]),
    "soil_temperature": zone["soil_temperature"],
    "soil_moisture": zone["soil_moisture"],
    "weather_integration_pending": False,
    "location": predictions.get("location", {"latitude": 18.5204, "longitude": 73.8567}),
    "current_weather": current,
    "predictions": preds,
    "daily_forecast": predictions.get("daily_forecast", []),
    "advisories": predictions.get("advisories", {}),
    "source": predictions.get("source", "Open-Meteo & GloFAS"),
    "timestamp": datetime.utcnow().isoformat(),
  }


class ValveControlRequest(BaseModel):
  mode: str = "AUTO"  # "AUTO" | "MANUAL"
  state: str = "STANDBY"  # "STANDBY" | "ACTIVE" | "OFF"


_irrigation_relay_state = {
  "mode": "AUTO",
  "state": "STANDBY",
  "pump_active": False,
  "last_updated": datetime.utcnow().isoformat(),
}


@router.get("/irrigation/schedule")
async def irrigation_schedule(lat: float | None = None, lon: float | None = None):
  """Computes smart irrigation schedule and water conservation metrics based on soil moisture and 48h rain forecast."""
  zone = get_demo_zone("ZONE_B")
  weather = await live_weather_service.get_live_weather(lat, lon)
  schedule = live_weather_service.get_irrigation_schedule(
    weather=weather,
    soil_moisture=zone.get("soil_moisture", 24.0),
    soil_temp=zone.get("soil_temperature", 28.0),
  )
  schedule["relay_state"] = _irrigation_relay_state
  return schedule


@router.post("/irrigation/valve")
def control_irrigation_valve(req: ValveControlRequest):
  """Allows manual or automated override of the smart farm solenoid valve / pump relay."""
  global _irrigation_relay_state
  mode = req.mode.upper()
  state = req.state.upper()
  _irrigation_relay_state = {
    "mode": mode,
    "state": state,
    "pump_active": state == "ACTIVE",
    "last_updated": datetime.utcnow().isoformat(),
  }
  return {
    "status": "success",
    "relay_state": _irrigation_relay_state,
    "message": f"Irrigation pump relay set to {state} ({mode} mode)",
  }


@router.get("/yield-risk", response_model=YieldRiskResponse)
def yield_risk_forecast():
  """Computes crop phenology growth stages, yield risk penalties, and farm economics (PS §1 & §7)."""
  zones = get_all_demo_zones()
  return yield_risk_service.calculate_farm_forecast(zones)


@router.get("/analytics")
def analytics(range: str = "7d"):
  history = sensor_history(range)
  return {
    **history,
    "crop_health": _history_points([91, 88, 84, 80, 76, 72, 72]),
    "soil_condition_score": _history_points([84, 81, 78, 74, 71, 69, 68]),
    "environmental_risk": _history_points([22, 28, 35, 48, 56, 61, 64]),
    "sampling_coverage": [
      {"zone_id": z["id"], "zone_name": z["name"], "coverage": z["sampling_coverage"]}
      for z in get_all_demo_zones()
    ],
  }


@router.post("/sensors/telemetry", response_model=SensorReadingResponse)
def ingest_telemetry(data: SensorTelemetry, db: Session = Depends(get_db)):
    global latest_wifi_telemetry

    validated, warnings = validator.validate(data)

    # Store the latest ESP32 Wi-Fi telemetry in memory.
    latest_wifi_telemetry = validated

    return SensorReadingResponse(
        id="ingested",
        source="api",
        **validated.model_dump()
    )

@router.get("/ai/results", response_model=AIAnalysisResult)
def ai_results(zone_id: str = "ZONE_B", db: Session = Depends(get_db)):
  z = get_demo_zone(zone_id)
  telemetry = SensorTelemetry(
    zone_id=zone_id, soil_moisture=z["soil_moisture"],
    nitrogen=z["nitrogen"], air_temperature=z["air_temperature"],
  )

  recent = (
    db.query(AIPrediction)
    .filter(AIPrediction.zone_id == zone_id)
    .order_by(AIPrediction.id.desc())
    .first()
  )
  if recent and recent.metadata_json:
    preds = [VisionPrediction(**recent.metadata_json)]
  elif inference_service.get_model_status().get("disease"):
    path = camera.capture(zone_id)
    preds = inference_service.analyze_image(path, zone_id) if path else inference_service._demo_predictions(zone_id)
  else:
    preds = inference_service._demo_predictions(zone_id)

  fused = decision_engine.fuse(zone_id, telemetry, preds)
  top_risk = fused.get("risk", "HEALTHY")
  disease_risk = "HIGH" if top_risk == "DISEASE_RISK" else "LOW"
  water_stress_risk = "MEDIUM" if z["scenario"] == "possible_water_stress" else "LOW"
  nutrient_def = "Moderate Nitrogen Deficiency" if z["nitrogen"] < 50 else "None detected"
  if top_risk in ("NUTRIENT_DEFICIENCY", "COMBINED_NUTRIENT_WATER_STRESS"):
    nutrient_def = "Nutrient deficiency detected by Edge AI"

  return AIAnalysisResult(
    zone_id=zone_id,
    soil_condition_score=z["soil_score"],
    crop_health=fused.get("crop_health_score", z["crop_health"]),
    water_stress_risk=water_stress_risk,
    disease_risk=disease_risk,
    nutrient_deficiency=nutrient_def,
    yield_risk="LOW",
    vision_predictions=preds,
    sensor_evidence=fused.get("sensor_evidence", []),
    timestamp=datetime.utcnow(),
    is_demo=settings.demo_mode,
  )


@router.post("/images/analyze", response_model=ImageAnalyzeResponse)
async def analyze_image(
  zone_id: str = "ZONE_B",
  scan_type: str = "auto",
  file: UploadFile | None = File(None),
  db: Session = Depends(get_db),
):
  path = None
  source = "camera"
  if file and file.filename:
    settings.images_dir.mkdir(parents=True, exist_ok=True)
    content = await file.read()
    if not content:
      raise HTTPException(status_code=400, detail="Uploaded file is empty")
    ext = Path(file.filename).suffix or ".jpg"
    filename = f"upload_{zone_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}{ext}"
    path = settings.images_dir / filename
    path.write_bytes(content)
    source = "upload"
  else:
    path = camera.capture(zone_id)
    if not path:
      raise HTTPException(status_code=503, detail="Camera unavailable")
    source = "camera"

  preds = inference_service.analyze_image(path, zone_id, scan_type=scan_type)
  top_pred = preds[0] if preds else None

  # Save image and prediction to database
  img_rec = ImageRecord(zone_id=zone_id, file_path=str(path), source=source)
  db.add(img_rec)
  db.commit()
  db.refresh(img_rec)

  if top_pred:
    pred_rec = AIPrediction(
      image_id=img_rec.id,
      zone_id=zone_id,
      model_type=top_pred.model_type,
      prediction_class=top_pred.prediction_class,
      confidence=top_pred.confidence,
      metadata_json=top_pred.model_dump(),
    )
    db.add(pred_rec)
    db.commit()

  z = get_demo_zone(zone_id)
  telemetry = SensorTelemetry(
    zone_id=zone_id,
    soil_moisture=z["soil_moisture"],
    nitrogen=z["nitrogen"],
    air_temperature=z["air_temperature"],
  )
  fused = decision_engine.fuse(zone_id, telemetry, preds)

  if top_pred and top_pred.model_type == "pest":
    crop_health = "Pest Infestation Detected"
  else:
    crop_health = fused.get(
      "crop_health_status",
      "Healthy" if (top_pred and top_pred.is_healthy) else "Possible Disease Detected",
    )
  crop_health_percent = fused.get(
    "crop_health_score",
    90 if (top_pred and top_pred.is_healthy) else 65,
  )

  return ImageAnalyzeResponse(
    image_id=img_rec.id,
    zone_id=zone_id,
    image_url=f"/images/{path.name}",
    predictions=preds,
    top_prediction=top_pred,
    crop_health=crop_health,
    crop_health_percent=crop_health_percent,
    fused_assessment=fused,
  )


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


LATEST_LIVE_DISPATCH: dict | None = None


@router.get("/alerts/live-dispatch")
def get_live_alert_dispatch():
  """Returns the most recent alert dispatched to feature/smart phones for live client notification reception."""
  return LATEST_LIVE_DISPATCH or {"status": "IDLE", "message": "No dispatches yet."}


@router.post("/alerts/dispatch-sms", response_model=SMSDispatchResponse)
async def dispatch_sms_alert(req: SMSDispatchRequest):
  """Dispatches SMS or WhatsApp alerts formatted for basic 2G keypad / feature phones (PS §6).
  Supports authentic telecom gateway simulation, live CallMeBot WhatsApp, and Fast2SMS cellular dispatch."""
  global LATEST_LIVE_DISPATCH
  import random
  import urllib.parse
  import os
  import httpx
  import logging

  logger = logging.getLogger(__name__)

  ref = f"TXN-{random.randint(10000, 99999)}-BSNL-IN"
  char_count = len(req.message_text)
  # Unicode / Devanagari SMS parts are 70 chars per SMS segment in Indian telecom standards
  is_unicode = any(ord(c) > 127 for c in req.message_text)
  parts = max(1, (char_count + 69) // 70) if is_unicode else max(1, (char_count + 159) // 160)
  cost = round(parts * 0.12, 2)
  operator = "Jio / BSNL 2G GSM (mKisan Gateway)" if req.channel.upper() == "SMS" else "WhatsApp Business Cloud Gateway"
  live_dispatched = False

  # Normalize phone number to 10-digit and international E.164 without spaces
  raw_digits = "".join(filter(str.isdigit, req.phone_number))
  if len(raw_digits) == 10:
    full_e164 = f"91{raw_digits}"
    phone_10 = raw_digits
  elif raw_digits.startswith("91") and len(raw_digits) == 12:
    full_e164 = raw_digits
    phone_10 = raw_digits[2:]
  else:
    full_e164 = raw_digits or "919822012345"
    phone_10 = raw_digits[-10:] if len(raw_digits) >= 10 else "9822012345"

  # Build official live WhatsApp send link and native SMS URI
  encoded_text = urllib.parse.quote(req.message_text)
  whatsapp_url = f"https://api.whatsapp.com/send?phone={full_e164}&text={encoded_text}"
  sms_uri = f"sms:+{full_e164}?body={encoded_text}"

  # Real Cellular SMS Gateway Dispatch via Fast2SMS (if API key provided in request or environment)
  f2s_key = req.fast2sms_api_key or os.environ.get("FAST2SMS_API_KEY")
  if f2s_key and req.channel.upper() == "SMS":
    try:
      async with httpx.AsyncClient(timeout=8.0) as client:
        f2s_res = await client.post(
          "https://www.fast2sms.com/dev/bulkV2",
          headers={"authorization": f2s_key, "Content-Type": "application/json"},
          json={
            "route": "q",
            "message": req.message_text,
            "language": "unicode" if is_unicode else "english",
            "flash": 0,
            "numbers": phone_10,
          },
        )
        data = f2s_res.json()
        if data.get("return"):
          operator = "Fast2SMS Telecom Gateway (Live Cellular BTS Dispatched)"
          req_id = data.get("request_id")
          if req_id:
            ref = f"TXN-{req_id}-FAST2SMS-IN"
          live_dispatched = True
        else:
          logger.warning("Fast2SMS cellular response: %s", data)
    except Exception as e:
      logger.warning("Fast2SMS real dispatch error: %s", e)

  # Real WhatsApp Gateway Dispatch via CallMeBot API (if API key provided in request or environment)
  cmb_key = req.callmebot_api_key or os.environ.get("CALLMEBOT_API_KEY")
  if cmb_key and req.channel.upper() == "WHATSAPP":
    try:
      async with httpx.AsyncClient(timeout=10.0) as client:
        cmb_res = await client.get(
          f"https://api.callmebot.com/whatsapp.php?phone=+{full_e164}&text={encoded_text}&apikey={cmb_key}"
        )
        if cmb_res.status_code == 200 and "error" not in cmb_res.text.lower():
          operator = "CallMeBot WhatsApp Cloud (Incoming Msg Received)"
          ref = f"WA-BOT-{random.randint(10000, 99999)}"
          live_dispatched = True
        else:
          logger.warning("CallMeBot response: %s", cmb_res.text)
    except Exception as e:
      logger.warning("CallMeBot dispatch error: %s", e)

  resp = SMSDispatchResponse(
    status="DELIVERED",
    channel=req.channel.upper(),
    recipient_name=req.recipient_name or "Ramesh Patil",
    phone_number=req.phone_number,
    operator=operator,
    reference_id=ref,
    char_count=char_count,
    sms_parts=parts,
    cost_inr=cost,
    delivered_at=datetime.utcnow().isoformat(),
    payload_preview=req.message_text,
    live_dispatched=live_dispatched,
    whatsapp_url=whatsapp_url,
    sms_uri=sms_uri,
  )

  # Update global state so any listening connected mobile phone / tablet triggers incoming reception
  LATEST_LIVE_DISPATCH = {
    **resp.model_dump(),
    "dispatch_id": f"disp-{random.randint(100000, 999999)}",
    "received_at": datetime.utcnow().isoformat(),
  }

  return resp




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
def ai_analysis_compat(zone_id: str = "ZONE_B", db: Session = Depends(get_db)):
  return ai_results(zone_id, db)

@router.get("/farm-zones", response_model=list[ZoneSummary])
def farm_zones_compat():
  return list_zones()


@router.get("/farm-map")
def farm_map_compat():
  """Dashboard map data for the React frontend's live-data mode."""
  rover = get_rover_status()
  points = [
    {
      "id": f"point-{index}",
      "zone_id": f"ZONE_{chr(65 + ((index - 1) % 4))}",
      "point_number": index,
      "x": 12 + ((index - 1) % 5) * 19,
      "y": 18 + ((index - 1) // 5) * 20,
      "status": "current" if index == rover.current_sampling_point else "completed" if index < rover.current_sampling_point else "pending",
    }
    for index in range(1, rover.total_sampling_points + 1)
  ]
  points.extend([
    {"id": "attention-zone-b", "zone_id": "ZONE_B", "point_number": 31, "x": 72, "y": 30, "status": "attention"},
    {"id": "attention-zone-c", "zone_id": "ZONE_C", "point_number": 32, "x": 30, "y": 72, "status": "attention"},
  ])
  return {
    "rover": {
      **rover.model_dump(),
      "position": {"x": 55, "y": 62},
    },
    "sampling_points": points,
    "zones": list_zones(),
    "attention_areas": [
      {"x": 72, "y": 30, "zone_id": "ZONE_B"},
      {"x": 30, "y": 72, "zone_id": "ZONE_C"},
    ],
  }


class TTSRequest(BaseModel):
  text: str
  language: str = "hi"
  voice_id: str | None = None
  api_key: str | None = None


@router.post("/tts/speak")
async def generate_tts_speech(req: TTSRequest):
  """Generate speech audio via ElevenLabs Multilingual V2 API."""
  from app.services.tts import ElevenLabsTTSService
  svc = ElevenLabsTTSService(api_key=req.api_key)
  audio = await svc.generate_speech(
    text=req.text,
    voice_id=req.voice_id,
    language=req.language,
    api_key_override=req.api_key,
  )
  if audio:
    return Response(content=audio, media_type="audio/mpeg")
  return {"fallback": True, "message": "ElevenLabs audio not available. Falling back to local TTS."}

