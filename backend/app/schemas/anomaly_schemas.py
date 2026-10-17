from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class SensorContribution(BaseModel):
    sensor_channel: str
    contribution_score: float = Field(..., description="Normalized contribution to anomaly (0.0 to 1.0)")
    current_value: float
    baseline_mean: float
    z_score: float
    unit: str
    deviation_description: str


class AnomalyPoint(BaseModel):
    timestamp: datetime
    machine_id: str
    is_anomaly: bool
    anomaly_score: float = Field(..., description="Raw Isolation Forest score / distance")
    risk_score: float = Field(..., description="Calibrated risk index (0.0 to 100.0)")
    iso_10816_zone: str = Field(..., description="Zone A (Good), Zone B (Acceptable), Zone C (Alert), Zone D (Trip)")
    thermal_status: str = Field(..., description="Nominal, Warning (>80C), Critical (>95C)")
    primary_contributor: Optional[str] = None
    affected_metrics: List[str] = Field(default_factory=list)


class AnomalyDetectionResponse(BaseModel):
    machine_id: str
    analysis_timestamp: datetime = Field(default_factory=datetime.utcnow)
    overall_state: str = Field(..., description="Nominal, Degraded, or Critical")
    equipment_health_index: float = Field(..., ge=0.0, le=100.0, description="Overall health score (0-100%)")
    iso_10816_zone: str
    total_data_points: int
    anomalous_data_points: int
    anomaly_percentage: float
    affected_sensor_channels: List[str]
    sensor_contribution_rankings: List[SensorContribution]
    feature_deviations: Dict[str, Dict[str, float]]
    anomaly_timeline: List[AnomalyPoint]
    executive_summary: str
    diagnosed_component: Optional[str] = Field(default=None, description="Pinpointed failing sub-component")
    failure_mechanism: Optional[str] = Field(default=None, description="Underlying physical failure mode")
    recommended_action: Optional[str] = Field(default=None, description="Immediate corrective action recommended")
