from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str
    environment: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    services: Dict[str, str] = Field(default_factory=dict)


class TelemetryReading(BaseModel):
    machine_id: str
    machine_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    vibration_rms_mm_s: float
    bearing_temp_celsius: float
    rpm: Optional[float] = None
    current_draw_amps: Optional[float] = None
    coolant_flow_l_min: Optional[float] = None
    iso_10816_zone: str = Field(..., description="Zone A (Good), Zone B (Acceptable), Zone C (Warning), Zone D (Critical)")
    status: str = Field(..., description="NORMAL, WARNING, or CRITICAL")
    alerts: List[str] = Field(default_factory=list)


class MachineStatusSummary(BaseModel):
    machine_id: str
    name: str
    category: str
    location: str
    operational_status: str
    last_reading: TelemetryReading
    loto_engaged: bool = False


class ManualQueryRequest(BaseModel):
    query: str
    top_k: int = Field(default=3, ge=1, le=10)
    machine_filter: Optional[str] = None


class ManualSearchResult(BaseModel):
    document_id: str
    source_manual: str
    title: str
    content_snippet: str
    score: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ManualQueryResponse(BaseModel):
    query: str
    results: List[ManualSearchResult]
    total_found: int
