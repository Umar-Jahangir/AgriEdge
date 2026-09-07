"""Tests for Edge AI ML model inference and API endpoints."""

import io
from PIL import Image
from fastapi.testclient import TestClient

from app.main import app
from app.services.inference import inference_service

client = TestClient(app)


def test_inference_service_model_loaded():
    status = inference_service.get_model_status()
    assert status.get("disease") is True
    metadata = inference_service._metadata.get("disease")
    assert metadata is not None
    assert len(metadata["classes"]) == 42


def test_inference_service_predict_synthetic_image():
    img = Image.new("RGB", (224, 224), color=(40, 140, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    preds = inference_service.analyze_image(raw_bytes, zone_id="ZONE_B")
    assert len(preds) == 1
    top = preds[0]
    assert top.model_type == "disease"
    assert top.confidence > 0.0
    assert top.crop is not None
    assert top.condition is not None
    assert top.treatment is not None
    assert top.top_k is not None
    assert len(top.top_k) >= 3


def test_api_analyze_image_mock_camera():
    response = client.post("/api/images/analyze?zone_id=ZONE_A")
    assert response.status_code == 200
    data = response.json()
    assert "image_id" in data
    assert data["zone_id"] == "ZONE_A"
    assert "image_url" in data
    assert len(data["predictions"]) > 0
    assert data["top_prediction"] is not None
    assert "crop_health" in data
    assert "crop_health_percent" in data
    assert "fused_assessment" in data


def test_api_analyze_image_upload():
    img = Image.new("RGB", (224, 224), color=(60, 160, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_leaf.jpg", buf, "image/jpeg")}
    response = client.post("/api/images/analyze?zone_id=ZONE_C", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE_C"
    assert data["image_url"].startswith("/images/")
    assert data["top_prediction"]["crop"] is not None
    assert data["top_prediction"]["confidence"] > 0.0


def test_api_crop_analysis_returns_scans():
    response = client.get("/api/crop-analysis")
    assert response.status_code == 200
    scans = response.json()
    assert isinstance(scans, list)
    assert len(scans) > 0
    latest = scans[0]
    assert "disease_detection" in latest
    assert "confidence" in latest
    assert "crop_health" in latest
    assert "crop_health_percent" in latest


def test_api_ai_results_with_model():
    response = client.get("/api/ai/results?zone_id=ZONE_C")
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE_C"
    assert "vision_predictions" in data
    assert len(data["vision_predictions"]) > 0
    assert "crop_health" in data


def test_inference_service_pest_model_loaded():
    status = inference_service.get_model_status()
    assert status.get("pest") is True
    metadata = inference_service._metadata.get("pest")
    assert metadata is not None
    assert len(metadata["classes"]) == 102


def test_inference_service_predict_pest():
    img = Image.new("RGB", (224, 224), color=(60, 100, 40))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    raw_bytes = buf.getvalue()

    preds = inference_service.analyze_image(raw_bytes, zone_id="ZONE_A", scan_type="pest")
    assert len(preds) == 1
    top = preds[0]
    assert top.model_type == "pest"
    assert top.confidence > 0.0
    assert top.pest_name is not None
    assert top.treatment is not None
    assert top.top_k is not None
    assert len(top.top_k) >= 3


def test_api_analyze_image_pest_scan():
    img = Image.new("RGB", (224, 224), color=(80, 80, 50))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"file": ("test_pest.jpg", buf, "image/jpeg")}
    response = client.post("/api/images/analyze?zone_id=ZONE_B&scan_type=pest", files=files)
    assert response.status_code == 200
    data = response.json()
    assert data["zone_id"] == "ZONE_B"
    assert data["top_prediction"]["model_type"] == "pest"
    assert data["crop_health"] == "Pest Infestation Detected"

