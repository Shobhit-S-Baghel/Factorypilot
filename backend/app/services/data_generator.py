import math
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import pandas as pd
import numpy as np


class IndustrialScenarioGenerator:
    """Deterministic, physics-grounded telemetry simulation routines for industrial failure modes."""

    SCENARIOS: Dict[str, Dict[str, str]] = {
        "centrifugal_pump_cavitation": {
            "title": "Centrifugal Slurry Pump - Cavitation Breakdown",
            "machine_id": "PUMP-01",
            "description": "Simulates suction head drop causing high-frequency acoustic emission (>85 dB), turbulent vibration RMS (>7.1 mm/s), and current flutter.",
            "primary_failure": "Hydraulic Cavitation / NPSHa Deficit",
        },
        "cnc_spindle_bearing_wear": {
            "title": "CNC Electro-Spindle - Bearing Raceway Fatigue",
            "machine_id": "CNC-SPINDLE-01",
            "description": "Progressive fatigue through ISO 10816 Zone A/B up to Zone D (>11.2 mm/s), thermal runaway (>85°C), and elevated crest factors.",
            "primary_failure": "Mechanical Bearing Fatigue / Spalling",
        },
        "thermal_overload_baseline": {
            "title": "Drive Motor - Stator Winding Thermal Overload",
            "machine_id": "PUMP-01",
            "description": "Stator and bearing thermal runaway from persistent 120% Full Load Amps (FLA) with nominal ISO Zone A vibration.",
            "primary_failure": "Electrical Overcurrent / Thermal Overload",
        },
    }

    def get_available_scenarios(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": k,
                "title": v["title"],
                "machine_id": v["machine_id"],
                "description": v["description"],
                "primary_failure": v["primary_failure"],
            }
            for k, v in self.SCENARIOS.items()
        ]

    def generate_scenario_data(
        self,
        scenario_id: str,
        n_steps: int = 60,
        interval_seconds: int = 5,
        start_time: Optional[datetime] = None,
    ) -> List[Dict[str, Any]]:
        """Generate deterministic, physics-grounded telemetry records."""
        if scenario_id not in self.SCENARIOS:
            # Fallback aliases
            if "cavitation" in scenario_id:
                scenario_id = "centrifugal_pump_cavitation"
            elif "wear" in scenario_id or "bearing" in scenario_id or "spindle" in scenario_id:
                scenario_id = "cnc_spindle_bearing_wear"
            elif "thermal" in scenario_id or "overload" in scenario_id:
                scenario_id = "thermal_overload_baseline"
            else:
                raise ValueError(
                    f"Unknown scenario '{scenario_id}'. Available: {list(self.SCENARIOS.keys())}"
                )

        if start_time is None:
            # Deterministic reference baseline anchor
            start_time = datetime(2026, 10, 18, 14, 0, 0, tzinfo=timezone.utc)

        records: List[Dict[str, Any]] = []

        if scenario_id == "centrifugal_pump_cavitation":
            records = self._generate_pump_cavitation(n_steps, interval_seconds, start_time)
        elif scenario_id == "cnc_spindle_bearing_wear":
            records = self._generate_spindle_bearing_wear(n_steps, interval_seconds, start_time)
        elif scenario_id == "thermal_overload_baseline":
            records = self._generate_thermal_overload(n_steps, interval_seconds, start_time)

        return records

    def _generate_pump_cavitation(
        self, n_steps: int, interval_seconds: int, start_time: datetime
    ) -> List[Dict[str, Any]]:
        records = []
        for i in range(n_steps):
            t = start_time + timedelta(seconds=i * interval_seconds)
            progress = i / max(1, n_steps - 1)

            if progress < 0.35:
                # Normal nominal operation (Zone A)
                vib = 1.15 + 0.08 * math.sin(i * 0.4)
                temp = 58.5 + 0.5 * math.cos(i * 0.3)
                rpm = 1750.0 + 3.0 * math.sin(i * 0.5)
                current = 116.0 + 1.2 * math.cos(i * 0.2)
                acoustic = 70.0 + 1.5 * math.sin(i * 0.8)
                is_anom = False
                risk = 12.0
            elif progress < 0.60:
                # Incipient cavitation: acoustic emission climbs, minor vibration rise
                local_p = (progress - 0.35) / 0.25
                vib = 1.20 + local_p * 2.6 + 0.25 * math.sin(i * 1.2)
                temp = 59.0 + local_p * 11.0 + 0.4 * math.sin(i * 0.4)
                rpm = 1750.0 - local_p * 8.0 + 4.0 * math.cos(i * 0.6)
                current = 116.0 + 3.5 * math.sin(i * 1.5)
                acoustic = 72.0 + local_p * 14.0 + 2.0 * math.sin(i * 1.1)  # Reaching 86 dB
                is_anom = True
                risk = 48.0 + local_p * 25.0
            else:
                # Fully developed severe cavitation (Zone D > 7.1 mm/s, acoustic > 85 dB)
                local_p = (progress - 0.60) / 0.40
                vib = 4.2 + local_p * 4.2 + 0.6 * math.sin(i * 2.5)  # Reaches 8.4 - 9.0 mm/s (>7.1 mm/s)
                temp = 72.0 + local_p * 10.5 + 0.5 * math.sin(i * 0.3)  # Reaches 82.5°C
                rpm = 1740.0 - local_p * 12.0 + 8.0 * math.sin(i * 2.0)
                current = 118.0 + 8.5 * math.sin(i * 3.0)  # Current flutter
                acoustic = 86.5 + local_p * 8.5 + 2.5 * math.sin(i * 1.8)  # Reaches 95 - 97 dB (>85 dB)
                is_anom = True
                risk = 75.0 + local_p * 23.0

            records.append({
                "timestamp": t.isoformat(),
                "machine_id": "PUMP-01",
                "rotational_speed_rpm": round(float(rpm), 1),
                "vibration_rms_mms": round(float(vib), 2),
                "bearing_temperature_c": round(float(temp), 1),
                "current_draw_amps": round(float(current), 1),
                "acoustic_db": round(float(acoustic), 1),
                "is_anomaly": is_anom,
                "risk_score": round(min(100.0, float(risk)), 1),
                "failure_mode": "centrifugal_pump_cavitation",
            })
        return records

    def _generate_spindle_bearing_wear(
        self, n_steps: int, interval_seconds: int, start_time: datetime
    ) -> List[Dict[str, Any]]:
        records = []
        for i in range(n_steps):
            t = start_time + timedelta(seconds=i * interval_seconds)
            progress = i / max(1, n_steps - 1)

            if progress < 0.25:
                # Zone A / B Nominal (<2.0 mm/s)
                vib = 0.85 + progress * 2.0 + 0.05 * math.sin(i * 0.5)
                temp = 45.0 + progress * 15.0
                rpm = 24000.0 - progress * 20.0
                current = 14.2 + progress * 1.0
                acoustic = 66.0 + progress * 2.0
                is_anom = False
                risk = 8.0
            elif progress < 0.50:
                # Progression into Zone C Alert (2.8 - 4.5 mm/s)
                local_p = (progress - 0.25) / 0.25
                vib = 1.4 + local_p * 2.8 + 0.15 * math.sin(i * 0.8)
                temp = 48.0 + local_p * 20.0  # Climbs to 68°C
                rpm = 23980.0 - local_p * 80.0
                current = 14.5 + local_p * 3.0
                acoustic = 68.0 + local_p * 8.0
                is_anom = True
                risk = 35.0 + local_p * 25.0
            elif progress < 0.75:
                # Progression into Zone D (>4.5 mm/s to 9.0 mm/s), Temp > 80°C
                local_p = (progress - 0.50) / 0.25
                vib = 4.2 + local_p * 5.0 + 0.3 * math.sin(i * 1.5)
                temp = 68.0 + local_p * 14.0  # Exceeds 80°C threshold
                rpm = 23900.0 - local_p * 250.0
                current = 17.5 + local_p * 3.5  # Reaching 21A (>18.5 FLA)
                acoustic = 76.0 + local_p * 8.0
                is_anom = True
                risk = 60.0 + local_p * 25.0
            else:
                # Critical cage failure: Vibration > 11.2 mm/s, Temp > 85°C
                local_p = (progress - 0.75) / 0.25
                vib = 9.2 + local_p * 4.2 + 0.6 * math.sin(i * 3.0)  # Exceeds 11.2 mm/s up to 13.5 mm/s
                temp = 82.0 + local_p * 9.5 + 0.4 * math.sin(i * 0.5)  # Reaches 91.5°C (>85°C)
                rpm = 23650.0 - local_p * 400.0
                current = 21.0 + local_p * 4.5  # Reaches 25.5A
                acoustic = 84.0 + local_p * 5.0
                is_anom = True
                risk = 85.0 + local_p * 14.5

            records.append({
                "timestamp": t.isoformat(),
                "machine_id": "CNC-SPINDLE-01",
                "rotational_speed_rpm": round(float(rpm), 1),
                "vibration_rms_mms": round(float(vib), 2),
                "bearing_temperature_c": round(float(temp), 1),
                "current_draw_amps": round(float(current), 1),
                "acoustic_db": round(float(acoustic), 1),
                "is_anomaly": is_anom,
                "risk_score": round(min(100.0, float(risk)), 1),
                "failure_mode": "cnc_spindle_bearing_wear",
            })
        return records

    def _generate_thermal_overload(
        self, n_steps: int, interval_seconds: int, start_time: datetime
    ) -> List[Dict[str, Any]]:
        records = []
        for i in range(n_steps):
            t = start_time + timedelta(seconds=i * interval_seconds)
            progress = i / max(1, n_steps - 1)

            # Vibration remains in nominal Zone A (<1.4 mm/s)
            vib = 1.05 + 0.12 * math.sin(i * 0.3)

            # Persistent 120% Full Load Amps (Normal 116A * 1.20 = 139A - 145A)
            current = 139.2 + 2.0 * math.sin(i * 0.5)
            rpm = 1746.0 + 2.0 * math.cos(i * 0.2)
            acoustic = 71.0 + 1.0 * math.sin(i * 0.4)

            # Exponential thermal rise curve: T(t) = T_0 + deltaT * (1 - exp(-k * t))
            # Starts at 55°C, passes 80°C around 50% progress, reaches 94°C+
            temp = 55.0 + 44.0 * (1.0 - math.exp(-2.2 * progress)) + 0.3 * math.sin(i * 0.6)

            is_anom = temp > 80.0
            risk = 15.0 if temp < 75.0 else 45.0 + ((temp - 75.0) / 25.0) * 50.0

            records.append({
                "timestamp": t.isoformat(),
                "machine_id": "PUMP-01",
                "rotational_speed_rpm": round(float(rpm), 1),
                "vibration_rms_mms": round(float(vib), 2),
                "bearing_temperature_c": round(float(temp), 1),
                "current_draw_amps": round(float(current), 1),
                "acoustic_db": round(float(acoustic), 1),
                "is_anomaly": is_anom,
                "risk_score": round(min(100.0, float(risk)), 1),
                "failure_mode": "thermal_overload_baseline",
            })
        return records

    def generate_scenario_df(
        self, scenario_id: str, n_steps: int = 60, interval_seconds: int = 5
    ) -> pd.DataFrame:
        data = self.generate_scenario_data(scenario_id, n_steps, interval_seconds)
        return pd.DataFrame(data)

    def generate_scenario_csv(
        self, scenario_id: str, n_steps: int = 60, interval_seconds: int = 5
    ) -> str:
        df = self.generate_scenario_df(scenario_id, n_steps, interval_seconds)
        # Drop internal simulation columns for pure sensor channel CSV export
        export_cols = [
            "timestamp",
            "machine_id",
            "rotational_speed_rpm",
            "vibration_rms_mms",
            "bearing_temperature_c",
            "current_draw_amps",
            "acoustic_db",
        ]
        return df[export_cols].to_csv(index=False)


scenario_generator = IndustrialScenarioGenerator()
