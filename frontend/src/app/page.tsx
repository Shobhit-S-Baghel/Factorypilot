"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { MachineMetrics, TelemetryReading } from "@/components/MachineMetrics";
import { IsoSeverityMatrix } from "@/components/IsoSeverityMatrix";
import { ManualsRagSearch } from "@/components/ManualsRagSearch";
import { Terminal, Shield, Cpu, RefreshCw, Layers } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_READINGS: TelemetryReading[] = [
  {
    machine_id: "PUMP-01",
    machine_name: "Centrifugal Slurry Booster Pump P-101",
    timestamp: new Date().toISOString(),
    vibration_rms_mm_s: 2.15,
    bearing_temp_celsius: 74.2,
    rpm: 1750,
    iso_10816_zone: "Zone B (Acceptable - Long Term)",
    status: "NORMAL",
    alerts: [],
  },
  {
    machine_id: "CNC-SPINDLE-01",
    machine_name: "DMG Mori 5-Axis Spindle SP-300",
    timestamp: new Date().toISOString(),
    vibration_rms_mm_s: 0.95,
    bearing_temp_celsius: 54.0,
    rpm: 24000,
    current_draw_amps: 14.8,
    coolant_flow_l_min: 24.5,
    iso_10816_zone: "Zone A (Good - Commissioned)",
    status: "NORMAL",
    alerts: [],
  },
];

export default function HomePage() {
  const [readings, setReadings] = useState<TelemetryReading[]>(DEFAULT_READINGS);
  const [backendStatus, setBackendStatus] = useState<string>("connecting");
  const [chromaStatus, setChromaStatus] = useState<string>("connecting");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchHealthAndMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Check health
      const healthRes = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
      if (healthRes.ok) {
        setBackendStatus("healthy");
        // Check api/v1/health for chromadb details
        try {
          const v1HealthRes = await fetch(`${API_BASE_URL}/api/v1/health`, { signal: AbortSignal.timeout(3000) });
          if (v1HealthRes.ok) {
            const v1Data = await v1HealthRes.json();
            setChromaStatus(v1Data.services?.chromadb || "active");
          }
        } catch {
          setChromaStatus("ephemeral");
        }
      } else {
        setBackendStatus("degraded");
      }

      // 2. Fetch live telemetry
      const telemetryRes = await fetch(`${API_BASE_URL}/api/v1/telemetry/current`, { signal: AbortSignal.timeout(3000) });
      if (telemetryRes.ok) {
        const data = await telemetryRes.json();
        if (Array.isArray(data) && data.length > 0) {
          setReadings(data);
        }
      }
    } catch {
      setBackendStatus("offline (mock mode)");
      setChromaStatus("in-memory");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthAndMetrics();
    const interval = setInterval(fetchHealthAndMetrics, 3500);
    return () => clearInterval(interval);
  }, [fetchHealthAndMetrics]);

  return (
    <div className="min-h-screen bg-industrial-950 flex flex-col">
      <Navbar backendStatus={backendStatus} chromaStatus={chromaStatus} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero banner */}
        <div className="relative overflow-hidden rounded-2xl border border-industrial-800 bg-gradient-to-r from-industrial-900 via-industrial-900/90 to-industrial-950 p-6 sm:p-8">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
              <Shield className="w-3.5 h-3.5" />
              Heavy Machinery Telemetry & Vector RAG Manuals
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              FactoryPilot Industrial Operations Suite
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Real-time ISO 10816 vibration severity analytics, bearing thermal threshold trip systems, and semantic
              vector retrieval across plant machinery operating procedures.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Machine Telemetry Section */}
        <section>
          <MachineMetrics readings={readings} onRefresh={fetchHealthAndMetrics} isLoading={isLoading} />
        </section>

        {/* Split Section: ISO Severity Matrix & ChromaDB RAG Search */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <IsoSeverityMatrix />
          <ManualsRagSearch apiBaseUrl={API_BASE_URL} />
        </section>

        {/* Monorepo Architecture Quick Reference */}
        <section className="rounded-xl border border-industrial-800 bg-industrial-900/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-lg text-white">Production Monorepo Topology</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Docker Orchestrated</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-industrial-950/70 border border-industrial-800">
              <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> backend/
              </div>
              <div className="text-slate-300">FastAPI Engine (Port 8000)</div>
              <div className="text-slate-500 mt-1">Uvicorn, Pydantic v2, Pytest, Multi-stage Slim Docker</div>
            </div>
            <div className="p-3.5 rounded-lg bg-industrial-950/70 border border-industrial-800">
              <div className="text-cyan-400 font-bold mb-1 flex items-center gap-1.5">
                <Terminal className="w-4 h-4" /> frontend/
              </div>
              <div className="text-slate-300">Next.js App Router (Port 3000)</div>
              <div className="text-slate-500 mt-1">Tailwind CSS, TypeScript, Standalone Output Docker</div>
            </div>
            <div className="p-3.5 rounded-lg bg-industrial-950/70 border border-industrial-800">
              <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> chromadb/
              </div>
              <div className="text-slate-300">Vector Knowledge Store (Port 8001)</div>
              <div className="text-slate-500 mt-1">Industrial Manual Embeddings, Persistent Volume</div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-industrial-800 bg-industrial-900/50 py-6 text-center text-xs text-slate-500">
        FactoryPilot &copy; {new Date().getFullYear()} &mdash; Production Industrial Diagnostics & Vector RAG Architecture
      </footer>
    </div>
  );
}
