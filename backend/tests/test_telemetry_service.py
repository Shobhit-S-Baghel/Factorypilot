import pytest
import io
import pandas as pd
from httpx import AsyncClient
from app.services.telemetry_service import telemetry_service, TelemetryProcessingError


@pytest.mark.asyncio
async def test_csv_upload_success(client: AsyncClient, nominal_telemetry_csv: bytes):
    files = {"file": ("nominal_test.csv", nominal_telemetry_csv, "text/csv")}
    response = await client.post("/api/v1/telemetry/upload", files=files)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "success"
    assert data["machine_id"] == "PUMP-01"
    assert data["total_records_ingested"] == 20
    assert "vibration_rms_mms" in data["feature_summary"]
    stats = data["feature_summary"]["vibration_rms_mms"]
    assert "mean" in stats
    assert "peak_to_peak" in stats
    assert "crest_factor" in stats
    assert len(data["preview_records"]) > 0


@pytest.mark.asyncio
async def test_csv_upload_missing_channels(client: AsyncClient):
    # CSV missing acoustic_db and current_draw_amps
    df = pd.DataFrame({
        "timestamp": ["2026-10-18 00:00:00", "2026-10-18 00:00:15"],
        "machine_id": ["PUMP-01", "PUMP-01"],
        "rotational_speed_rpm": [1750, 1750],
        "vibration_rms_mms": [1.1, 1.2],
        "bearing_temperature_c": [60.0, 61.0],
    })
    buf = io.BytesIO()
    df.to_csv(buf, index=False)

    files = {"file": ("missing_channels.csv", buf.getvalue(), "text/csv")}
    response = await client.post("/api/v1/telemetry/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "Missing required sensor channels" in data["detail"]


@pytest.mark.asyncio
async def test_csv_upload_empty_file(client: AsyncClient):
    files = {"file": ("empty.csv", b"", "text/csv")}
    response = await client.post("/api/v1/telemetry/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "empty" in data["detail"].lower()


@pytest.mark.asyncio
async def test_csv_upload_invalid_extension(client: AsyncClient):
    files = {"file": ("test.txt", b"some text", "text/plain")}
    response = await client.post("/api/v1/telemetry/upload", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "CSV" in data["detail"]


def test_missing_values_and_unmonotonic_timestamps():
    # Out of order timestamps with missing values
    df_raw = pd.DataFrame({
        "timestamp": ["2026-10-18 00:01:00", "2026-10-18 00:00:00", "2026-10-18 00:00:30"],
        "machine_id": ["CNC-01", "CNC-01", "CNC-01"],
        "rotational_speed_rpm": [24000.0, None, 24000.0],
        "vibration_rms_mms": [1.2, 1.1, None],
        "bearing_temperature_c": [50.0, 48.0, 49.0],
        "current_draw_amps": [14.0, 14.2, 14.1],
        "acoustic_db": [70.0, 70.5, 70.2],
    })
    buf = io.BytesIO()
    df_raw.to_csv(buf, index=False)

    df_clean = telemetry_service.parse_and_validate_csv(buf.getvalue())
    assert df_clean["parsed_timestamp"].is_monotonic_increasing
    assert len(df_clean) == 3
    # Check that missing values were imputed
    assert not df_clean["rotational_speed_rpm"].isna().any()
    assert not df_clean["vibration_rms_mms"].isna().any()
