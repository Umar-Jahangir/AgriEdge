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
  SystemStatusResponse,
  VisionPrediction,
  ZoneDetail,
  ZoneSummary,
)
from app.services.demo_data import get_all_demo_zones, get_demo_zone
from app.services.inference import inference_service
from app.services.weather import live_weather_service
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
    npk=DashboardNPK(
      nitrogen=zone_b["nitrogen"],
      phosphorus=zone_b["phosphorus"],
      potassium=zone_b["potassium"],
      nitrogen_status="Good" if zone_b["nitrogen"] >= 50 else "Moderate",
      phosphorus_status="Good" if zone_b["phosphorus"] >= 30 else "Moderate",
      potassium_status="Good" if zone_b["potassium"] >= 45 else "Moderate",
      timestamp=datetime.utcnow().isoformat(),
    ),
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
      
      if is_healthy or "healthy" in cond.lower():
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
  validated, warnings = validator.validate(data)
  # TODO: persist to database
  return SensorReadingResponse(id="ingested", source="api", **validated.model_dump())


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

  preds = inference_service.analyze_image(path, zone_id)
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
      model_type="disease",
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

