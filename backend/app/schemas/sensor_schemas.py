from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class RawSensorRecord(BaseModel):
    timestamp: datetime
    machine_id: str
    rotational_speed_rpm: float = Field(..., description="Rotational speed in RPM")
    vibration_rms_mms: float = Field(..., description="Vibration RMS velocity in mm/s (ISO 10816)")
    bearing_temperature_c: float = Field(..., description="Bearing housing temperature in °C")
    current_draw_amps: float = Field(..., description="Motor phase current in Amperes")
    acoustic_db: float = Field(..., description="Acoustic emission intensity in dB")


class SensorChannelStats(BaseModel):
    mean: float
    std: float
    min: float
    max: float
    peak_to_peak: float
    crest_factor: float


class RollingFeatureSet(BaseModel):
    timestamp: datetime
    machine_id: str
    channels: Dict[str, SensorChannelStats]


class TelemetryUploadResponse(BaseModel):
    status: str = "success"
    message: str
    machine_id: str
    total_records_ingested: int
    time_window_start: datetime
    time_window_end: datetime
    sampling_rate_seconds: Optional[float] = None
    feature_summary: Dict[str, SensorChannelStats]
    preview_records: List[Dict[str, Any]]
