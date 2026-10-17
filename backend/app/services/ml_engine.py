import logging
from typing import List, Dict, Tuple, Any, Optional
from datetime import datetime
import numpy as np
import pandas as pd

from app.schemas.anomaly_schemas import (
    SensorContribution,
    AnomalyPoint,
    AnomalyDetectionResponse,
)

logger = logging.getLogger(__name__)

# Standard Industrial Engineering Limits (ISO 10816-3 & Machinery SOPs)
ISO_LIMITS = {
    "ZONE_A_MAX": 1.4,   # Good (Newly commissioned)
    "ZONE_B_MAX": 2.8,   # Acceptable (Continuous unrestricted)
    "ZONE_C_MAX": 4.5,   # Alert / Restricted duty
    "ZONE_D_TRIP": 4.5,  # Critical / Catastrophic trip
}

THERMAL_LIMITS = {
    "WARNING_C": 80.0,   # Bearing re-greasing / thermal warning threshold
    "CRITICAL_C": 95.0,  # Bearing emergency trip / film breakdown
}

CURRENT_FLA_LIMIT = 18.5 # Full Load Amps for HSK-A63 spindle
ACOUSTIC_ALARM_DB = 85.0 # Cavitation / high frequency threshold


class MachineLearningEngine:
    """Unsupervised anomaly detection, ISO 10816 vibration zoning, and Equipment Health Index (EHI) scoring."""

    def __init__(self, contamination: float = 0.08, random_state: int = 42):
        self.contamination = contamination
        self.random_state = random_state

    def classify_iso_10816(self, vibration_rms: float) -> str:
        """Classify overall vibration velocity according to ISO 10816-3."""
        if vibration_rms < ISO_LIMITS["ZONE_A_MAX"]:
            return "Zone A (Good - Newly Commissioned)"
        elif vibration_rms < ISO_LIMITS["ZONE_B_MAX"]:
            return "Zone B (Acceptable - Long Term Operation)"
        elif vibration_rms < ISO_LIMITS["ZONE_C_MAX"]:
            return "Zone C (Warning - Restricted Operation)"
        else:
            return "Zone D (Critical - Immediate Trip Required)"

    def classify_thermal_status(self, temp_c: float) -> str:
        """Evaluate bearing housing thermal state."""
        if temp_c > THERMAL_LIMITS["CRITICAL_C"]:
            return "Critical (>95°C Emergency Trip)"
        elif temp_c > THERMAL_LIMITS["WARNING_C"]:
            return "Warning (>80°C Thermal Threshold)"
        return "Nominal (<80°C)"

    def compute_sensor_contributions(
        self,
        df: pd.DataFrame,
        feature_cols: List[str],
        anomalous_indices: np.ndarray,
    ) -> Tuple[List[SensorContribution], Dict[str, Dict[str, float]], List[str]]:
        """Compute Z-score deviations and relative contribution of each sensor channel to anomalies."""
        channel_units = {
            "vibration_rms_mms": "mm/s",
            "bearing_temperature_c": "°C",
            "rotational_speed_rpm": "RPM",
            "current_draw_amps": "Amps",
            "acoustic_db": "dB",
        }

        contributions: List[SensorContribution] = []
        deviations: Dict[str, Dict[str, float]] = {}
        affected_channels_set = set()

        total_anomalies = len(anomalous_indices) if len(anomalous_indices) > 0 else 1
        anomaly_df = df.iloc[anomalous_indices] if len(anomalous_indices) > 0 else df

        for col in feature_cols:
            base_col = col.split("_rolling_")[0].split("_peak_")[0].split("_crest_")[0]
            clean_name = base_col

            series = df[col].to_numpy()
            mean_val = float(np.mean(series))
            std_val = float(np.std(series))
            std_val = std_val if std_val > 1e-4 else 1.0

            # Compute Z-score on anomalous records vs full baseline
            anom_series = anomaly_df[col].to_numpy()
            anom_mean = float(np.mean(anom_series))
            z_score = float((anom_mean - mean_val) / std_val)

            deviations[col] = {
                "baseline_mean": round(mean_val, 3),
                "anomaly_mean": round(anom_mean, 3),
                "z_score": round(z_score, 3),
                "std": round(std_val, 3),
            }

            # Contribution magnitude proportional to |Z-score| plus physical violation
            physical_multiplier = 1.0
            if clean_name == "vibration_rms_mms" and anom_mean > ISO_LIMITS["ZONE_B_MAX"]:
                physical_multiplier = 2.2
            elif clean_name == "bearing_temperature_c" and anom_mean > THERMAL_LIMITS["WARNING_C"]:
                physical_multiplier = 2.0
            elif clean_name == "current_draw_amps" and anom_mean > CURRENT_FLA_LIMIT:
                physical_multiplier = 1.8
            elif clean_name == "acoustic_db" and anom_mean > ACOUSTIC_ALARM_DB:
                physical_multiplier = 1.7

            raw_score = abs(z_score) * physical_multiplier
            if abs(z_score) > 1.5 or physical_multiplier > 1.0:
                affected_channels_set.add(clean_name)

            unit = channel_units.get(clean_name, "units")
            desc = (
                f"Elevated by {z_score:+.2f}σ from baseline (mean: {anom_mean:.2f} {unit} vs norm: {mean_val:.2f} {unit})"
                if z_score >= 0
                else f"Depressed by {z_score:.2f}σ below baseline"
            )

            contributions.append(
                SensorContribution(
                    sensor_channel=clean_name,
                    contribution_score=round(raw_score, 3),
                    current_value=round(anom_mean, 2),
                    baseline_mean=round(mean_val, 2),
                    z_score=round(z_score, 2),
                    unit=unit,
                    deviation_description=desc,
                )
            )

        # Normalize contribution scores so top contributor is clear
        total_score = sum(c.contribution_score for c in contributions)
        if total_score > 0:
            for c in contributions:
                c.contribution_score = round(c.contribution_score / total_score, 3)

        # Deduplicate and sort descending by contribution
        unique_contributions: Dict[str, SensorContribution] = {}
        for c in contributions:
            if c.sensor_channel not in unique_contributions or c.contribution_score > unique_contributions[c.sensor_channel].contribution_score:
                unique_contributions[c.sensor_channel] = c

        ranked_contributions = sorted(unique_contributions.values(), key=lambda x: x.contribution_score, reverse=True)
        return ranked_contributions, deviations, sorted(list(affected_channels_set))

    def detect_anomalies(self, df: pd.DataFrame) -> AnomalyDetectionResponse:
        """Run Isolation Forest combined with ISO 10816 Z-score thresholding and Equipment Health Index scoring."""
        machine_id = str(df["machine_id"].iloc[0])
        n_samples = len(df)

        # Select numerical modeling features
        candidate_cols = [
            "vibration_rms_mms",
            "bearing_temperature_c",
            "rotational_speed_rpm",
            "current_draw_amps",
            "acoustic_db",
        ]
        # Include rolling statistical features if present
        rolling_cols = [col for col in df.columns if "_rolling_mean" in col or "_peak_to_peak" in col or "_crest_factor" in col]
        feature_cols = candidate_cols + rolling_cols
        available_features = [col for col in feature_cols if col in df.columns]

        X = df[available_features].fillna(0.0).to_numpy()

        # Fit Isolation Forest
        try:
            from sklearn.ensemble import IsolationForest
            iso_forest = IsolationForest(
                n_estimators=100,
                contamination=self.contamination,
                random_state=self.random_state,
                n_jobs=-1,
            )
            predictions = iso_forest.fit_predict(X)
            # IsolationForest returns -1 for anomaly, 1 for inlier
            is_anomaly_mask = predictions == -1
            decision_scores = iso_forest.decision_function(X)
            # Invert and normalize decision score so higher = more anomalous
            min_score, max_score = decision_scores.min(), decision_scores.max()
            score_range = max_score - min_score if (max_score - min_score) > 1e-6 else 1.0
            normalized_scores = 1.0 - ((decision_scores - min_score) / score_range)
        except Exception as e:
            logger.warning(f"IsolationForest execution fallback to statistical Z-score detector: {e}")
            # Fallback statistical Mahalanobis / Z-score detector
            means = np.mean(X, axis=0)
            stds = np.std(X, axis=0)
            stds[stds == 0] = 1.0
            z_matrix = np.abs((X - means) / stds)
            max_z = np.max(z_matrix, axis=1)
            is_anomaly_mask = max_z > 2.5
            normalized_scores = np.clip(max_z / 4.0, 0.0, 1.0)

        # Physical threshold overrides (Hard constraints)
        vib_series = df["vibration_rms_mms"].to_numpy()
        temp_series = df["bearing_temperature_c"].to_numpy()

        # Any reading in ISO Zone C / Zone D or Temp > 80°C is an anomaly by physical law
        physical_anomaly_mask = (vib_series >= ISO_LIMITS["ZONE_C_MAX"]) | (temp_series >= THERMAL_LIMITS["WARNING_C"])
        combined_anomaly_mask = is_anomaly_mask | physical_anomaly_mask

        anomalous_indices = np.where(combined_anomaly_mask)[0]
        anomalous_count = int(np.sum(combined_anomaly_mask))
        anomaly_percentage = round((anomalous_count / max(1, n_samples)) * 100, 2)

        # Sensor contribution analysis
        sensor_rankings, deviations, affected_channels = self.compute_sensor_contributions(
            df, candidate_cols, anomalous_indices
        )

        # Compute ISO 10816 Zone & Thermal Status
        peak_vibration = float(np.max(vib_series))
        iso_zone = self.classify_iso_10816(peak_vibration)
        peak_temp = float(np.max(temp_series))
        thermal_status = self.classify_thermal_status(peak_temp)

        # Compute Equipment Health Index (EHI) (0% - 100%)
        health_index = 100.0
        # Deduct for anomaly frequency
        health_index -= min(40.0, anomaly_percentage * 1.5)

        # Deduct for ISO 10816 Vibration severity
        if "Zone D" in iso_zone:
            health_index -= 50.0
        elif "Zone C" in iso_zone:
            health_index -= 25.0
        elif "Zone B" in iso_zone:
            health_index -= 8.0

        # Deduct for Thermal excursion
        if "Critical" in thermal_status:
            health_index -= 45.0
        elif "Warning" in thermal_status:
            health_index -= 20.0

        health_index = round(float(np.clip(health_index, 0.0, 100.0)), 1)

        # Operational state determination
        if health_index >= 80.0 and "Zone C" not in iso_zone and "Zone D" not in iso_zone:
            overall_state = "Nominal"
        elif health_index >= 50.0 and "Zone D" not in iso_zone and "Critical" not in thermal_status:
            overall_state = "Degraded"
        else:
            overall_state = "Critical"

        # Construct chronological anomaly timeline
        top_channel = sensor_rankings[0].sensor_channel if sensor_rankings else "vibration_rms_mms"
        timeline: List[AnomalyPoint] = []
        for idx in range(min(50, n_samples)):  # return up to 50 key timeline samples
            is_anom = bool(combined_anomaly_mask[idx])
            sample_time = df["parsed_timestamp"].iloc[idx].to_pydatetime()
            sample_vib = float(vib_series[idx])
            sample_temp = float(temp_series[idx])
            sample_risk = round(float(normalized_scores[idx] * 100), 1)

            timeline.append(
                AnomalyPoint(
                    timestamp=sample_time,
                    machine_id=machine_id,
                    is_anomaly=is_anom,
                    anomaly_score=round(float(normalized_scores[idx]), 3),
                    risk_score=sample_risk,
                    iso_10816_zone=self.classify_iso_10816(sample_vib),
                    thermal_status=self.classify_thermal_status(sample_temp),
                    primary_contributor=top_channel if is_anom else None,
                    affected_metrics=affected_channels if is_anom else [],
                )
            )

        # Pinpoint exact failing sub-component based on multi-sensor correlation
        peak_acoustic = float(np.max(df["acoustic_db"].to_numpy())) if "acoustic_db" in df.columns else 0.0
        peak_current = float(np.max(df["current_draw_amps"].to_numpy())) if "current_draw_amps" in df.columns else 0.0
        peak_rpm = float(np.max(df["rotational_speed_rpm"].to_numpy())) if "rotational_speed_rpm" in df.columns else 0.0
        rpm_series = df["rotational_speed_rpm"].to_numpy() if "rotational_speed_rpm" in df.columns else np.array([0.0])
        rpm_dev = float(np.std(rpm_series)) if len(rpm_series) > 1 else 0.0
        peak_crest = float(np.max(df["vibration_rms_mms_crest_factor"].to_numpy())) if "vibration_rms_mms_crest_factor" in df.columns else (peak_vibration / max(0.1, float(np.mean(vib_series))))

        subcomp_info = self.pinpoint_subcomponent(
            machine_id=machine_id,
            vibration_rms=peak_vibration,
            bearing_temp=peak_temp,
            current_amps=peak_current,
            acoustic_db=peak_acoustic,
            crest_factor=peak_crest,
            rpm=peak_rpm,
            rpm_deviation=rpm_dev,
        )

        # Executive summary narrative
        summary = (
            f"Asset {machine_id} operating in {overall_state.upper()} state with an Equipment Health Index of {health_index}%. "
            f"Vibration severity evaluated at {iso_zone} (Peak: {peak_vibration:.2f} mm/s). "
            f"Thermal housing status: {thermal_status} (Peak: {peak_temp:.1f}°C). "
            f"Diagnosed component: '{subcomp_info['diagnosed_component']}' ({subcomp_info['failure_mode']}). "
            f"Detected {anomalous_count} anomalous frames ({anomaly_percentage}% of timeline) "
            f"predominantly driven by '{top_channel}'."
        )

        return AnomalyDetectionResponse(
            machine_id=machine_id,
            analysis_timestamp=datetime.utcnow(),
            overall_state=overall_state,
            equipment_health_index=health_index,
            iso_10816_zone=iso_zone,
            total_data_points=n_samples,
            anomalous_data_points=anomalous_count,
            anomaly_percentage=anomaly_percentage,
            affected_sensor_channels=affected_channels,
            sensor_contribution_rankings=sensor_rankings,
            feature_deviations=deviations,
            anomaly_timeline=timeline,
            executive_summary=summary,
            diagnosed_component=subcomp_info["diagnosed_component"],
            failure_mode=subcomp_info["failure_mode"],
            failure_mechanism=subcomp_info["failure_mechanism"],
            recommended_action=subcomp_info["recommended_action"],
        )

    def pinpoint_subcomponent(
        self,
        machine_id: str = "",
        vibration_rms: float = 0.0,
        bearing_temp: float = 0.0,
        current_amps: float = 0.0,
        acoustic_db: float = 0.0,
        crest_factor: float = 0.0,
        rpm: float = 0.0,
        rpm_deviation: float = 0.0,
        query: str = "",
    ) -> Dict[str, str]:
        """Correlate industrial sensor channel signatures using deterministic mechanical rules

        to pinpoint the exact failing machine sub-component and physical failure mode.
        """
        q_lower = query.lower()
        m_lower = machine_id.lower()

        # Rule 3: High Current Draw + Thermal Elevation without vibration -> Stator Winding Assembly (Electrical Phase Overload)
        has_high_current = current_amps >= 18.0 or "current" in q_lower or "overload" in q_lower or "phase" in q_lower or "stator" in q_lower
        has_thermal_elevation = bearing_temp >= 70.0 or "thermal" in q_lower or "temp" in q_lower or "overheat" in q_lower
        has_low_vibration = vibration_rms < 2.8 and "vibration" not in q_lower and "vib" not in q_lower

        if has_high_current and has_thermal_elevation and has_low_vibration:
            return {
                "diagnosed_component": "Stator Winding Assembly",
                "diagnosed_part": "Stator Winding Assembly",
                "failure_mode": "Electrical Phase Overload",
                "failure_mechanism": "Electrical Phase Overload",
                "recommended_action": "Inspect motor chiller circuit temperature differential (Delta-T <= 3.5°C), measure coil phase resistance, and audit VFD current limits.",
            }

        # Rule 1: High Vibration RMS + Acoustic Emission surge -> Impeller Blade Assembly (Vapor Cavitation Erosion)
        has_high_vibration = vibration_rms >= 2.8 or crest_factor >= 3.0 or "vibration" in q_lower or "vib" in q_lower
        has_acoustic_surge = acoustic_db >= 80.0 or "acoustic" in q_lower or "cavitation" in q_lower or "gravel" in q_lower

        if has_high_vibration and has_acoustic_surge:
            return {
                "diagnosed_component": "Impeller Blade Assembly",
                "diagnosed_part": "Impeller Blade Assembly",
                "failure_mode": "Vapor Cavitation Erosion",
                "failure_mechanism": "Vapor Cavitation Erosion",
                "recommended_action": "Throttle discharge valve, backwash suction basket strainer, and inspect impeller blade assembly for vapor cavitation erosion pitting.",
            }

        # Rule 2: High Bearing Temp + High Vibration -> Deep Groove Ball Bearing 6205 (Lubricant Starvation & Raceway Fatigue)
        has_high_bearing_temp = bearing_temp >= 70.0 or "bearing" in q_lower or "temp" in q_lower or "overheat" in q_lower

        if has_high_bearing_temp and has_high_vibration:
            return {
                "diagnosed_component": "Deep Groove Ball Bearing 6205",
                "diagnosed_part": "Deep Groove Ball Bearing 6205",
                "failure_mode": "Lubricant Starvation & Raceway Fatigue",
                "failure_mechanism": "Lubricant Starvation & Raceway Fatigue",
                "recommended_action": "Isolate MCC 480V breaker, check grease for moisture emulsification, and purge bearing housing with Mobilith SHC 220.",
            }

        # Rule 4: High Vibration + RPM deviations -> High-Speed Spindle Shaft (Dynamic Unbalance & Misalignment)
        has_rpm_deviations = (
            rpm_deviation > 50.0
            or "rpm" in q_lower
            or "speed" in q_lower
            or "deviation" in q_lower
            or "unbalance" in q_lower
            or "misalignment" in q_lower
            or "spindle" in q_lower
            or "chatter" in q_lower
            or "runout" in q_lower
            or (("cnc" in m_lower or "spindle" in m_lower) and rpm >= 1500)
            or rpm >= 1500
        )

        if has_high_vibration and has_rpm_deviations:
            return {
                "diagnosed_component": "High-Speed Spindle Shaft",
                "diagnosed_part": "High-Speed Spindle Shaft",
                "failure_mode": "Dynamic Unbalance & Misalignment",
                "failure_mechanism": "Dynamic Unbalance & Misalignment",
                "recommended_action": "Perform dial test indicator runout test (TIR <= 2 µm at spindle nose), clean taper with precision wiper, and dynamically balance high-speed spindle shaft.",
            }

        # Context-aware deterministic fallback
        if "cnc" in m_lower or "spindle" in m_lower or rpm > 5000:
            return {
                "diagnosed_component": "High-Speed Spindle Shaft",
                "diagnosed_part": "High-Speed Spindle Shaft",
                "failure_mode": "Dynamic Unbalance & Misalignment",
                "failure_mechanism": "Dynamic Unbalance & Misalignment",
                "recommended_action": "Inspect spindle taper runout (<=2 µm) and verify coolant supply pressure (>=20 bar).",
            }

        return {
            "diagnosed_component": "Impeller Blade Assembly",
            "diagnosed_part": "Impeller Blade Assembly",
            "failure_mode": "Vapor Cavitation Erosion",
            "failure_mechanism": "Vapor Cavitation Erosion",
            "recommended_action": "Review suction head pressure, check seal barrier fluid, and monitor vibration trend.",
        }


ml_engine = MachineLearningEngine()
