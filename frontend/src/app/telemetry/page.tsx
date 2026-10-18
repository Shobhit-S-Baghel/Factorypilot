"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { MetricCard } from "@/components/MetricCard";
import { TelemetryChart, TelemetryPoint, SensorContributionData } from "@/components/TelemetryChart";
import { AnomalyTable, AnomalyRecord } from "@/components/AnomalyTable";
import { CsvUploader } from "@/components/CsvUploader";
import { StreamControls, SCENARIO_OPTIONS } from "@/components/StreamControls";
import { VibrationGauge, ThermalGauge, AcousticGauge, EmergencyBanner } from "@/components/Gauges";
import { TicketModal } from "@/components/TicketModal";
import { useTelemetryStream, SpeedMultiplier } from "@/hooks/useTelemetryStream";
import { formatTimestamp } from "@/lib/formatters";
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
  FileText,
  Sliders,
  Sparkles,
  Upload,
  ArrowRight,
  Info,
  Radio,
  BrainCircuit,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? "https://factorypilot.onrender.com" : "http://localhost:8000");

export default function TelemetrySandboxPage() {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("PUMP-01");
  const [backendStatus, setBackendStatus] = useState<string>("connecting");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);

  // Clean Zero-State initialization
  const [hasDataLoaded, setHasDataLoaded] = useState<boolean>(false);
  const [diagnosedFault, setDiagnosedFault] = useState<{
    diagnosed_component?: string;
    failure_mechanism?: string;
    failure_mode?: string;
    recommended_action?: string;
    is_anomaly?: boolean;
  } | null>(null);

  // Machine metrics initialized to null for zero-state
  const [equipmentHealthIndex, setEquipmentHealthIndex] = useState<number | null>(null);
  const [operationalState, setOperationalState] = useState<string>("Standby");
  const [isoZone, setIsoZone] = useState<string>("Standby (Awaiting Sensor Telemetry)");
  const [estimatedTimeToMaintenance, setEstimatedTimeToMaintenance] = useState<string>("Awaiting Sensor Telemetry");

  const [currentVibration, setCurrentVibration] = useState<number | null>(null);
  const [currentBearingTemp, setCurrentBearingTemp] = useState<number | null>(null);
  const [currentRpm, setCurrentRpm] = useState<number | null>(null);
  const [currentAmps, setCurrentAmps] = useState<number | null>(null);
  const [currentAcousticDb, setCurrentAcousticDb] = useState<number | null>(null);

  const [staticPoints, setStaticPoints] = useState<TelemetryPoint[]>([]);
  const [staticAnomalies, setStaticAnomalies] = useState<AnomalyRecord[]>([]);
  const [sensorContributions, setSensorContributions] = useState<SensorContributionData[]>([]);

  // Hook into live WebSocket telemetry stream (autoStart: false)
  const stream = useTelemetryStream({
    defaultScenario: "centrifugal_pump_cavitation",
    defaultSpeed: 1,
    bufferSize: 60,
    autoStart: false,
  });

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
    const interval = setInterval(checkHealth, 6000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  // Sync WebSocket stream frames
  useEffect(() => {
    if (stream.latestFrame) {
      setHasDataLoaded(true);
      const frame = stream.latestFrame;

      if (frame.machine_id) {
        setSelectedMachineId(frame.machine_id);
      }

      setCurrentVibration(frame.vibration_rms_mms);
      setCurrentBearingTemp(frame.bearing_temperature_c);
      setCurrentRpm(frame.rotational_speed_rpm);
      setCurrentAmps(frame.current_draw_amps);
      setCurrentAcousticDb(frame.acoustic_db);

      if (frame.iso_10816_zone) setIsoZone(frame.iso_10816_zone);
      setEquipmentHealthIndex((frame as any).equipment_health_index ?? Math.max(10, Math.round(100 - (frame.risk_score || 0))));

      if (frame.vibration_rms_mms > 4.5 || frame.bearing_temperature_c > 95.0) {
        setOperationalState("Critical");
        setEstimatedTimeToMaintenance("Under 4 Hours");
      } else if (frame.vibration_rms_mms > 2.8 || frame.bearing_temperature_c > 80.0) {
        setOperationalState("Degraded");
        setEstimatedTimeToMaintenance("24-48 Hours");
      } else {
        setOperationalState("Nominal");
        setEstimatedTimeToMaintenance("> 500 Hours");
      }

      if (frame.is_anomaly) {
        let comp = "Impeller Blade Assembly";
        let mech = "Vapor Cavitation Erosion";
        let action = "Throttle discharge valve and backwash suction strainer basket.";

        if (frame.bearing_temperature_c > 75.0 && frame.vibration_rms_mms > 2.8) {
          comp = "Deep Groove Ball Bearing 6205";
          mech = "Lubricant Starvation & Raceway Fatigue";
          action = "Isolate MCC 480V breaker and replenish Mobilith SHC 220 grease.";
        } else if (frame.current_draw_amps > 18.0 && frame.bearing_temperature_c > 70.0 && frame.vibration_rms_mms < 2.8) {
          comp = "Stator Winding Assembly";
          mech = "Electrical Phase Overload";
          action = "Inspect motor chiller circuit differential and audit VFD phase currents.";
        } else if (frame.vibration_rms_mms > 2.8 && (frame.rotational_speed_rpm > 1500 || frame.machine_id?.includes("CNC"))) {
          comp = "High-Speed Spindle Shaft";
          mech = "Dynamic Unbalance & Misalignment";
          action = "Perform dial indicator runout check (TIR <= 2 µm) and clean taper.";
        }

        setDiagnosedFault({
          diagnosed_component: comp,
          failure_mechanism: mech,
          failure_mode: mech,
          recommended_action: action,
          is_anomaly: true,
        });
      }
    }
  }, [stream.latestFrame]);

  // Telemetry points for charts
  const points = useMemo(() => {
    if (stream.telemetryBuffer.length > 0) return stream.telemetryBuffer;
    return staticPoints;
  }, [stream.telemetryBuffer, staticPoints]);

  // Combined anomalies
  const anomalies = useMemo(() => {
    if (stream.anomalyTimeline.length > 0) return stream.anomalyTimeline;
    return staticAnomalies;
  }, [stream.anomalyTimeline, staticAnomalies]);

  // Handle CSV upload completion
  const handleUploadComplete = useCallback((data: any) => {
    setHasDataLoaded(true);
    const anomaliesData = data.anomaly_detection || {};
    const machine = data.metadata?.machine_id || "PUMP-01";
    setSelectedMachineId(machine);

    setEquipmentHealthIndex(anomaliesData.equipment_health_index ?? 78.5);
    setOperationalState(anomaliesData.overall_state || "Degraded");
    setIsoZone(anomaliesData.iso_10816_zone || "Zone C (Warning)");

    if (anomaliesData.overall_state === "Critical") {
      setEstimatedTimeToMaintenance("Under 6 Hours");
    } else if (anomaliesData.overall_state === "Degraded") {
      setEstimatedTimeToMaintenance("24-48 Hours");
    } else {
      setEstimatedTimeToMaintenance("> 500 Hours");
    }

    if (anomaliesData.diagnosed_component) {
      setDiagnosedFault({
        diagnosed_component: anomaliesData.diagnosed_component,
        failure_mechanism: anomaliesData.failure_mechanism,
        failure_mode: anomaliesData.failure_mode || anomaliesData.failure_mechanism,
        recommended_action: anomaliesData.recommended_action,
        is_anomaly: true,
      });
    }

    if (anomaliesData.anomaly_timeline) {
      const timelinePoints: TelemetryPoint[] = anomaliesData.anomaly_timeline.map((item: any) => ({
        time: formatTimestamp(item.timestamp),
        timestamp: formatTimestamp(item.timestamp),
        vibration_rms: item.vibration_rms_mms ?? 2.8,
        bearing_temp: item.bearing_temperature_c ?? 75.0,
        rpm: item.rotational_speed_rpm ?? 1750,
        current_amps: item.current_draw_amps ?? 115.0,
        acoustic_db: item.acoustic_db ?? 74.0,
        is_anomaly: item.is_anomaly,
        anomaly_score: item.risk_score,
      }));
      setStaticPoints(timelinePoints);

      const latest = timelinePoints[timelinePoints.length - 1];
      if (latest) {
        setCurrentVibration(latest.vibration_rms);
        setCurrentBearingTemp(latest.bearing_temp);
        setCurrentRpm(latest.rpm);
        setCurrentAmps(latest.current_amps);
        setCurrentAcousticDb(latest.acoustic_db);
      }

      const anomRecords: AnomalyRecord[] = anomaliesData.anomaly_timeline
        .filter((item: any) => item.is_anomaly)
        .map((item: any) => ({
          timestamp: formatTimestamp(item.timestamp),
          machine_id: machine,
          is_anomaly: true,
          risk_score: item.risk_score,
          iso_10816_zone: item.iso_10816_zone,
          thermal_status: item.thermal_status,
          primary_contributor: item.primary_contributor,
          affected_metrics: item.affected_metrics || [],
        }));
      setStaticAnomalies(anomRecords);
    }

    if (anomaliesData.sensor_contribution_rankings) {
      setSensorContributions(anomaliesData.sensor_contribution_rankings);
    }
  }, []);

  // Quick load sample dataset
  const handleLoadSample = useCallback(async (sampleFileName: string, label: string) => {
    setIsIngesting(true);
    try {
      const res = await fetch(`/samples/${sampleFileName}`);
      if (!res.ok) throw new Error(`Sample file ${sampleFileName} not found.`);
      const csvBlob = await res.blob();
      const file = new File([csvBlob], sampleFileName, { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE_URL}/api/v1/telemetry/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload processing failed");
      const result = await uploadRes.json();
      handleUploadComplete(result);
    } catch (err) {
      console.error(`Failed to load ${label}:`, err);
    } finally {
      setIsIngesting(false);
    }
  }, [handleUploadComplete]);

  const handleClearData = () => {
    stream.pause();
    stream.reset();
    setHasDataLoaded(false);
    setStaticPoints([]);
    setStaticAnomalies([]);
    setSensorContributions([]);
    setCurrentVibration(null);
    setCurrentBearingTemp(null);
    setCurrentRpm(null);
    setCurrentAmps(null);
    setCurrentAcousticDb(null);
    setEquipmentHealthIndex(null);
    setOperationalState("Standby");
    setIsoZone("Standby (Awaiting Sensor Telemetry)");
    setEstimatedTimeToMaintenance("Awaiting Sensor Telemetry");
    setDiagnosedFault(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 mb-1">
            <Radio className="w-3.5 h-3.5" />
            <span>Interactive Industrial Sandbox</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Plant Operations & Telemetry Sandbox
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stream, upload, and test multi-channel machine sensor telemetry with real-time ISO 10816 zoning and ML anomaly detection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {hasDataLoaded && (
            <button
              onClick={handleClearData}
              className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              Reset to Zero-State
            </button>
          )}

          <button
            onClick={() => setIsTicketModalOpen(true)}
            disabled={!hasDataLoaded}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-all ${
              hasDataLoaded
                ? "bg-slate-900 hover:bg-slate-800 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Export Work Order</span>
          </button>

          <Link
            href="/copilot"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all"
          >
            <BrainCircuit className="w-4 h-4" />
            <span>AI Copilot</span>
          </Link>
        </div>
      </div>

      {/* Machinery Explanations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PUMP-01 Machine Card */}
        <div
          onClick={() => setSelectedMachineId("PUMP-01")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedMachineId === "PUMP-01"
              ? "bg-white border-teal-500 ring-2 ring-teal-500/20 shadow-sm"
              : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-teal-100 text-teal-800">
                PUMP-01
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Centrifugal Slurry Booster Pump</h3>
            </div>
            {selectedMachineId === "PUMP-01" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                Active In Sandbox
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            <strong>What it does in plain language:</strong> A high-capacity centrifugal pump that transports dense, abrasive ore slurry through mineral refinery pipes. Operates under extreme fluid turbulence and suction vacuum.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span><strong>Primary Risk:</strong> Impeller Vapor Cavitation</span>
            <span>•</span>
            <span><strong>Max Speed:</strong> 1,750 RPM</span>
          </div>
        </div>

        {/* CNC-SPINDLE-01 Machine Card */}
        <div
          onClick={() => setSelectedMachineId("CNC-SPINDLE-01")}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            selectedMachineId === "CNC-SPINDLE-01"
              ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-100 text-amber-800">
                CNC-SPINDLE-01
              </span>
              <h3 className="font-bold text-slate-900 text-sm">HSK-A63 Milling Spindle</h3>
            </div>
            {selectedMachineId === "CNC-SPINDLE-01" && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Active In Sandbox
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            <strong>What it does in plain language:</strong> A ultra-precise electric motorized spindle running up to 24,000 RPM. Spins cutting tools to machine complex titanium turbine blades and aluminum aerospace dies.
          </p>
          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span><strong>Primary Risk:</strong> Ceramic Bearing Lubricant Breakdown</span>
            <span>•</span>
            <span><strong>Max Speed:</strong> 24,000 RPM</span>
          </div>
        </div>
      </div>

      {/* Ingestion & Quick-Load Toolbar */}
      <div className="industrial-card p-5 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Upload className="w-4 h-4 text-slate-700" />
              <span>Telemetry Ingestion & Presets</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload custom plant telemetry CSV or instantly load pre-recorded failure runs.
            </p>
          </div>

          {/* Quick-Load Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadSample("centrifugal_pump_cavitation.csv", "PUMP-01 Cavitation Run")}
              disabled={isIngesting}
              className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <span>Load: PUMP-01 Cavitation Run</span>
            </button>

            <button
              onClick={() => handleLoadSample("cnc_spindle_overheat_vibration.csv", "CNC-SPINDLE-01 Bearing Wear")}
              disabled={isIngesting}
              className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <span>Load: CNC-SPINDLE-01 Bearing Wear</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Component */}
        <CsvUploader
          apiBaseUrl={API_BASE_URL}
          onAnalysisComplete={handleUploadComplete}
          isLoading={isIngesting}
          setIsLoading={setIsIngesting}
        />
      </div>

      {/* Live Stream Playback Engine */}
      <StreamControls
        connectionState={stream.connectionState}
        isPlaying={stream.isPlaying}
        selectedScenario={stream.scenario}
        speedMultiplier={stream.speedMultiplier}
        currentTick={stream.currentTick}
        totalTicks={stream.totalTicks}
        disabled={false}
        onPlay={() => {
          setHasDataLoaded(true);
          stream.play();
        }}
        onPause={stream.pause}
        onReset={stream.reset}
        onSelectScenario={(scenId) => {
          setHasDataLoaded(true);
          stream.setScenario(scenId);
        }}
        onSelectSpeed={stream.setSpeed}
        onSeek={stream.seek}
        onReconnect={stream.reconnect}
      />

      {/* Emergency Alert Banner if Critical */}
      {operationalState === "Critical" && currentVibration !== null && currentBearingTemp !== null && (
        <EmergencyBanner
          isCritical={true}
          machineId={selectedMachineId}
          primaryOffendingSensor={currentVibration > 4.5 ? "Vibration Velocity RMS" : "Bearing Temperature"}
          offendingValue={currentVibration > 4.5 ? currentVibration.toFixed(2) : currentBearingTemp.toFixed(1)}
          offendingUnit={currentVibration > 4.5 ? "mm/s" : "°C"}
          alerts={[`ISO 10816 ${isoZone} Excursion`]}
          onOpenWorkOrder={() => setIsTicketModalOpen(true)}
        />
      )}

      {/* Zero-State Standby Screen or Active Dashboard */}
      {!hasDataLoaded ? (
        <div className="industrial-card p-12 rounded-2xl text-center border-dashed border-2 border-slate-300 bg-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Upload className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">
              Awaiting Telemetry Data — Upload CSV to begin analysis
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              No machine telemetry is currently loaded into memory. Click one of the quick-load buttons above (e.g. <em>PUMP-01 Cavitation Run</em>) or drag and drop a factory sensor CSV file.
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => handleLoadSample("centrifugal_pump_cavitation.csv", "PUMP-01 Cavitation Run")}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
            >
              Quick-Load PUMP-01 Cavitation
            </button>
            <button
              onClick={() => handleLoadSample("cnc_spindle_overheat_vibration.csv", "CNC-SPINDLE-01 Bearing Wear")}
              className="px-4 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-xs"
            >
              Quick-Load CNC Spindle Wear
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Key Engineering Finding Top Banner */}
          {diagnosedFault && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-black flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Key Engineering Finding
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-semibold text-slate-600">Asset: {selectedMachineId}</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                    Diagnosed Part: <span className="text-amber-700">{diagnosedFault.diagnosed_component}</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Failure Mechanism: <strong>{diagnosedFault.failure_mode || diagnosedFault.failure_mechanism}</strong> — {diagnosedFault.recommended_action}
                  </p>
                </div>
              </div>

              <Link
                href="/copilot"
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shrink-0 shadow-xs"
              >
                <span>Inspect in AI Copilot</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            </div>
          )}

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Vibration Velocity RMS"
              value={currentVibration !== null ? currentVibration.toFixed(2) : "--"}
              unit="mm/s"
              status={
                currentVibration === null
                  ? "nominal"
                  : currentVibration > 4.5
                  ? "critical"
                  : currentVibration > 2.8
                  ? "warning"
                  : "nominal"
              }
              subtext={isoZone}
              iconName="gauge"
            />
            <MetricCard
              label="Bearing Housing Temp"
              value={currentBearingTemp !== null ? currentBearingTemp.toFixed(1) : "--"}
              unit="°C"
              status={
                currentBearingTemp === null
                  ? "nominal"
                  : currentBearingTemp > 95
                  ? "critical"
                  : currentBearingTemp > 80
                  ? "warning"
                  : "nominal"
              }
              subtext={currentBearingTemp && currentBearingTemp > 80 ? "Thermal Warning" : "Normal Envelope"}
              iconName="flame"
            />
            <MetricCard
              label="Shaft Rotational Speed"
              value={currentRpm !== null ? Math.round(currentRpm) : "--"}
              unit="RPM"
              status="nominal"
              subtext="Synchronous Speed Target"
              iconName="rpm"
            />
            <MetricCard
              label="Equipment Health Index"
              value={equipmentHealthIndex !== null ? equipmentHealthIndex.toFixed(0) : "--"}
              unit="%"
              status={
                equipmentHealthIndex === null
                  ? "nominal"
                  : equipmentHealthIndex < 60
                  ? "critical"
                  : equipmentHealthIndex < 80
                  ? "warning"
                  : "nominal"
              }
              subtext={`Condition: ${operationalState}`}
              iconName="zap"
            />
          </div>

          {/* Plant Floor Status Gauges */}
          {currentVibration !== null && currentBearingTemp !== null && currentAcousticDb !== null && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <VibrationGauge value={currentVibration} />
              <ThermalGauge value={currentBearingTemp} />
              <AcousticGauge value={currentAcousticDb} />
            </div>
          )}

          {/* Dynamic Multi-Channel Telemetry Chart */}
          <div className="industrial-card p-5 rounded-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-teal-600" />
                  <span>Dynamic Telemetry Waveforms & Shaded Anomaly Bands</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time sensor trend with shaded anomaly windows for ISO 10816 Zone C/D excursions.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                Buffer: {points.length} data frames
              </span>
            </div>

            <TelemetryChart
              data={points}
              sensorContributions={sensorContributions}
              machineId={selectedMachineId}
            />
          </div>

          {/* Anomaly Table */}
          <div className="industrial-card p-5 rounded-xl">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Anomaly Detection Event Log ({anomalies.length} Recorded)</span>
            </h2>
            <AnomalyTable anomalies={anomalies} />
          </div>
        </>
      )}

      {/* Ticket Export Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        machineId={selectedMachineId}
        operationalState={operationalState}
        sensorSnapshot={{
          vibration_rms_mms: currentVibration ?? 1.2,
          bearing_temperature_c: currentBearingTemp ?? 62.0,
          rotational_speed_rpm: currentRpm ?? 1750,
          current_draw_amps: currentAmps ?? 115.0,
          acoustic_db: currentAcousticDb ?? 70.0,
        }}
        alerts={anomalies.slice(0, 3).map((a) => `${a.iso_10816_zone} excursion on ${a.primary_contributor}`)}
        isoZone={isoZone}
        apiBaseUrl={API_BASE_URL}
      />
    </div>
  );
}
