from datetime import datetime, timezone
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predictor import predict
from predictor_rich import predict_rich

app = FastAPI(
    title="Health Companion AI API",
    description="FastAPI backend for normal and personalized physiological anomaly detection",
    version="1.0"
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# =========================================================
# OLD MODEL INPUT
# =========================================================

class SensorData(BaseModel):
    heart_rate: float
    spo2: float
    temperature: float
    humidity: float
    activity: float


# =========================================================
# NEW RICH MODEL INPUT
# =========================================================

class RichSensorData(BaseModel):
    hr_deviation: float
    spo2_deviation: float
    resp_deviation: float
    ibi_deviation: float
    rms_dibi_deviation: float
    core_temp_deviation: float
    hr_activity_ratio: float


# =========================================================
# ESP32 TELEMETRY INPUT
# =========================================================

class TelemetryData(BaseModel):
    """One frame from the three physical sensor modules."""

    device_id: str = Field(min_length=1, max_length=64)
    sequence: int | None = Field(default=None, ge=0)
    firmware_version: str | None = Field(default=None, max_length=32)
    heart_rate: float | None = Field(default=None, ge=0, le=250)
    spo2: float | None = Field(default=None, ge=0, le=100)
    ambient_temperature: float | None = Field(default=None, ge=-40, le=85)
    humidity: float | None = Field(default=None, ge=0, le=100)
    activity: float | None = Field(default=None, ge=0)


# Proof-of-concept storage: the newest frame lives in memory and resets with the API.
latest_telemetry: dict | None = None


# =========================================================
# BASIC TEST ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "Health Companion backend running",
        "old_model_endpoint": "/predict",
        "rich_model_endpoint": "/predict-rich",
        "telemetry_ingest_endpoint": "/telemetry",
        "latest_telemetry_endpoint": "/telemetry/latest",
        "docs": "/docs"
    }


# =========================================================
# OLD MODEL ENDPOINT
# =========================================================

@app.post("/predict")
def predict_endpoint(data: SensorData):

    sensor_data = data.model_dump()

    result = predict(sensor_data)

    return {
        "sensor_data": sensor_data,
        "ai_result": result
    }


# =========================================================
# NEW PERSONALIZED RICH MODEL ENDPOINT
# =========================================================

@app.post("/predict-rich")
def predict_rich_endpoint(data: RichSensorData):

    feature_data = data.model_dump()

    result = predict_rich(feature_data)

    return {
        "features": feature_data,
        "ai_result": result
    }


# =========================================================
# ESP32 TELEMETRY ENDPOINTS
# =========================================================

@app.post("/telemetry")
def receive_telemetry(data: TelemetryData):
    global latest_telemetry

    received_at = datetime.now(timezone.utc)
    latest_telemetry = {
        "received_at": received_at.isoformat(),
        "telemetry": data.model_dump(),
    }

    return {
        "accepted": True,
        "device_id": data.device_id,
        "sequence": data.sequence,
        "received_at": latest_telemetry["received_at"],
    }


@app.get("/telemetry/latest")
def get_latest_telemetry():
    if latest_telemetry is None:
        return {
            "connected": False,
            "received_at": None,
            "age_seconds": None,
            "telemetry": None,
        }

    received_at = datetime.fromisoformat(latest_telemetry["received_at"])
    age_seconds = max(0.0, (datetime.now(timezone.utc) - received_at).total_seconds())

    return {
        "connected": age_seconds <= 10,
        "received_at": latest_telemetry["received_at"],
        "age_seconds": round(age_seconds, 3),
        "telemetry": latest_telemetry["telemetry"],
    }
