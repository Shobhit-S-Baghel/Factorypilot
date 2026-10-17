import pytest
from httpx import AsyncClient
from app.services.rag_service import rag_service
from app.schemas.diagnostic_schemas import TroubleshootRequest


def test_rag_chunking_and_retrieval():
    chunk_count = rag_service.load_and_chunk_manuals()
    assert chunk_count >= 2

    # Query cavitation
    results = rag_service.retrieve("cavitation warning gravel acoustic noise", top_k=2)
    assert len(results) > 0
    top_chunk, score = results[0]
    assert "pump" in top_chunk.source_manual.lower() or "cavitation" in top_chunk.content.lower()

    # Query spindle runout
    results_spindle = rag_service.retrieve("spindle nose radial runout tolerances", top_k=2)
    assert len(results_spindle) > 0
    top_spindle_chunk, _ = results_spindle[0]
    assert "spindle" in top_spindle_chunk.source_manual.lower() or "runout" in top_spindle_chunk.content.lower()


@pytest.mark.asyncio
async def test_troubleshoot_endpoint_slurry_pump(client: AsyncClient):
    payload = {
        "machine_id": "PUMP-01",
        "technician_query": "Hearing loud gravel pinging noise and bearing temperature is climbing above 82°C.",
        "anomaly_summary": {
            "bearing_temperature_c": 83.5,
            "iso_10816_zone": "Zone C (Warning)",
            "primary_contributor": "bearing_temperature_c",
            "acoustic_db": 84.0,
        },
    }

    response = await client.post("/api/v1/diagnostics/troubleshoot", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["machine_id"] == "PUMP-01"
    assert data["loto_mandatory"] is True
    assert "OSHA" in data["safety_and_loto_advisory"]
    assert len(data["root_cause_probability_ranking"]) >= 2
    assert len(data["sequential_field_inspection_steps"]) >= 3

    # Verify manual citations
    assert len(data["retrieved_manual_citations"]) > 0
    first_citation = data["retrieved_manual_citations"][0]
    assert "manual" in first_citation
    assert "chapter" in first_citation
    assert len(first_citation["excerpt"]) > 0

    # Verify corrective actions
    assert len(data["recommended_corrective_actions"]) >= 1
    assert "procedure_summary" in data["recommended_corrective_actions"][0]


@pytest.mark.asyncio
async def test_troubleshoot_endpoint_cnc_spindle(client: AsyncClient):
    payload = {
        "machine_id": "CNC-SPINDLE-01",
        "technician_query": "Tool chatter on finish passes, current draw spiking to 20A.",
        "anomaly_summary": {
            "current_draw_amps": 20.2,
            "rotational_speed_rpm": 24000,
            "primary_contributor": "current_draw_amps",
        },
    }

    response = await client.post("/api/v1/diagnostics/troubleshoot", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["machine_id"] == "CNC-SPINDLE-01"
    assert len(data["root_cause_probability_ranking"]) > 0
    causes = [c["cause"] for c in data["root_cause_probability_ranking"]]
    assert any("Runout" in c or "Current" in c for c in causes)


@pytest.mark.asyncio
async def test_analyze_anomalies_json_endpoint(client: AsyncClient):
    records = [
        {
            "timestamp": "2026-10-18T00:00:00Z",
            "machine_id": "PUMP-01",
            "rotational_speed_rpm": 1750,
            "vibration_rms_mms": 1.1,
            "bearing_temperature_c": 55.0,
            "current_draw_amps": 115.0,
            "acoustic_db": 70.0,
        },
        {
            "timestamp": "2026-10-18T00:00:15Z",
            "machine_id": "PUMP-01",
            "rotational_speed_rpm": 1750,
            "vibration_rms_mms": 1.2,
            "bearing_temperature_c": 56.0,
            "current_draw_amps": 115.5,
            "acoustic_db": 70.5,
        },
        {
            "timestamp": "2026-10-18T00:00:30Z",
            "machine_id": "PUMP-01",
            "rotational_speed_rpm": 1750,
            "vibration_rms_mms": 5.4,  # Anomaly excursion
            "bearing_temperature_c": 84.0,  # Warning temp
            "current_draw_amps": 118.0,
            "acoustic_db": 86.0,
        },
    ]

    response = await client.post("/api/v1/diagnostics/analyze-anomalies", json=records)
    assert response.status_code == 200
    data = response.json()
    assert data["machine_id"] == "PUMP-01"
    assert data["total_data_points"] == 3
    assert data["anomalous_data_points"] > 0
    assert "Zone D" in data["iso_10816_zone"] or "Zone C" in data["iso_10816_zone"]
