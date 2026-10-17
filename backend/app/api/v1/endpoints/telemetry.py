from typing import List
from datetime import datetime
import random
from fastapi import APIRouter
from app.models.schemas import TelemetryReading, MachineStatusSummary

router = APIRouter()


def compute_iso_10816_zone(vibration_rms: float) -> str:
    """ISO 10816-3 Class II / III vibration evaluation criteria."""
    if vibration_rms < 1.4:
        return "Zone A (Good - New/Commissioned)"
    elif vibration_rms < 2.8:
        return "Zone B (Acceptable - Long Term)"
    elif vibration_rms < 4.5:
        return "Zone C (Warning - Restricted Operation)"
    else:
        return "Zone D (Critical - Damage Imminent)"


@router.get("/current", response_model=List[TelemetryReading])
async def get_current_telemetry() -> List[TelemetryReading]:
    now = datetime.utcnow()

    # Asset 1: Centrifugal Slurry Pump (PUMP-01)
    pump_vib = round(random.uniform(1.2, 3.2), 2)
    pump_temp = round(random.uniform(68.0, 84.5), 1)
    pump_zone = compute_iso_10816_zone(pump_vib)
    pump_alerts = []
    pump_status = "NORMAL"

    if pump_temp > 80.0:
        pump_alerts.append(f"Bearing Thermal Threshold Exceeded: {pump_temp}°C (>80°C warning)")
        pump_status = "WARNING"
    if "Zone C" in pump_zone or "Zone D" in pump_zone:
        pump_alerts.append(f"Vibration Alert: {pump_vib} mm/s RMS [{pump_zone}]")
        pump_status = "WARNING" if pump_status != "CRITICAL" else "CRITICAL"
    if pump_temp > 95.0 or "Zone D" in pump_zone:
        pump_status = "CRITICAL"

    pump_reading = TelemetryReading(
        machine_id="PUMP-01",
        machine_name="Centrifugal Slurry Booster Pump P-101",
        timestamp=now,
        vibration_rms_mm_s=pump_vib,
        bearing_temp_celsius=pump_temp,
        rpm=1750.0 + random.uniform(-15.0, 15.0),
        iso_10816_zone=pump_zone,
        status=pump_status,
        alerts=pump_alerts,
    )

    # Asset 2: High-Speed 5-Axis CNC Milling Spindle (CNC-SPINDLE-01)
    spindle_vib = round(random.uniform(0.6, 2.1), 2)
    spindle_temp = round(random.uniform(42.0, 65.0), 1)
    spindle_current = round(random.uniform(12.5, 21.0), 1)
    spindle_coolant = round(random.uniform(22.0, 35.0), 1)
    spindle_zone = compute_iso_10816_zone(spindle_vib)
    spindle_alerts = []
    spindle_status = "NORMAL"

    if spindle_current > 18.5:
        spindle_alerts.append(f"Electrical Current Spike: {spindle_current}A (>18.5A FLA limit)")
        spindle_status = "WARNING"
    if spindle_coolant < 20.0:
        spindle_alerts.append(f"Low Thru-Spindle Coolant Flow: {spindle_coolant} L/min (<20.0 L/min)")
        spindle_status = "WARNING"

    spindle_reading = TelemetryReading(
        machine_id="CNC-SPINDLE-01",
        machine_name="DMG Mori 5-Axis Spindle SP-300",
        timestamp=now,
        vibration_rms_mm_s=spindle_vib,
        bearing_temp_celsius=spindle_temp,
        rpm=24000.0 + random.uniform(-100.0, 100.0),
        current_draw_amps=spindle_current,
        coolant_flow_l_min=spindle_coolant,
        iso_10816_zone=spindle_zone,
        status=spindle_status,
        alerts=spindle_alerts,
    )

    return [pump_reading, spindle_reading]


@router.get("/machinery", response_model=List[MachineStatusSummary])
async def get_machinery_overview() -> List[MachineStatusSummary]:
    telemetries = await get_current_telemetry()
    return [
        MachineStatusSummary(
            machine_id="PUMP-01",
            name="Centrifugal Slurry Booster Pump P-101",
            category="Hydraulic Transfer & Pumping",
            location="Building B - Slurry Bay 3",
            operational_status="ONLINE",
            last_reading=telemetries[0],
            loto_engaged=False,
        ),
        MachineStatusSummary(
            machine_id="CNC-SPINDLE-01",
            name="DMG Mori 5-Axis Spindle SP-300",
            category="Precision Machining",
            location="Building A - CNC Cell 12",
            operational_status="ONLINE",
            last_reading=telemetries[1],
            loto_engaged=False,
        ),
    ]
