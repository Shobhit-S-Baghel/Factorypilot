"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { TelemetryChart, TelemetryPoint, SensorContributionData } from "@/components/TelemetryChart";
import { AnomalyTable, AnomalyRecord } from "@/components/AnomalyTable";
import { DiagnosticChat } from "@/components/DiagnosticChat";
import { CsvUploader } from "@/components/CsvUploader";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Flame,
  Zap,
  Volume2,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const INITIAL_TELEMETRY_POINTS: TelemetryPoint[] = [
  { time: "14:00", timestamp: "2026-10-18T14:00:00Z", vibration_rms: 1.15, bearing_temp: 58.4, rpm: 1750, current_amps: 116.2, acoustic_db: 70.1, is_anomaly: false },
  { time: "14:01", timestamp: "2026-10-18T14:01:00Z", vibration_rms: 1.35, bearing_temp: 61.2, rpm: 1748, current_amps: 118.2, acoustic_db: 73.0, is_anomaly: false },
  { time: "14:01:30", timestamp: "2026-10-18T14:01:30Z", vibration_rms: 1.85, bearing_temp: 63.4, rpm: 1746, current_amps: 121.0, acoustic_db: 78.2, is_anomaly: false },
  { time: "14:02", timestamp: "2026-10-18T14:02:00Z", vibration_rms: 3.15, bearing_temp: 67.2, rpm: 1742, current_amps: 126.8, acoustic_db: 87.0, is_anomaly: true, anomaly_score: 0.72 },
  { time: "14:02:30", timestamp: "2026-10-18T14:02:30Z", vibration_rms: 4.65, bearing_temp: 72.1, rpm: 1738, current_amps: 131.2, acoustic_db: 93.8, is_anomaly: true, anomaly_score: 0.88 },
  { time: "14:03", timestamp: "2026-10-18T14:03:00Z", vibration_rms: 5.45, bearing_temp: 76.8, rpm: 1735, current_amps: 134.5, acoustic_db: 95.2, is_anomaly: true, anomaly_score: 0.94 },
  { time: "14:03:30", timestamp: "2026-10-18T14:03:30Z", vibration_rms: 5.55, bearing_temp: 79.0, rpm: 1733, current_amps: 135.0, acoustic_db: 95.5, is_anomaly: true, anomaly_score: 0.95 },
  { time: "14:04", timestamp: "2026-10-18T14:04:00Z", vibration_rms: 5.10, bearing_temp: 79.8, rpm: 1735, current_amps: 133.2, acoustic_db: 93.9, is_anomaly: true, anomaly_score: 0.89 },
  { time: "14:04:30", timestamp: "2026-10-18T14:04:30Z", vibration_rms: 4.40, bearing_temp: 80.3, rpm: 1737, current_amps: 131.0, acoustic_db: 90.5, is_anomaly: true, anomaly_score: 0.82 },
];

export default function DashboardPage() {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("PUMP-01");
  const [backendStatus, setBackendStatus] = useState<string>("connecting");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);

  // Machine state summary
  const [equipmentHealthIndex, setEquipmentHealthIndex] = useState<number>(54.0);
  const [operationalState, setOperationalState] = useState<string>("Degraded");
  const [isoZone, setIsoZone] = useState<string>("Zone C (Warning - 4.4 mm/s)");
  const [estimatedTimeToMaintenance, setEstimatedTimeToMaintenance] = useState<string>("~48 Hours (Action Required)");

  // Metrics
  const [currentVibration, setCurrentVibration] = useState<number>(4.4);
  const [currentBearingTemp, setCurrentBearingTemp] = useState<number>(80.3);
  const [currentRpm, setCurrentRpm] = useState<number>(1737.0);
  const [currentAmps, setCurrentAmps] = useState<number>(131.0);
  const [currentAcousticDb, setCurrentAcousticDb] = useState<number>(90.5);

  // Time-series points and anomalies
  const [telemetryPoints, setTelemetryPoints] = useState<TelemetryPoint[]>(INITIAL_TELEMETRY_POINTS);
  const [anomalyRanges, setAnomalyRanges] = useState<{ start: string; end: string; severity: "warning" | "critical" }[]>([
    { start: "14:02", end: "14:04:30", severity: "critical" },
  ]);

  const [sensorContributions, setSensorContributions] = useState<SensorContributionData[]>([
    { sensor_channel: "vibration_rms_mms", contribution_score: 0.58, current_value: 5.4, unit: "mm/s" },
    { sensor_channel: "acoustic_db", contribution_score: 0.24, current_value: 95.2, unit: "dB" },
    { sensor_channel: "bearing_temperature_c", contribution_score: 0.12, current_value: 80.3, unit: "°C" },
    { sensor_channel: "current_draw_amps", contribution_score: 0.06, current_value: 135.0, unit: "Amps" },
  ]);

  const [anomalyTimeline, setAnomalyTimeline] = useState<AnomalyRecord[]>([
    {
      timestamp: "2026-10-18T14:03:00Z",
      machine_id: "PUMP-01",
      is_anomaly: true,
      anomaly_score: 0.94,
      risk_score: 94.0,
      iso_10816_zone: "Zone D (Critical Trip)",
      thermal_status: "Warning (>80°C)",
      primary_contributor: "vibration_rms_mms",
      affected_metrics: ["vibration_rms_mms", "acoustic_db"],
    },
    {
      timestamp: "2026-10-18T14:02:30Z",
      machine_id: "PUMP-01",
      is_anomaly: true,
      anomaly_score: 0.88,
      risk_score: 88.0,
      iso_10816_zone: "Zone D (Critical Trip)",
      thermal_status: "Nominal",
      primary_contributor: "vibration_rms_mms",
      affected_metrics: ["vibration_rms_mms"],
    },
    {
      timestamp: "2026-10-18T14:02:00Z",
      machine_id: "PUMP-01",
      is_anomaly: true,
      anomaly_score: 0.72,
      risk_score: 72.0,
      iso_10816_zone: "Zone C (Warning)",
      thermal_status: "Nominal",
      primary_contributor: "acoustic_db",
      affected_metrics: ["acoustic_db"],
    },
  ]);

  // Check backend health
  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) setBackendStatus("healthy");
      else setBackendStatus("degraded");
    } catch {
      setBackendStatus("offline (mock)");
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Handle uploaded analysis response
  const handleAnalysisComplete = (result: any) => {
    if (!result) return;

    if (result.machine_id) {
      setSelectedMachineId(result.machine_id);
    }
    if (result.equipment_health_index !== undefined) {
      setEquipmentHealthIndex(result.equipment_health_index);
    }
    if (result.overall_state) {
      setOperationalState(result.overall_state);
      if (result.overall_state === "Critical") {
        setEstimatedTimeToMaintenance("IMMEDIATE (< 2 Hours)");
      } else if (result.overall_state === "Degraded") {
        setEstimatedTimeToMaintenance("~48-72 Hours (Scheduled)");
      } else {
        setEstimatedTimeToMaintenance("> 1,000 Hours (Nominal)");
      }
    }
    if (result.iso_10816_zone) {
      setIsoZone(result.iso_10816_zone);
    }

    // Update sensor contribution breakdown
    if (result.sensor_contribution_rankings && Array.isArray(result.sensor_contribution_rankings)) {
      setSensorContributions(
        result.sensor_contribution_rankings.map((c: any) => ({
          sensor_channel: c.sensor_channel,
          contribution_score: c.contribution_score,
          current_value: c.current_value,
          unit: c.unit,
        }))
      );
    }

    // Convert anomaly timeline into chart points
    if (result.anomaly_timeline && Array.isArray(result.anomaly_timeline) && result.anomaly_timeline.length > 0) {
      const points: TelemetryPoint[] = result.anomaly_timeline.map((item: any) => {
        const d = new Date(item.timestamp);
        const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        return {
          time: timeStr,
          timestamp: item.timestamp,
          vibration_rms: item.primary_contributor === "vibration_rms_mms" ? 5.2 : 1.3,
          bearing_temp: item.thermal_status.includes("Warning") ? 82.5 : 59.0,
          rpm: result.machine_id?.includes("CNC") ? 24000 : 1745,
          current_amps: result.machine_id?.includes("CNC") ? 21.0 : 128.0,
          acoustic_db: item.primary_contributor === "acoustic_db" ? 92.0 : 71.0,
          is_anomaly: item.is_anomaly,
          anomaly_score: item.anomaly_score,
        };
      });
      setTelemetryPoints(points);

      // Extract anomaly ranges for shaded areas
      const anomPoints = points.filter((p) => p.is_anomaly);
      if (anomPoints.length > 0) {
        setAnomalyRanges([
          {
            start: anomPoints[0].time,
            end: anomPoints[anomPoints.length - 1].time,
            severity: result.overall_state === "Critical" ? "critical" : "warning",
          },
        ]);
      } else {
        setAnomalyRanges([]);
      }

      setAnomalyTimeline(result.anomaly_timeline);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 stroke-emerald-500";
    if (score >= 50) return "text-amber-500 stroke-amber-500";
    return "text-rose-600 stroke-rose-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* 1. Header */}
      <Header
        selectedMachineId={selectedMachineId}
        onSelectMachine={setSelectedMachineId}
        backendStatus={backendStatus}
        equipmentHealth={equipmentHealthIndex}
        operationalState={operationalState}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. Top-Level Machine Operational Status Banner */}
        <section className="industrial-card p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start space-x-5">
              {/* Circular Gauge for Equipment Health Index */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="stroke-slate-100"
                    strokeWidth="3.5"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`transition-all duration-700 ease-out ${getHealthColor(equipmentHealthIndex)}`}
                    strokeWidth="3.5"
                    strokeDasharray={`${equipmentHealthIndex}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-mono tracking-tight text-slate-900">
                    {equipmentHealthIndex.toFixed(0)}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">EHI</span>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedMachineId}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {selectedMachineId === "PUMP-01"
                      ? "Centrifugal Slurry Booster Pump P-101"
                      : "DMG Mori 5-Axis Electro-Spindle SP-300"}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-900">State:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-xs ${
                        operationalState === "Nominal"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : operationalState === "Degraded"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {operationalState}
                    </span>
                  </span>

                  <span className="text-slate-300">&bull;</span>

                  <span className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <span className="font-sans font-semibold text-slate-900">ISO 10816:</span>
                    <span className="text-slate-800 font-semibold">{isoZone}</span>
                  </span>

                  <span className="text-slate-300">&bull;</span>

                  <span className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-sans font-semibold text-slate-900">Intervention:</span>
                    <span className={`font-semibold ${operationalState === "Critical" ? "text-rose-600 font-bold" : "text-slate-800"}`}>
                      {estimatedTimeToMaintenance}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency / Safety Tag */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6 text-xs gap-2 shrink-0">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Safety Standard: OSHA 29 CFR 1910.147</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Telemetry Engine: v0.2.0 • Online</span>
            </div>
          </div>
        </section>

        {/* 3. Ingestion Panel & Dataset Selector */}
        <section>
          <CsvUploader
            apiBaseUrl={API_BASE_URL}
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isIngesting}
            setIsLoading={setIsIngesting}
          />
        </section>

        {/* 4. Metric Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Vibration RMS"
            value={currentVibration}
            unit="mm/s"
            subtext="ISO 10816 velocity"
            badge={currentVibration >= 4.5 ? "Zone D (Trip)" : currentVibration >= 2.8 ? "Zone C (Alert)" : "Zone B"}
            status={currentVibration >= 4.5 ? "critical" : currentVibration >= 2.8 ? "warning" : "nominal"}
            iconName="gauge"
          />

          <MetricCard
            label="Bearing Housing"
            value={currentBearingTemp}
            unit="°C"
            subtext="80°C threshold limit"
            badge={currentBearingTemp >= 95 ? "Critical Trip" : currentBearingTemp >= 80 ? "Warning (>80°C)" : "Normal"}
            status={currentBearingTemp >= 95 ? "critical" : currentBearingTemp >= 80 ? "warning" : "nominal"}
            iconName="flame"
          />

          <MetricCard
            label="Rotational Speed"
            value={Math.round(currentRpm)}
            unit="RPM"
            subtext={selectedMachineId.includes("CNC") ? "Max 24,000 RPM" : "Nominal 1,750 RPM"}
            badge="Locked"
            status="active"
            iconName="rpm"
          />

          <MetricCard
            label="Current Draw"
            value={currentAmps}
            unit="Amps"
            subtext="FLA overload trip @ 125%"
            badge={currentAmps > 18.5 && selectedMachineId.includes("CNC") ? "Overload" : "In Envelope"}
            status={currentAmps > 18.5 && selectedMachineId.includes("CNC") ? "warning" : "nominal"}
            iconName="zap"
          />

          <MetricCard
            label="Acoustic Intensity"
            value={currentAcousticDb}
            unit="dB"
            subtext="Cavitation pinging alarm"
            badge={currentAcousticDb > 85 ? "Cavitation Alert" : "Normal"}
            status={currentAcousticDb > 85 ? "critical" : "nominal"}
            iconName="volume"
          />
        </section>

        {/* 5. Synchronized Multi-Metric Time-Series & AI Copilot Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Charts & Anomaly Log (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <TelemetryChart
              data={telemetryPoints}
              anomalyRanges={anomalyRanges}
              sensorContributions={sensorContributions}
              machineId={selectedMachineId}
            />

            <AnomalyTable
              anomalies={anomalyTimeline}
              onSelectAnomaly={(anom) => {
                // Focus diagnostic on this anomaly
                console.log("Selected anomaly to diagnose:", anom);
              }}
            />
          </div>

          {/* Right Column: AI Diagnostics & Field Assistant Dock (5 cols) */}
          <div className="lg:col-span-5">
            <DiagnosticChat
              apiBaseUrl={API_BASE_URL}
              machineId={selectedMachineId}
              currentAnomalySummary={{
                vibration_rms_mms: currentVibration,
                bearing_temperature_c: currentBearingTemp,
                iso_10816_zone: isoZone,
                acoustic_db: currentAcousticDb,
                primary_contributor: sensorContributions[0]?.sensor_channel || "vibration_rms_mms",
              }}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>FactoryPilot &copy; {new Date().getFullYear()} &mdash; Production Industrial Diagnostics & Vector RAG Architecture</span>
          <div className="flex items-center space-x-4">
            <span>ISO 10816-3 Evaluator</span>
            <span>&bull;</span>
            <span>OSHA 1910.147 LOTO</span>
            <span>&bull;</span>
            <span className="font-mono text-teal-700 font-semibold">ChromaDB RAG Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
