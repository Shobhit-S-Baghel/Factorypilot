from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status
import pandas as pd
from app.schemas.diagnostic_schemas import TroubleshootRequest, TroubleshootResponse
from app.schemas.anomaly_schemas import AnomalyDetectionResponse
from app.services.rag_service import rag_service
from app.services.ml_engine import ml_engine

router = APIRouter()


@router.post(
    "/troubleshoot",
    response_model=TroubleshootResponse,
    status_code=status.HTTP_200_OK,
    summary="Troubleshoot machine anomaly against technical plant manuals",
)
async def troubleshoot_machine(request: TroubleshootRequest) -> TroubleshootResponse:
    """Analyze machine anomaly and technician query using vector RAG against plant manuals.

    Returns mandatory safety & LOTO protocols, root-cause probability rankings,
    sequential field inspection steps with chapter citations, and corrective actions.
    """
    try:
        response = rag_service.troubleshoot(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diagnostics engine failure during manual RAG analysis: {str(e)}",
        )


@router.post(
    "/analyze-anomalies",
    response_model=AnomalyDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Direct JSON anomaly detection and Equipment Health Index scoring",
)
async def analyze_anomalies_json(records: List[Dict[str, Any]]) -> AnomalyDetectionResponse:
    """Accept an array of raw sensor readings, run Isolation Forest, and compute

    Equipment Health Index (EHI), ISO 10816 zones, and sensor contribution rankings.
    """
    if not records or len(records) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 3 telemetry records are required for statistical anomaly evaluation.",
        )

    try:
        df = pd.DataFrame(records)
        if "parsed_timestamp" not in df.columns:
            if "timestamp" in df.columns:
                df["parsed_timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
            else:
                df["parsed_timestamp"] = pd.date_range(end=pd.Timestamp.utcnow(), periods=len(df), freq="10s")

        analysis = ml_engine.detect_anomalies(df)
        return analysis
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating sensor anomalies: {str(e)}",
        )
