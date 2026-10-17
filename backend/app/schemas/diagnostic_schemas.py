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
    diagnosed_component: str = Field(default="General Mechanical Assembly", description="Exact pinpointed faulty sub-component")
    failure_mechanism: Optional[str] = Field(default=None, description="Primary failure mode")
    recommended_mitigation: Optional[str] = Field(default=None, description="Recommended corrective action")


class MaintenanceTicketExportRequest(BaseModel):
    machine_id: str
    issue_title: str = "Unscheduled Corrective Maintenance"
    technician_name: str = "Field Reliability Technician"
    format: str = Field(default="markdown", description="'markdown' or 'json'")
    anomaly_flags: List[str] = Field(default_factory=list)
    sensor_snapshot: Dict[str, Any] = Field(default_factory=dict)
    technician_checklist: List[Dict[str, Any]] = Field(default_factory=list)
    manual_citations: List[Dict[str, Any]] = Field(default_factory=list)
    corrective_actions: List[Dict[str, Any]] = Field(default_factory=list)
    loto_required: bool = True
    work_order_notes: Optional[str] = None


class MaintenanceTicketResponse(BaseModel):
    ticket_id: str
    machine_id: str
    created_at: datetime
    technician_name: str
    status: str = "OPEN"
    iso_10816_status: str
    loto_compliance_certified: bool
    markdown_content: str
    raw_payload: Dict[str, Any]
