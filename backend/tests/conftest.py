import pytest
import io
from typing import AsyncGenerator
import pandas as pd
import numpy as np
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.services.chroma_service import chroma_service
from app.services.rag_service import rag_service


@pytest.fixture(autouse=True)
def setup_test_services():
    chroma_service.connect()
    rag_service.load_and_chunk_manuals()


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.fixture
def nominal_telemetry_csv() -> bytes:
    """Generate 20 nominal telemetry records for PUMP-01 (Zone A/B, temp 55-65C)."""
    timestamps = pd.date_range("2026-10-18 00:00:00", periods=20, freq="15s")
    df = pd.DataFrame({
        "timestamp": timestamps.strftime("%Y-%m-%d %H:%M:%S"),
        "machine_id": ["PUMP-01"] * 20,
        "rotational_speed_rpm": np.random.normal(1750, 5, 20),
        "vibration_rms_mms": np.random.uniform(0.8, 1.3, 20),  # Zone A
        "bearing_temperature_c": np.random.uniform(52.0, 62.0, 20),
        "current_draw_amps": np.random.uniform(110.0, 120.0, 20),
        "acoustic_db": np.random.uniform(68.0, 74.0, 20),
    })
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()


@pytest.fixture
def anomalous_telemetry_csv() -> bytes:
    """Generate 25 telemetry records with a sudden vibration and thermal excursion (Zone D, temp > 85C)."""
    timestamps = pd.date_range("2026-10-18 00:00:00", periods=25, freq="15s")
    vibrations = [1.1] * 15 + [3.8, 4.2, 5.1, 5.8, 6.2, 6.5, 6.7, 6.9, 7.1, 7.3]
    temperatures = [58.0] * 15 + [72.0, 78.0, 82.5, 86.0, 89.0, 92.0, 94.5, 96.0, 97.5, 99.0]
    df = pd.DataFrame({
        "timestamp": timestamps.strftime("%Y-%m-%d %H:%M:%S"),
        "machine_id": ["PUMP-01"] * 25,
        "rotational_speed_rpm": [1750.0] * 25,
        "vibration_rms_mms": vibrations,
        "bearing_temperature_c": temperatures,
        "current_draw_amps": [118.0] * 25,
        "acoustic_db": [72.0] * 15 + [88.0] * 10,
    })
    buf = io.BytesIO()
    df.to_csv(buf, index=False)
    return buf.getvalue()
