import asyncio
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.data_generator import scenario_generator
from app.services.ml_engine import ml_engine

logger = logging.getLogger(__name__)

router = APIRouter()


class TelemetryStreamSession:
    """Manages real-time bidirectional telemetry streaming for a single WebSocket connection."""

    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.is_running = False
        self.scenario_id = "centrifugal_pump_cavitation"
        self.interval_sec = 0.25  # 250ms default
        self.current_tick = 0
        self.records: List[Dict[str, Any]] = []
        self._load_scenario()

    def _load_scenario(self, scenario_name: Optional[str] = None):
        if scenario_name:
            self.scenario_id = scenario_name
        # Generate 120 steps with 2-second timestamp intervals
        self.records = scenario_generator.generate_scenario_data(
            scenario_id=self.scenario_id,
            n_steps=120,
            interval_seconds=2,
            start_time=datetime.utcnow(),
        )
        self.current_tick = 0

    def seek_timestamp(self, target_ts: str) -> bool:
        """Seek playback head to closest timestamp in scenario."""
        for idx, rec in enumerate(self.records):
            if target_ts in rec["timestamp"]:
                self.current_tick = idx
                return True
        return False

    def get_current_frame(self) -> Dict[str, Any]:
        """Produce enriched real-time broadcast frame with live ISO zoning and ML evaluation."""
        if not self.records:
            self._load_scenario()

        raw = self.records[self.current_tick % len(self.records)]
        vib = float(raw["vibration_rms_mms"])
        temp = float(raw["bearing_temperature_c"])
        current = float(raw["current_draw_amps"])
        acoustic = float(raw["acoustic_db"])
        rpm = float(raw["rotational_speed_rpm"])

        iso_zone = ml_engine.classify_iso_10816(vib)
        thermal_status = ml_engine.classify_thermal_status(temp)

        alerts = []
        if "Zone C" in iso_zone:
            alerts.append(f"ISO 10816 Vibration Alert: {vib:.2f} mm/s (Restricted Operation)")
        elif "Zone D" in iso_zone:
            alerts.append(f"ISO 10816 Critical Vibration Trip: {vib:.2f} mm/s (Danger)")

        if temp > 80.0:
            alerts.append(f"Bearing Thermal Threshold Exceeded: {temp:.1f}°C (>80°C)")
        if temp > 95.0:
            alerts.append(f"Catastrophic Bearing Temperature: {temp:.1f}°C (>95°C Emergency Trip)")

        if acoustic > 85.0:
            alerts.append(f"Cavitation Ultrasonic Ping Detected: {acoustic:.1f} dB (>85 dB)")

        frame = {
            "type": "telemetry_tick",
            "tick": self.current_tick,
            "total_ticks": len(self.records),
            "scenario": self.scenario_id,
            "machine_id": raw["machine_id"],
            "timestamp": raw["timestamp"],
            "rotational_speed_rpm": rpm,
            "vibration_rms_mms": vib,
            "bearing_temperature_c": temp,
            "current_draw_amps": current,
            "acoustic_db": acoustic,
            "is_anomaly": raw.get("is_anomaly", vib >= 2.8 or temp > 80.0),
            "risk_score": raw.get("risk_score", 15.0),
            "iso_10816_zone": iso_zone,
            "thermal_status": thermal_status,
            "alerts": alerts,
        }
        return frame


@router.websocket("/ws/stream")
async def websocket_telemetry_stream(websocket: WebSocket):
    """Bidirectional WebSocket streaming endpoint for real-time sensor emulation.

    Supports control frames:
      - {"action": "start", "scenario": "bearing_wear", "interval_ms": 250}
      - {"action": "pause"}
      - {"action": "resume"}
      - {"action": "seek", "timestamp": "..."}
      - {"action": "stop"}
    """
    await websocket.accept()
    session = TelemetryStreamSession(websocket)
    logger.info("WebSocket telemetry client connected.")

    # Send initial welcome metadata
    await websocket.send_json({
        "type": "connection_established",
        "message": "Connected to FactoryPilot Real-Time Industrial Telemetry Stream.",
        "active_scenario": session.scenario_id,
        "available_scenarios": scenario_generator.get_available_scenarios(),
    })

    stream_task: Optional[asyncio.Task] = None

    async def stream_loop():
        try:
            while True:
                if session.is_running:
                    frame = session.get_current_frame()
                    await websocket.send_json(frame)
                    session.current_tick = (session.current_tick + 1) % len(session.records)
                await asyncio.sleep(session.interval_sec)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.warning(f"Error in stream loop: {e}")

    # Launch background broadcast worker
    stream_task = asyncio.create_task(stream_loop())

    try:
        while True:
            # Receive control frame from client
            message_text = await websocket.receive_text()
            try:
                command = json.loads(message_text)
            except Exception:
                await websocket.send_json({
                    "type": "error",
                    "message": "Malformed control frame: payload must be valid JSON.",
                })
                continue

            action = command.get("action", "").lower()

            if action == "start":
                scenario = command.get("scenario")
                if scenario:
                    session._load_scenario(scenario)
                interval_ms = command.get("interval_ms")
                if interval_ms:
                    session.interval_sec = max(0.05, min(5.0, interval_ms / 1000.0))
                session.is_running = True
                await websocket.send_json({
                    "type": "control_ack",
                    "status": "started",
                    "scenario": session.scenario_id,
                    "interval_ms": int(session.interval_sec * 1000),
                    "current_tick": session.current_tick,
                })

            elif action == "pause":
                session.is_running = False
                await websocket.send_json({
                    "type": "control_ack",
                    "status": "paused",
                    "current_tick": session.current_tick,
                })

            elif action == "resume":
                session.is_running = True
                await websocket.send_json({
                    "type": "control_ack",
                    "status": "resumed",
                    "current_tick": session.current_tick,
                })

            elif action == "seek":
                target_ts = command.get("timestamp", "")
                target_tick = command.get("tick")
                if target_tick is not None and 0 <= target_tick < len(session.records):
                    session.current_tick = int(target_tick)
                    found = True
                else:
                    found = session.seek_timestamp(target_ts)

                await websocket.send_json({
                    "type": "control_ack",
                    "status": "seek_complete" if found else "seek_not_found",
                    "current_tick": session.current_tick,
                })

            elif action == "stop":
                session.is_running = False
                session.current_tick = 0
                await websocket.send_json({
                    "type": "control_ack",
                    "status": "stopped",
                    "current_tick": 0,
                })

            elif action == "ping":
                await websocket.send_json({"type": "pong", "timestamp": datetime.utcnow().isoformat()})

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unsupported action '{action}'. Supported: start, pause, resume, seek, stop, ping",
                })

    except WebSocketDisconnect:
        logger.info("WebSocket telemetry client disconnected cleanly.")
    except Exception as e:
        logger.warning(f"WebSocket session terminated: {e}")
    finally:
        if stream_task and not stream_task.done():
            stream_task.cancel()
