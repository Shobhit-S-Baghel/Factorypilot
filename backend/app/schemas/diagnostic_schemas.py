from typing import List, Dict, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field


class TroubleshootRequest(BaseModel):
    machine_id: str = Field(..., description="Machine asset tag, e.g. PUMP-01 or CNC-SPINDLE-01")
    technician_query: str = Field(..., description="Technician diagnostic question or symptom observed")
    anomaly_summary: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional recent anomaly detection payload to contextualize root-cause analysis",
    )
    urgency_level: Optional[str] = Field(default="AUTO", description="LOW, MEDIUM, HIGH, CRITICAL, or AUTO")


class RootCauseRanking(BaseModel):
    cause: str
    probability_percentage: float = Field(..., ge=0.0, le=100.0)
    severity_level: str = Field(..., description="LOW, MODERATE, HIGH, CATASTROPHIC")
    technical_rationale: str
    contributing_sensor_signatures: List[str] = Field(default_factory=list)


class FieldInspectionStep(BaseModel):
    step_number: int
    action_item: str
    subsystem: str
    inspection_method: str
    manual_citation_chapter: str
    safety_precaution: Optional[str] = None
    pass_criteria: str


class CorrectiveAction(BaseModel):
    action_id: str
    title: str
    priority: str = Field(..., description="IMMEDIATE, SCHEDULED, PREVENTATIVE")
    estimated_downtime_minutes: int
    parts_required: List[str] = Field(default_factory=list)
    procedure_summary: str
    manual_reference: str


class TroubleshootResponse(BaseModel):
    machine_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    safety_and_loto_advisory: str
    loto_mandatory: bool
    osha_standard_reference: str = "OSHA 29 CFR 1910.147 (The Control of Hazardous Energy)"
    root_cause_probability_ranking: List[RootCauseRanking]
    sequential_field_inspection_steps: List[FieldInspectionStep]
    recommended_corrective_actions: List[CorrectiveAction]
    retrieved_manual_citations: List[Dict[str, Any]]
    confidence_score: float = Field(..., ge=0.0, le=1.0)
