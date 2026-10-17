from typing import List, Dict, Any, Optional
from datetime import datetime
import random
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services.telemetry_service import telemetry_service, TelemetryProcessingError
from app.services.ml_engine import ml_engine
from app.schemas.sensor_schemas import TelemetryUploadResponse
from app.schemas.anomaly_schemas import AnomalyDetectionResponse

router = APIRouter()


@router.post(
    "/upload",
    response_model=TelemetryUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload and ingest industrial sensor telemetry CSV",
)
async def upload_telemetry_csv(file: UploadFile = File(...)) -> TelemetryUploadResponse:
    """Ingest industrial machinery CSV, validate required channels, verify monotonicity,

    and extract rolling 5-minute statistical window metrics (mean, std, peak-to-peak, crest factor).
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Telemetry file must be a CSV (.csv) file.",
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty.",
            )

        response, _ = telemetry_service.process_csv_upload(content)
        return response
    except HTTPException:
        raise
    except TelemetryProcessingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during telemetry ingestion: {str(e)}",
        )


@router.post(
    "/upload-and-analyze",
    response_model=AnomalyDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload telemetry CSV and immediately run ML anomaly detection",
)
async def upload_and_analyze_csv(file: UploadFile = File(...)) -> AnomalyDetectionResponse:
    """Upload industrial CSV, extract rolling features, run Isolation Forest,

    classify ISO 10816 zones, and compute the Equipment Health Index (EHI).
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a .csv file.",
        )

    try:
        content = await file.read()
        _, features_df = telemetry_service.process_csv_upload(content)
        analysis_result = ml_engine.detect_anomalies(features_df)
        return analysis_result
    except HTTPException:
        raise
    except TelemetryProcessingError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze telemetry: {str(e)}",
        )


@router.get("/current")
async def get_current_telemetry():
    """Live mock stream for dashboard visualization."""
    now = datetime.utcnow().isoformat()
    return [
        {
            "machine_id": "PUMP-01",
            "machine_name": "Centrifugal Slurry Booster Pump P-101",
            "timestamp": now,
            "vibration_rms_mm_s": round(random.uniform(1.2, 3.2), 2),
            "bearing_temp_celsius": round(random.uniform(68.0, 84.5), 1),
            "rpm": 1750.0 + random.uniform(-15.0, 15.0),
            "current_draw_amps": round(random.uniform(115.0, 130.0), 1),
            "acoustic_db": round(random.uniform(72.0, 86.0), 1),
            "iso_10816_zone": "Zone B (Acceptable - Long Term)",
            "status": "NORMAL",
            "alerts": [],
        },
        {
            "machine_id": "CNC-SPINDLE-01",
            "machine_name": "DMG Mori 5-Axis Spindle SP-300",
            "timestamp": now,
            "vibration_rms_mm_s": round(random.uniform(0.6, 2.1), 2),
            "bearing_temp_celsius": round(random.uniform(42.0, 65.0), 1),
            "rpm": 24000.0 + random.uniform(-100.0, 100.0),
            "current_draw_amps": round(random.uniform(12.5, 21.0), 1),
            "coolant_flow_l_min": round(random.uniform(22.0, 35.0), 1),
            "acoustic_db": round(random.uniform(65.0, 78.0), 1),
            "iso_10816_zone": "Zone A (Good - Commissioned)",
            "status": "NORMAL",
            "alerts": [],
        },
    ]
