import pytest
import pandas as pd
from app.services.ml_engine import ml_engine
from app.services.telemetry_service import telemetry_service


def test_nominal_edge_case_inference(nominal_telemetry_csv: bytes):
    df = telemetry_service.parse_and_validate_csv(nominal_telemetry_csv)
    features_df = telemetry_service.extract_rolling_5min_features(df)
    result = ml_engine.detect_anomalies(features_df)

    assert result.machine_id == "PUMP-01"
    assert result.overall_state in ["Nominal", "Degraded"]
    assert result.equipment_health_index >= 75.0
    assert "Zone A" in result.iso_10816_zone or "Zone B" in result.iso_10816_zone
    assert len(result.sensor_contribution_rankings) > 0


def test_severe_vibration_and_thermal_excursion(anomalous_telemetry_csv: bytes):
    df = telemetry_service.parse_and_validate_csv(anomalous_telemetry_csv)
    features_df = telemetry_service.extract_rolling_5min_features(df)
    result = ml_engine.detect_anomalies(features_df)

    assert result.overall_state == "Critical"
    assert result.equipment_health_index < 60.0
    assert "Zone D" in result.iso_10816_zone or "Zone C" in result.iso_10816_zone
    assert result.anomalous_data_points > 0
    assert len(result.affected_sensor_channels) >= 1
    # Check that vibration or bearing temperature is top contributor
    top_contributor = result.sensor_contribution_rankings[0].sensor_channel
    assert top_contributor in ["vibration_rms_mms", "bearing_temperature_c"]


def test_iso_10816_zoning_boundaries():
    assert "Zone A" in ml_engine.classify_iso_10816(0.85)
    assert "Zone B" in ml_engine.classify_iso_10816(2.10)
    assert "Zone C" in ml_engine.classify_iso_10816(3.40)
    assert "Zone D" in ml_engine.classify_iso_10816(5.80)


def test_thermal_status_boundaries():
    assert "Nominal" in ml_engine.classify_thermal_status(65.0)
    assert "Warning" in ml_engine.classify_thermal_status(82.0)
    assert "Critical" in ml_engine.classify_thermal_status(96.5)


def test_deterministic_subcomponent_fault_mappings():
    # 1. High Vibration RMS + Acoustic Emission surge -> Impeller Blade Assembly (Vapor Cavitation Erosion)
    res_cav = ml_engine.pinpoint_subcomponent(
        machine_id="PUMP-01",
        vibration_rms=4.2,
        acoustic_db=86.5,
    )
    assert res_cav["diagnosed_component"] == "Impeller Blade Assembly"
    assert res_cav["failure_mode"] == "Vapor Cavitation Erosion"

    # 2. High Bearing Temp + High Vibration -> Deep Groove Ball Bearing 6205 (Lubricant Starvation & Raceway Fatigue)
    res_bearing = ml_engine.pinpoint_subcomponent(
        machine_id="PUMP-01",
        bearing_temp=84.0,
        vibration_rms=3.8,
    )
    assert res_bearing["diagnosed_component"] == "Deep Groove Ball Bearing 6205"
    assert res_bearing["failure_mode"] == "Lubricant Starvation & Raceway Fatigue"

    # 3. High Current Draw + Thermal Elevation without vibration -> Stator Winding Assembly (Electrical Phase Overload)
    res_stator = ml_engine.pinpoint_subcomponent(
        machine_id="PUMP-01",
        current_amps=135.0,
        bearing_temp=82.0,
        vibration_rms=1.2,
    )
    assert res_stator["diagnosed_component"] == "Stator Winding Assembly"
    assert res_stator["failure_mode"] == "Electrical Phase Overload"

    # 4. High Vibration + RPM deviations -> High-Speed Spindle Shaft (Dynamic Unbalance & Misalignment)
    res_spindle = ml_engine.pinpoint_subcomponent(
        machine_id="CNC-SPINDLE-01",
        vibration_rms=3.5,
        rpm=18000,
        rpm_deviation=120.0,
    )
    assert res_spindle["diagnosed_component"] == "High-Speed Spindle Shaft"
    assert res_spindle["failure_mode"] == "Dynamic Unbalance & Misalignment"
