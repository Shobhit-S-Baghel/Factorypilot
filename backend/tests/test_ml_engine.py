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
