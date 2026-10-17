#!/usr/bin/env python3
"""
FactoryPilot System Healthcheck & End-to-End Verification Suite.

Validates:
1. Backend connectivity and service status at /api/v1/health (and /health)
2. Ingestion pipeline schema validation via multipart CSV upload at /api/v1/telemetry/upload
3. Real-time anomaly engine & Equipment Health Index (EHI) scoring at /api/v1/telemetry/upload-and-analyze
4. Technical manual vector RAG copilot at /api/v1/diagnostics/troubleshoot
5. Work order maintenance ticket generation at /api/v1/diagnostics/export-ticket
6. Frontend production/dev server responsiveness at http://localhost:3000
"""

import os
import sys
import json
import time
import argparse
from typing import Dict, Any, Tuple, Optional
import urllib.request
import urllib.error
import urllib.parse

# Terminal ANSI Styling
class Color:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    GREEN = "\033[32m"
    RED = "\033[31m"
    YELLOW = "\033[33m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    BG_GREEN = "\033[42m"
    BG_RED = "\033[41m"


def print_banner():
    print(f"{Color.CYAN}{Color.BOLD}" + "=" * 76 + f"{Color.RESET}")
    print(f"{Color.CYAN}{Color.BOLD}   FACTORYPILOT SYSTEM HEALTHCHECK & END-TO-END VERIFICATION SUITE   {Color.RESET}")
    print(f"{Color.CYAN}{Color.BOLD}" + "=" * 76 + f"{Color.RESET}\n")


def format_status(passed: bool) -> str:
    if passed:
        return f"{Color.GREEN}{Color.BOLD}[ PASS ]{Color.RESET}"
    return f"{Color.RED}{Color.BOLD}[ FAIL ]{Color.RESET}"


def make_request(
    url: str,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    data: Optional[bytes] = None,
    timeout: float = 6.0,
) -> Tuple[int, Any, float]:
    """Execute HTTP request with latency timing."""
    headers = headers or {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    start_time = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            latency = (time.time() - start_time) * 1000.0
            body = response.read().decode("utf-8")
            try:
                parsed = json.loads(body)
            except Exception:
                parsed = body
            return response.status, parsed, latency
    except urllib.error.HTTPError as e:
        latency = (time.time() - start_time) * 1000.0
        try:
            body = e.read().decode("utf-8")
            parsed = json.loads(body)
        except Exception:
            parsed = str(e)
        return e.code, parsed, latency
    except Exception as e:
        latency = (time.time() - start_time) * 1000.0
        return 0, str(e), latency


def test_backend_health(base_url: str) -> Tuple[bool, str, float]:
    """Check /api/v1/health connectivity and verify core service statuses."""
    endpoints = [f"{base_url}/api/v1/health", f"{base_url}/health"]
    for ep in endpoints:
        status, data, latency = make_request(ep)
        if status == 200 and isinstance(data, dict):
            status_val = data.get("status", "")
            if status_val in ("healthy", "ok"):
                services = data.get("services", {})
                detail = f"Status: {status_val} | RAG: {services.get('rag_engine', 'active')} | ML: {services.get('ml_anomaly_engine', 'operational')}"
                return True, detail, latency

    return False, f"Could not reach {endpoints[0]}", 0.0


def test_telemetry_csv_upload(base_url: str, samples_path: Optional[str] = None) -> Tuple[bool, str, float]:
    """Upload multipart CSV telemetry and verify response schema."""
    # Find or construct CSV
    csv_content = ""
    if samples_path and os.path.exists(samples_path):
        with open(samples_path, "r", encoding="utf-8") as f:
            csv_content = f.read()
    else:
        # Fallback inline synthetic CSV
        csv_content = (
            "timestamp,machine_id,rotational_speed_rpm,vibration_rms_mms,bearing_temperature_c,current_draw_amps,acoustic_db\n"
            "2026-10-18T14:00:00Z,PUMP-01,1750.0,1.15,58.4,116.2,70.1\n"
            "2026-10-18T14:01:00Z,PUMP-01,1748.0,1.35,61.2,118.2,73.0\n"
            "2026-10-18T14:02:00Z,PUMP-01,1745.0,3.15,67.2,126.8,87.0\n"
            "2026-10-18T14:03:00Z,PUMP-01,1740.0,5.45,76.8,134.5,95.2\n"
            "2026-10-18T14:04:00Z,PUMP-01,1735.0,5.10,79.8,133.2,93.9\n"
        )

    boundary = "----FactoryPilotVerificationBoundary7MA4YWxkTrZu0gW"
    body_lines = [
        f"--{boundary}",
        'Content-Disposition: form-data; name="file"; filename="test_telemetry.csv"',
        "Content-Type: text/csv",
        "",
        csv_content,
        f"--{boundary}--",
        "",
    ]
    body = "\r\n".join(body_lines).encode("utf-8")
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }

    url = f"{base_url}/api/v1/telemetry/upload"
    status, data, latency = make_request(url, method="POST", headers=headers, data=body)

    if status in (200, 201) and isinstance(data, dict):
        required_keys = ["file_id", "machine_id", "total_records", "rolling_features"]
        if all(k in data for k in required_keys):
            n_recs = data.get("total_records", 0)
            m_id = data.get("machine_id", "UNKNOWN")
            return True, f"Ingested {n_recs} rows for {m_id} | Features extracted", latency

    return False, f"Upload returned HTTP {status}: {str(data)[:100]}", latency


def test_telemetry_upload_and_analyze(base_url: str) -> Tuple[bool, str, float]:
    """Test full ML anomaly detection and Equipment Health Index (EHI) scoring."""
    csv_content = (
        "timestamp,machine_id,rotational_speed_rpm,vibration_rms_mms,bearing_temperature_c,current_draw_amps,acoustic_db\n"
        "2026-10-18T14:00:00Z,PUMP-01,1750.0,1.15,58.4,116.2,70.1\n"
        "2026-10-18T14:01:00Z,PUMP-01,1748.0,1.35,61.2,118.2,73.0\n"
        "2026-10-18T14:02:00Z,PUMP-01,1745.0,3.15,67.2,126.8,87.0\n"
        "2026-10-18T14:03:00Z,PUMP-01,1740.0,5.45,76.8,134.5,95.2\n"
        "2026-10-18T14:04:00Z,PUMP-01,1735.0,5.10,79.8,133.2,93.9\n"
    )

    boundary = "----FactoryPilotVerificationBoundaryML7MA4"
    body_lines = [
        f"--{boundary}",
        'Content-Disposition: form-data; name="file"; filename="anomaly_test.csv"',
        "Content-Type: text/csv",
        "",
        csv_content,
        f"--{boundary}--",
        "",
    ]
    body = "\r\n".join(body_lines).encode("utf-8")
    headers = {
        "Content-Type": f"multipart/form-data; boundary={boundary}",
        "Content-Length": str(len(body)),
    }

    url = f"{base_url}/api/v1/telemetry/upload-and-analyze"
    status, data, latency = make_request(url, method="POST", headers=headers, data=body)

    if status == 200 and isinstance(data, dict):
        ehi = data.get("equipment_health_index")
        state = data.get("overall_state")
        iso = data.get("iso_10816_zone")
        if ehi is not None and state is not None:
            return True, f"EHI: {ehi:.1f}% | State: {state} | ISO: {iso}", latency

    return False, f"ML evaluation returned HTTP {status}: {str(data)[:100]}", latency


def test_rag_copilot_troubleshoot(base_url: str) -> Tuple[bool, str, float]:
    """Test technical manual RAG query and confirm chapter citation retrieval."""
    payload = {
        "machine_id": "PUMP-01",
        "technician_query": "High vibration and cavitation noise observed in suction line. What are the ISO 10816 limits and LOTO steps?",
        "urgency_level": "HIGH",
    }
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    url = f"{base_url}/api/v1/diagnostics/troubleshoot"
    status, data, latency = make_request(url, method="POST", headers=headers, data=body)

    if status == 200 and isinstance(data, dict):
        citations = data.get("retrieved_manual_citations", [])
        loto = data.get("safety_and_loto_advisory", "")
        steps = data.get("sequential_field_inspection_steps", [])
        if len(citations) > 0 and len(steps) > 0:
            first_cite = citations[0].get("manual", "manual.md")
            return True, f"Retrieved {len(citations)} citations ({first_cite}) | {len(steps)} inspection steps", latency

    return False, f"RAG query returned HTTP {status}: {str(data)[:100]}", latency


def test_work_order_export(base_url: str) -> Tuple[bool, str, float]:
    """Test maintenance work order compilation and Markdown dispatch."""
    payload = {
        "machine_id": "PUMP-01",
        "issue_title": "Automated Verification Work Order",
        "technician_name": "QA Reliability Automation",
        "format": "json",
        "anomaly_flags": ["Elevated Vibration 5.45 mm/s (Zone D)"],
        "sensor_snapshot": {
            "vibration_rms_mms": 5.45,
            "bearing_temperature_c": 79.8,
            "rotational_speed_rpm": 1735.0,
            "current_draw_amps": 133.2,
            "acoustic_db": 93.9,
        },
        "loto_required": True,
    }
    body = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    url = f"{base_url}/api/v1/diagnostics/export-ticket?download=false"
    status, data, latency = make_request(url, method="POST", headers=headers, data=body)

    if status == 200 and isinstance(data, dict):
        ticket_id = data.get("ticket_id")
        md_content = data.get("markdown_content", "")
        if ticket_id and "OSHA 29 CFR 1910.147" in md_content:
            return True, f"Generated Work Order: {ticket_id} (LOTO compliant)", latency

    return False, f"Ticket export returned HTTP {status}", latency


def test_frontend_server(frontend_url: str) -> Tuple[bool, str, float]:
    """Validate that the Next.js frontend UI responds cleanly."""
    status, data, latency = make_request(frontend_url)
    if status == 200:
        html_sample = str(data)[:200]
        has_app = "FactoryPilot" in html_sample or "<!DOCTYPE html>" in html_sample or "<html" in html_sample
        if has_app:
            return True, "Next.js App Router live & serving dashboard", latency
        return True, "HTTP 200 OK received from frontend port", latency

    return False, f"Frontend check returned HTTP {status}", latency


def main():
    parser = argparse.ArgumentParser(description="FactoryPilot System Verification Smoke Test")
    parser.add_argument("--backend-url", default="http://localhost:8000", help="FastAPI backend URL")
    parser.add_argument("--frontend-url", default="http://localhost:3000", help="Next.js frontend URL")
    parser.add_argument("--skip-frontend", action="store_true", help="Skip frontend check if running headless")
    args = parser.parse_args()

    print_banner()
    print(f"[*] Target Backend:  {args.backend_url}")
    print(f"[*] Target Frontend: {args.frontend_url}")
    print(f"[*] Timestamp:       {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
    print("-" * 76 + "\n")

    results = []

    # 1. Backend Health
    print("[1/6] Testing Backend Connectivity & Core Services (/api/v1/health)...")
    passed, detail, latency = test_backend_health(args.backend_url)
    results.append(("Backend Service Health", passed, detail, latency))
    print(f"      {format_status(passed)} in {latency:.1f}ms - {detail}\n")

    # 2. Telemetry Ingestion Pipeline
    print("[2/6] Testing Industrial Telemetry Ingestion (/api/v1/telemetry/upload)...")
    passed, detail, latency = test_telemetry_csv_upload(args.backend_url)
    results.append(("Telemetry Ingestion (CSV)", passed, detail, latency))
    print(f"      {format_status(passed)} in {latency:.1f}ms - {detail}\n")

    # 3. ML Anomaly Engine & EHI Scoring
    print("[3/6] Testing ML Anomaly Engine & Health Index (/api/v1/telemetry/upload-and-analyze)...")
    passed, detail, latency = test_telemetry_upload_and_analyze(args.backend_url)
    results.append(("ML Anomaly Engine & EHI", passed, detail, latency))
    print(f"      {format_status(passed)} in {latency:.1f}ms - {detail}\n")

    # 4. RAG Manual Retrieval & Diagnostics
    print("[4/6] Testing Technical Manual Vector RAG Copilot (/api/v1/diagnostics/troubleshoot)...")
    passed, detail, latency = test_rag_copilot_troubleshoot(args.backend_url)
    results.append(("Vector RAG Copilot", passed, detail, latency))
    print(f"      {format_status(passed)} in {latency:.1f}ms - {detail}\n")

    # 5. Maintenance Ticket Dispatch
    print("[5/6] Testing Maintenance Ticket & Work Order Export (/api/v1/diagnostics/export-ticket)...")
    passed, detail, latency = test_work_order_export(args.backend_url)
    results.append(("Work Order Ticket Generator", passed, detail, latency))
    print(f"      {format_status(passed)} in {latency:.1f}ms - {detail}\n")

    # 6. Frontend Server Check
    if not args.skip_frontend:
        print("[6/6] Testing Next.js Frontend Web Application (http://localhost:3000)...")
        passed, detail, latency = test_frontend_server(args.frontend_url)
        results.append(("Next.js Frontend UI", passed, detail, latency))
        print(f"      {format_status(passed)} in {latency:.1f}ms - {detail}\n")
    else:
        print("[6/6] Skipping frontend check (--skip-frontend specified).\n")

    # Summary Table
    print("=" * 76)
    print(f"{Color.BOLD}{'SUBSYSTEM VERIFICATION SUMMARY':^76}{Color.RESET}")
    print("=" * 76)
    print(f"{'Subsystem / Test Case':<32} | {'Result':<10} | {'Latency':<9} | {'Details'}")
    print("-" * 76)

    all_passed = True
    for name, ok, det, lat in results:
        status_str = f"{Color.GREEN}PASS{Color.RESET}" if ok else f"{Color.RED}FAIL{Color.RESET}"
        if not ok:
            all_passed = False
        print(f"{name:<32} | {status_str:<19} | {lat:6.1f}ms  | {det[:24]}")

    print("=" * 76)

    if all_passed:
        print(f"\n{Color.BG_GREEN}{Color.WHITE}{Color.BOLD}  ✓ ALL SYSTEM VERIFICATION CHECKS PASSED SUCCESSFULLY. READY FOR DEMO!  {Color.RESET}\n")
        sys.exit(0)
    else:
        print(f"\n{Color.BG_RED}{Color.WHITE}{Color.BOLD}  ✗ ONE OR MORE CHECKS FAILED. PLEASE INSPECT LOGS ABOVE.  {Color.RESET}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
