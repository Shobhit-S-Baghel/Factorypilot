import pytest
from starlette.testclient import TestClient
from httpx import AsyncClient
from app.main import app
from app.services.data_generator import scenario_generator


def test_scenario_generator_data_integrity():
    """Verify deterministic generation of industrial failure modes."""
    # 1. Cavitation
    pump_data = scenario_generator.generate_scenario_data("centrifugal_pump_cavitation", n_steps=40)
    assert len(pump_data) == 40
    assert pump_data[0]["machine_id"] == "PUMP-01"
    # Ensure acoustic and vibration elevation in later steps
    assert any(p["acoustic_db"] > 85.0 for p in pump_data)
    assert any(p["vibration_rms_mms"] > 7.1 for p in pump_data)

    # 2. Bearing wear
    spindle_data = scenario_generator.generate_scenario_data("cnc_spindle_bearing_wear", n_steps=40)
    assert len(spindle_data) == 40
    assert spindle_data[0]["machine_id"] == "CNC-SPINDLE-01"
    # Progression to Zone D > 11.2 mm/s and thermal runaway > 85°C
    assert any(p["vibration_rms_mms"] > 11.2 for p in spindle_data)
    assert any(p["bearing_temperature_c"] > 85.0 for p in spindle_data)

    # 3. Thermal overload baseline
    thermal_data = scenario_generator.generate_scenario_data("thermal_overload_baseline", n_steps=40)
    assert len(thermal_data) == 40
    # Overload current and temp rise with nominal Zone A vibration
    assert all(p["vibration_rms_mms"] < 1.4 for p in thermal_data)
    assert any(p["bearing_temperature_c"] > 85.0 for p in thermal_data)


def test_websocket_handshake_and_bidirectional_streaming():
    """Verify WebSocket handshake, bidirectional control frames, and per-tick telemetry payload."""
    client = TestClient(app)

    with client.websocket_connect("/api/v1/telemetry/ws/stream") as ws:
        # Handshake frame
        welcome = ws.receive_json()
        assert welcome["type"] == "connection_established"
        assert "active_scenario" in welcome
        assert len(welcome["available_scenarios"]) >= 3

        # Control: ping
        ws.send_json({"action": "ping"})
        pong = ws.receive_json()
        assert pong["type"] == "pong"

        # Control: start scenario
        ws.send_json({
            "action": "start",
            "scenario": "cnc_spindle_bearing_wear",
            "interval_ms": 100,
        })
        ack = ws.receive_json()
        assert ack["type"] == "control_ack"
        assert ack["status"] == "started"
        assert ack["scenario"] == "cnc_spindle_bearing_wear"

        # Receive streaming frame
        frame = ws.receive_json()
        assert frame["type"] == "telemetry_tick"
        assert frame["machine_id"] == "CNC-SPINDLE-01"
        assert "vibration_rms_mms" in frame
        assert "bearing_temperature_c" in frame
        assert "current_draw_amps" in frame
        assert "acoustic_db" in frame
        assert "iso_10816_zone" in frame
        assert "risk_score" in frame

        # Control: pause
        ws.send_json({"action": "pause"})
        pause_ack = ws.receive_json()
        assert pause_ack["type"] == "control_ack"
        assert pause_ack["status"] == "paused"

        # Control: seek
        ws.send_json({"action": "seek", "tick": 15})
        seek_ack = ws.receive_json()
        assert seek_ack["status"] == "seek_complete"
        assert seek_ack["current_tick"] == 15

        # Control: stop
        ws.send_json({"action": "stop"})
        stop_ack = ws.receive_json()
        assert stop_ack["status"] == "stopped"


def test_websocket_graceful_disconnect():
    """Verify clean disconnection handling without server crash."""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/telemetry/ws/stream") as ws:
        welcome = ws.receive_json()
        assert welcome["type"] == "connection_established"
        # Immediate close simulates abrupt client exit
        ws.close()


@pytest.mark.asyncio
async def test_scenario_export_endpoint(client: AsyncClient):
    """Verify CSV scenario export endpoint."""
    response = await client.get("/api/v1/telemetry/scenarios/centrifugal_pump_cavitation/export?n_steps=20")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    assert "attachment" in response.headers.get("content-disposition", "")
    content = response.text
    assert "vibration_rms_mms" in content
    assert "bearing_temperature_c" in content
    assert "PUMP-01" in content


@pytest.mark.asyncio
async def test_export_maintenance_ticket_json_and_markdown(client: AsyncClient):
    """Verify maintenance work order ticket export endpoint."""
    payload = {
        "machine_id": "PUMP-01",
        "issue_title": "Emergency Cavitation & Severe Zone D Vibration",
        "technician_name": "Field Reliability Specialist",
        "format": "json",
        "anomaly_flags": [
            "ISO 10816 Vibration Critical: 7.85 mm/s (Zone D)",
            "Cavitation Acoustic Alarm: 94.2 dB",
        ],
        "sensor_snapshot": {
            "vibration_rms_mms": 7.85,
            "bearing_temperature_c": 82.4,
            "rotational_speed_rpm": 1735.0,
            "current_draw_amps": 133.5,
            "acoustic_db": 94.2,
        },
        "technician_checklist": [
            {
                "step_number": 1,
                "action_item": "Verify zero electrical energy across L1-L2 at MCC-B-04.",
                "subsystem": "Electrical Drive",
                "is_completed": True,
            },
            {
                "step_number": 2,
                "action_item": "Inspect suction strainer for cake fouling.",
                "subsystem": "Hydraulics",
                "is_completed": False,
            },
        ],
        "loto_required": True,
    }

    # 1. JSON format test
    res_json = await client.post("/api/v1/diagnostics/export-ticket", json=payload)
    assert res_json.status_code == 200
    data = res_json.json()
    assert "ticket_id" in data
    assert data["machine_id"] == "PUMP-01"
    assert "markdown_content" in data
    assert "OSHA 29 CFR 1910.147" in data["markdown_content"]
    assert "WO-PUMP-01" in data["ticket_id"]

    # 2. Markdown download test
    res_md = await client.post("/api/v1/diagnostics/export-ticket?download=true", json=payload)
    assert res_md.status_code == 200
    assert "text/markdown" in res_md.headers.get("content-type", "")
    assert "attachment" in res_md.headers.get("content-disposition", "")
    assert "# FactoryPilot Maintenance Work Order" in res_md.text
