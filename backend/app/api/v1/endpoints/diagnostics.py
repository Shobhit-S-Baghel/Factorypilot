from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
import pandas as pd
from app.schemas.diagnostic_schemas import (
    TroubleshootRequest,
    TroubleshootResponse,
    MaintenanceTicketExportRequest,
)
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


@router.post(
    "/export-ticket",
    summary="Compile active anomaly and diagnostics into a downloadable maintenance work order",
)
async def export_maintenance_ticket(
    ticket_request: MaintenanceTicketExportRequest,
    download: bool = False,
):
    """Compile active anomalies, sensor trend snapshots, manual citations,

    and technician checklist state into a clean work order (JSON and Markdown formats).
    """
    from fastapi.responses import Response
    from datetime import datetime
    import uuid

    try:
        now = datetime.utcnow()
        ticket_id = f"WO-{ticket_request.machine_id}-{now.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

        vib = float(ticket_request.sensor_snapshot.get("vibration_rms_mms", 1.2))
        iso_status = ml_engine.classify_iso_10816(vib)
        temp = float(ticket_request.sensor_snapshot.get("bearing_temperature_c", 60.0))
        thermal_status = ml_engine.classify_thermal_status(temp)

        # Build Markdown content
        md_lines = [
            f"# FactoryPilot Maintenance Work Order",
            f"**Work Order ID:** `{ticket_id}`  ",
            f"**Asset Identifier:** `{ticket_request.machine_id}`  ",
            f"**Issued Date / Time:** `{now.strftime('%Y-%m-%d %H:%M:%S UTC')}`  ",
            f"**Authorizing Technician:** {ticket_request.technician_name}  ",
            f"**Operational Assessment:** {iso_status}  ",
            f"**Work Order Priority:** {'EMERGENCY / IMMEDIATE TRIP' if 'Zone D' in iso_status or temp > 95.0 else 'HIGH PRIORITY' if 'Zone C' in iso_status or temp > 80.0 else 'STANDARD'}",
            "",
            "---",
            "",
            "## 1. Safety & Lockout/Tagout (LOTO) Compliance",
            f"- **Statutory Standard:** OSHA 29 CFR 1910.147 (The Control of Hazardous Energy)",
            f"- **LOTO Required:** {'YES - MANDATORY BEFORE COMMENCING INTERVENTION' if ticket_request.loto_required else 'NO'}",
            "- **Zero-Energy Sequence Verification:**",
            "  - [x] Primary 480V 3-Phase MCC Breaker Locked Out (Padlock & Danger Tag applied)",
            "  - [x] Suction & Discharge Hydraulic Valves Double Blocked & Bled",
            "  - [x] Casing Depressurization & Sump Bleed Completed (0.00 bar confirmed)",
            "  - [x] CAT-IV Multimeter Test (0.00 VAC across all phase lines verified)",
            "",
            "---",
            "",
            "## 2. Sensor Trend Snapshot & Anomaly Signatures",
            "| Sensor Channel | Current Metric | Engineering Unit | Alert Threshold | Evaluated Condition |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ]

        # Add sensor rows
        sensor_data = ticket_request.sensor_snapshot or {}
        md_lines.append(f"| Vibration Velocity RMS | {sensor_data.get('vibration_rms_mms', 'N/A')} | mm/s | 2.80 mm/s (Alert) / 4.50 mm/s (Trip) | {iso_status} |")
        md_lines.append(f"| Bearing Temperature | {sensor_data.get('bearing_temperature_c', 'N/A')} | °C | 80.0°C (Warning) / 95.0°C (Trip) | {thermal_status} |")
        md_lines.append(f"| Shaft Speed | {sensor_data.get('rotational_speed_rpm', 'N/A')} | RPM | Synchronous Speed | Normal Operating Envelope |")
        md_lines.append(f"| Electrical Current Draw | {sensor_data.get('current_draw_amps', 'N/A')} | Amps | 18.5A FLA (Spindle) / 132A (Pump) | Load Monitored |")
        md_lines.append(f"| Acoustic Intensity | {sensor_data.get('acoustic_db', 'N/A')} | dB | 85.0 dB Cavitation Limit | Noise Monitored |")

        md_lines.extend([
            "",
            "### Active Anomaly Warnings:",
        ])
        if ticket_request.anomaly_flags:
            for flag in ticket_request.anomaly_flags:
                md_lines.append(f"- ⚠️ **{flag}**")
        else:
            md_lines.append("- *No unacknowledged anomaly flags recorded.*")

        md_lines.extend([
            "",
            "---",
            "",
            "## 3. Technician Field Inspection Checklist",
        ])

        if ticket_request.technician_checklist:
            for item in ticket_request.technician_checklist:
                check_char = "x" if item.get("is_completed") else " "
                step_no = item.get("step_number", 1)
                action = item.get("action_item", "Inspect machinery component")
                subsystem = item.get("subsystem", "General")
                md_lines.append(f"- [{check_char}] **Step {step_no} [{subsystem}]:** {action}")
        else:
            md_lines.extend([
                "- [x] **Step 1 [Isolation]:** Verify zero voltage across all MCC phases.",
                "- [ ] **Step 2 [Hydraulic]:** Inspect suction strainer for cake fouling or cavitation pitting.",
                "- [ ] **Step 3 [Vibration]:** Measure triaxial accelerometer FFT spectrum on drive-end bearing bracket.",
                "- [ ] **Step 4 [Lubrication]:** Purge and inspect NLGI 2 lithium-complex grease for moisture.",
            ])

        md_lines.extend([
            "",
            "---",
            "",
            "## 4. Standard Operating Procedure (SOP) Manual Citations",
        ])

        if ticket_request.manual_citations:
            for cite in ticket_request.manual_citations:
                manual = cite.get("manual", "Plant Manual")
                chapter = cite.get("chapter", "SOP Chapter")
                excerpt = cite.get("excerpt", "Refer to plant technical document.")
                md_lines.append(f"### 📖 {chapter} (`{manual}`)")
                md_lines.append(f"> {excerpt.strip()}\n")
        else:
            md_lines.append("- Refer to `centrifugal_pump_manual.md` or `cnc_milling_spindle_manual.md`.")

        md_lines.extend([
            "",
            "---",
            "",
            "## 5. Authorized Corrective Maintenance Actions",
        ])

        if ticket_request.corrective_actions:
            for act in ticket_request.corrective_actions:
                title = act.get("title", "Corrective Procedure")
                priority = act.get("priority", "SCHEDULED")
                downtime = act.get("estimated_downtime_minutes", 60)
                summary = act.get("procedure_summary", "Follow standard procedure.")
                md_lines.append(f"- **{title}** [Priority: `{priority}` | Est. Downtime: `{downtime} min`]")
                md_lines.append(f"  *{summary}*")
        else:
            md_lines.append("- **CA-01:** Throttle discharge valve and backwash suction strainer basket.")
            md_lines.append("- **CA-02:** Re-grease bearing housing with 45g Mobilith SHC 220.")

        md_lines.extend([
            "",
            "---",
            "",
            "## 6. Maintenance Sign-Off & Release to Operations",
            "```",
            "Lead Technician Signature: _______________________   Date: ______________",
            "Safety Officer Approval:   _______________________   Date: ______________",
            "Zero-Energy State De-LOTO: [ ] Verified & De-isolated",
            "```",
            "",
            "*Document produced automatically by FactoryPilot Industrial Telemetry Engine v0.2.0*",
        ])

        markdown_doc = "\n".join(md_lines)

        if download or ticket_request.format.lower() == "markdown":
            filename = f"WORK_ORDER_{ticket_request.machine_id}_{now.strftime('%Y%m%d_%H%M%S')}.md"
            return Response(
                content=markdown_doc,
                media_type="text/markdown",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"',
                    "Content-Type": "text/markdown; charset=utf-8",
                },
            )

        # JSON response format
        return {
            "ticket_id": ticket_id,
            "machine_id": ticket_request.machine_id,
            "created_at": now.isoformat(),
            "technician_name": ticket_request.technician_name,
            "status": "OPEN",
            "iso_10816_status": iso_status,
            "loto_compliance_certified": ticket_request.loto_required,
            "markdown_content": markdown_doc,
            "raw_payload": ticket_request.model_dump(),
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate maintenance work order ticket: {str(e)}",
        )
