import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_telemetry_current(client: AsyncClient):
    response = await client.get("/api/v1/telemetry/current")
    assert response.status_code == 200
    readings = response.json()
    assert isinstance(readings, list)
    assert len(readings) >= 2

    pump = next(r for r in readings if r["machine_id"] == "PUMP-01")
    assert pump["vibration_rms_mm_s"] > 0
    assert pump["bearing_temp_celsius"] > 0
    assert "Zone" in pump["iso_10816_zone"]

    spindle = next(r for r in readings if r["machine_id"] == "CNC-SPINDLE-01")
    assert spindle["rpm"] > 20000


@pytest.mark.asyncio
async def test_manual_search(client: AsyncClient):
    payload = {"query": "vibration ISO 10816 limits", "top_k": 2}
    response = await client.post("/api/v1/manuals/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) > 0
