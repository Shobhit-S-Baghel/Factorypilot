"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { TelemetryChart, TelemetryPoint, SensorContributionData } from "@/components/TelemetryChart";
import { AnomalyTable, AnomalyRecord } from "@/components/AnomalyTable";
import { DiagnosticChat } from "@/components/DiagnosticChat";
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
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("PUMP-01");
  const [backendStatus, setBackendStatus] = useState<string>("connecting");
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState<boolean>(false);

  // Zero-state initialization flag
  const [hasDataLoaded, setHasDataLoaded] = useState<boolean>(false);
  const [diagnosedFault, setDiagnosedFault] = useState<{
    diagnosed_component?: string;
    failure_mechanism?: string;
    recommended_action?: string;
    is_anomaly?: boolean;
  } | null>(null);

  // Machine state initialized to standby / zero-state
  const [equipmentHealthIndex, setEquipmentHealthIndex] = useState<number | null>(null);
  const [operationalState, setOperationalState] = useState<string>("Standby");
  const [isoZone, setIsoZone] = useState<string>("Standby (Awaiting Sensor Telemetry)");
  const [estimatedTimeToMaintenance, setEstimatedTimeToMaintenance] = useState<string>("Awaiting Sensor Telemetry");

  // Telemetry metrics initialized to null
  const [currentVibration, setCurrentVibration] = useState<number | null>(null);
  const [currentBearingTemp, setCurrentBearingTemp] = useState<number | null>(null);
  const [currentRpm, setCurrentRpm] = useState<number | null>(null);
  const [currentAmps, setCurrentAmps] = useState<number | null>(null);
  const [currentAcousticDb, setCurrentAcousticDb] = useState<number | null>(null);

  // Time-series points and anomalies initialized empty
  const [staticPoints, setStaticPoints] = useState<TelemetryPoint[]>([]);
  const [staticAnomalies, setStaticAnomalies] = useState<AnomalyRecord[]>([]);
  const [sensorContributions, setSensorContributions] = useState<SensorContributionData[]>([]);

  // Hook into live WebSocket telemetry stream (autoStart: false for zero-state)
  const stream = useTelemetryStream({
    defaultScenario: "centrifugal_pump_cavitation",
    defaultSpeed: 1,
    bufferSize: 60,
    autoStart: false,
  });

  // Check backend health periodically
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

  // When live telemetry frame arrives from WebSocket, sync local dashboard state
  useEffect(() => {
    if (stream.latestFrame) {
      setHasDataLoaded(true);
      const frame = stream.latestFrame;

      if (frame.machine_id) {
        setSelectedMachineId(frame.machine_id);
      }

      const vib = frame.vibration_rms_mms;
      const temp = frame.bearing_temperature_c;
      const rpm = frame.rotational_speed_rpm;
      const amps = frame.current_draw_amps;
      const acoustic = frame.acoustic_db;

      setCurrentVibration(vib);
      setCurrentBearingTemp(temp);
      setCurrentRpm(rpm);
      setCurrentAmps(amps);
      setCurrentAcousticDb(acoustic);

      if (frame.iso_10816_zone) {
        setIsoZone(frame.iso_10816_zone);
      }

      // Compute operational state
      const isCritical =
        vib > 7.1 ||
        temp > 95.0 ||
        frame.iso_10816_zone?.includes("Zone D") ||
        (frame.is_anomaly && frame.risk_score >= 85);

      const isDegraded =
        !isCritical &&
        (vib >= 2.8 ||
          temp >= 80.0 ||
          acoustic > 85.0 ||
          frame.iso_10816_zone?.includes("Zone C") ||
          frame.is_anomaly);

      if (isCritical) {
        setOperationalState("Critical");
        setEstimatedTimeToMaintenance("IMMEDIATE (< 2 Hours)");
        setEquipmentHealthIndex(Math.max(12, Math.round(100 - (frame.risk_score || 85))));
      } else if (isDegraded) {
        setOperationalState("Degraded");
        setEstimatedTimeToMaintenance("~48-72 Hours (Scheduled)");
        setEquipmentHealthIndex(Math.max(45, Math.round(100 - (frame.risk_score || 45))));
      } else {
        setOperationalState("Nominal");
        setEstimatedTimeToMaintenance("> 1,000 Hours (Nominal)");
        setEquipmentHealthIndex(Math.max(88, Math.round(100 - (frame.risk_score || 8))));
      }

      // Dynamic sensor contribution ranking update
      const totalScore = (vib / 7.1) + (temp / 80) + (acoustic / 85) + (amps / 120);
      setSensorContributions([
        {
          sensor_channel: "vibration_rms_mms",
          contribution_score: Number(((vib / 7.1) / totalScore).toFixed(2)),
          current_value: Number(vib.toFixed(2)),
          unit: "mm/s",
        },
        {
          sensor_channel: "bearing_temperature_c",
          contribution_score: Number(((temp / 80) / totalScore).toFixed(2)),
          current_value: Number(temp.toFixed(1)),
          unit: "°C",
        },
        {
          sensor_channel: "acoustic_db",
          contribution_score: Number(((acoustic / 85) / totalScore).toFixed(2)),
          current_value: Number(acoustic.toFixed(1)),
          unit: "dB",
        },
        {
          sensor_channel: "current_draw_amps",
          contribution_score: Number(((amps / 120) / totalScore).toFixed(2)),
          current_value: Number(amps.toFixed(1)),
          unit: "Amps",
        },
      ]);
    }
  }, [stream.latestFrame]);

  // Determine active telemetry points (rolling 60 points if streaming, else fallback)
  const activeTelemetryPoints = useMemo(() => {
    if (!hasDataLoaded) {
      return [];
    }
    if (stream.telemetryBuffer && stream.telemetryBuffer.length > 0) {
      return stream.telemetryBuffer;
    }
    return staticPoints;
  }, [hasDataLoaded, stream.telemetryBuffer, staticPoints]);

  // Determine active anomaly records
  const activeAnomalyRecords = useMemo(() => {
    if (!hasDataLoaded) {
      return [];
    }
    if (stream.anomalyTimeline && stream.anomalyTimeline.length > 0) {
      return stream.anomalyTimeline;
    }
    return staticAnomalies;
  }, [hasDataLoaded, stream.anomalyTimeline, staticAnomalies]);

  // Compute shaded anomaly ranges for Recharts
  const anomalyRanges = useMemo(() => {
    if (!hasDataLoaded || activeTelemetryPoints.length === 0) {
      return [];
    }
    const anomPoints = activeTelemetryPoints.filter((p) => p.is_anomaly);
    if (anomPoints.length > 0) {
      return [
        {
          start: anomPoints[0].time,
          end: anomPoints[anomPoints.length - 1].time,
          severity: (operationalState === "Critical" ? "critical" : "warning") as "critical" | "warning",
        },
      ];
    }
    return [];
  }, [hasDataLoaded, activeTelemetryPoints, operationalState]);

  // Determine primary offending sensor for emergency alert
  const primaryOffendingSensorInfo = useMemo(() => {
    const vib = currentVibration ?? 0;
    const temp = currentBearingTemp ?? 0;
    const acoustic = currentAcousticDb ?? 0;

    if (vib > 7.1) {
      return { channel: "vibration_rms_mms", value: vib.toFixed(2), unit: "mm/s" };
    }
    if (temp > 80.0) {
      return { channel: "bearing_temperature_c", value: temp.toFixed(1), unit: "°C" };
    }
    if (acoustic > 85.0) {
      return { channel: "acoustic_db", value: acoustic.toFixed(1), unit: "dB" };
    }
    if (vib >= 2.8) {
      return { channel: "vibration_rms_mms", value: vib.toFixed(2), unit: "mm/s" };
    }
    return { channel: "vibration_rms_mms", value: vib.toFixed(2), unit: "mm/s" };
  }, [currentVibration, currentBearingTemp, currentAcousticDb]);

  // Handle uploaded CSV analysis response
  const handleAnalysisComplete = (result: any) => {
    if (!result) return;
    setHasDataLoaded(true);

    if (result.machine_id) setSelectedMachineId(result.machine_id);
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
    if (result.iso_10816_zone) setIsoZone(result.iso_10816_zone);

    if (result.diagnosed_component) {
      setDiagnosedFault({
        diagnosed_component: result.diagnosed_component,
        failure_mechanism: result.failure_mechanism,
        recommended_action: result.recommended_action,
        is_anomaly:
          result.overall_state !== "Nominal" ||
          (result.anomalous_data_points && result.anomalous_data_points > 0),
      });
    }

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

    // Match anomalies with timestamps
    const anomalyMap = new Map<string, any>();
    if (result.anomaly_timeline && Array.isArray(result.anomaly_timeline)) {
      result.anomaly_timeline.forEach((item: any) => {
        anomalyMap.set(String(item.timestamp), item);
      });
      setStaticAnomalies(result.anomaly_timeline);
    }

    if (result.records && Array.isArray(result.records) && result.records.length > 0) {
      const points: TelemetryPoint[] = result.records.map((r: any) => {
        const anom = anomalyMap.get(String(r.timestamp));
        return {
          time: formatTimestamp(r.timestamp),
          timestamp: String(r.timestamp),
          vibration_rms: Number(r.vibration_rms_mms ?? 0),
          bearing_temp: Number(r.bearing_temperature_c ?? 0),
          rpm: Number(r.rotational_speed_rpm ?? 0),
          current_amps: Number(r.current_draw_amps ?? 0),
          acoustic_db: Number(r.acoustic_db ?? 0),
          is_anomaly: anom ? anom.is_anomaly : false,
          anomaly_score: anom ? anom.anomaly_score : 0,
        };
      });
      setStaticPoints(points);

      if (points.length > 0) {
        const last = points[points.length - 1];
        setCurrentVibration(last.vibration_rms);
        setCurrentBearingTemp(last.bearing_temp);
        setCurrentRpm(last.rpm);
        setCurrentAmps(last.current_amps);
        setCurrentAcousticDb(last.acoustic_db);
      }
    } else if (result.anomaly_timeline && Array.isArray(result.anomaly_timeline) && result.anomaly_timeline.length > 0) {
      const isCnc = result.machine_id?.includes("CNC");
      const points: TelemetryPoint[] = result.anomaly_timeline.map((item: any) => {
        return {
          time: formatTimestamp(item.timestamp),
          timestamp: String(item.timestamp),
          vibration_rms: item.primary_contributor === "vibration_rms_mms" ? 5.2 : 1.3,
          bearing_temp: item.thermal_status?.includes("Warning") ? 82.5 : 59.0,
          rpm: isCnc ? 24000 : 1745,
          current_amps: isCnc ? 21.0 : 128.0,
          acoustic_db: item.primary_contributor === "acoustic_db" ? 92.0 : 71.0,
          is_anomaly: item.is_anomaly,
          anomaly_score: item.anomaly_score,
        };
      });
      setStaticPoints(points);

      if (points.length > 0) {
        const last = points[points.length - 1];
        setCurrentVibration(last.vibration_rms);
        setCurrentBearingTemp(last.bearing_temp);
        setCurrentRpm(last.rpm);
        setCurrentAmps(last.current_amps);
        setCurrentAcousticDb(last.acoustic_db);
      }
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 stroke-emerald-500";
    if (score >= 50) return "text-amber-500 stroke-amber-500";
    return "text-rose-600 stroke-rose-500";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-teal-500 selection:text-white">
      {/* 1. Sticky Header */}
      <Header
        selectedMachineId={selectedMachineId}
        onSelectMachine={(id) => {
          setSelectedMachineId(id);
          // Auto-select corresponding scenario
          if (id === "CNC-SPINDLE-01") {
            stream.setScenario("cnc_spindle_bearing_wear");
          } else {
            stream.setScenario("centrifugal_pump_cavitation");
          }
        }}
        backendStatus={stream.connectionState === "Live" ? "healthy" : backendStatus}
        equipmentHealth={equipmentHealthIndex ?? 0}
        operationalState={operationalState}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 2. Emergency Alert Ribbon with Audible/Visual Pulse (Triggers on Critical) */}
        <EmergencyBanner
          isCritical={hasDataLoaded && operationalState === "Critical"}
          machineId={selectedMachineId}
          primaryOffendingSensor={primaryOffendingSensorInfo.channel}
          offendingValue={primaryOffendingSensorInfo.value}
          offendingUnit={primaryOffendingSensorInfo.unit}
          alerts={stream.alerts}
          onOpenWorkOrder={() => setIsTicketModalOpen(true)}
        />

        {/* 3. Real-Time Telemetry Playback Engine & Stream Controls Toolbar */}
        <section>
          <StreamControls
            connectionState={stream.connectionState}
            isPlaying={stream.isPlaying}
            selectedScenario={stream.scenario}
            speedMultiplier={stream.speedMultiplier}
            currentTick={stream.currentTick}
            totalTicks={stream.totalTicks}
            disabled={!hasDataLoaded}
            onPlay={() => {
              if (stream.isPlaying) stream.pause();
              else stream.resume();
            }}
            onPause={stream.pause}
            onReset={stream.reset}
            onSelectScenario={(scenId) => {
              stream.setScenario(scenId);
              const opt = SCENARIO_OPTIONS.find((s) => s.id === scenId);
              if (opt) setSelectedMachineId(opt.machineId);
            }}
            onSelectSpeed={(spd) => stream.setSpeed(spd)}
            onSeek={stream.seek}
            onReconnect={stream.reconnect}
          />
        </section>

        {/* 4. Top-Level Machine Operational Status Banner */}
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
                    className={`transition-all duration-700 ease-out ${
                      equipmentHealthIndex !== null ? getHealthColor(equipmentHealthIndex) : "stroke-slate-200 text-slate-400"
                    }`}
                    strokeWidth="3.5"
                    strokeDasharray={`${equipmentHealthIndex !== null ? equipmentHealthIndex : 0}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-mono tracking-tight text-slate-900">
                    {equipmentHealthIndex !== null ? `${equipmentHealthIndex.toFixed(0)}%` : "--"}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">EHI</span>
                </div>
              </div>

              {/* Status details */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {hasDataLoaded ? selectedMachineId : "STANDBY"}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                    {!hasDataLoaded
                      ? "Machine Asset Monitoring (Standby)"
                      : selectedMachineId === "PUMP-01"
                      ? "Centrifugal Slurry Booster Pump P-101"
                      : "DMG Mori 5-Axis Electro-Spindle SP-300"}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="font-semibold text-slate-900">State:</span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-xs ${
                        !hasDataLoaded
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : operationalState === "Nominal"
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

            {/* Emergency / Safety Tag & Export Work Order Trigger */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-6 text-xs gap-3 shrink-0">
              <button
                disabled={!hasDataLoaded}
                onClick={() => setIsTicketModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                title={!hasDataLoaded ? "Upload telemetry data to export work order" : "Export Maintenance Ticket"}
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Export Work Order</span>
              </button>

              <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span className="font-medium">Safety Standard: OSHA 29 CFR 1910.147</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Plant Floor Status Gauges (Vibration Severity, Thermal Monitor, Acoustic Monitor) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Plant Floor Precision Condition Gauges
              </h2>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Real-Time Sample Rate: {stream.speedMultiplier === 5 ? "50ms" : stream.speedMultiplier === 2 ? "125ms" : "250ms"}
            </span>
          </div>

          {!hasDataLoaded ? (
            <div className="industrial-card p-8 border-2 border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mb-3 shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Standby Mode / Awaiting Sensor Telemetry
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Upload a plant sensor CSV to begin automated telemetry analysis
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Vibration Severity Gauge (Calibrated against ISO 10816-3) */}
              <VibrationGauge value={currentVibration ?? 0} maxScale={12.0} />

              {/* 2. Bearing Thermal Monitor (Color shifts approaching/exceeding 80°C) */}
              <ThermalGauge value={currentBearingTemp ?? 0} threshold={80.0} maxScale={120.0} />

              {/* 3. Acoustic Sensor Monitor (Decibel surges & ultrasonic cavitation) */}
              <AcousticGauge value={currentAcousticDb ?? 0} cavitationThreshold={85.0} maxScale={110.0} />
            </div>
          )}
        </section>

        {/* 6. Metric Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard
            label="Vibration RMS"
            value={hasDataLoaded && currentVibration !== null ? Number(currentVibration.toFixed(2)) : "--"}
            unit="mm/s"
            subtext="ISO 10816 velocity"
            badge={
              !hasDataLoaded
                ? "Standby"
                : (currentVibration ?? 0) >= 7.1
                ? "Zone D (Trip)"
                : (currentVibration ?? 0) >= 2.8
                ? "Zone C (Alert)"
                : "Zone A/B"
            }
            status={
              !hasDataLoaded
                ? "nominal"
                : (currentVibration ?? 0) >= 7.1
                ? "critical"
                : (currentVibration ?? 0) >= 2.8
                ? "warning"
                : "nominal"
            }
            iconName="gauge"
          />

          <MetricCard
            label="Bearing Housing"
            value={hasDataLoaded && currentBearingTemp !== null ? Number(currentBearingTemp.toFixed(1)) : "--"}
            unit="°C"
            subtext="80°C threshold limit"
            badge={
              !hasDataLoaded
                ? "Standby"
                : (currentBearingTemp ?? 0) >= 95
                ? "Critical Trip"
                : (currentBearingTemp ?? 0) >= 80
                ? "Warning (>80°C)"
                : "Normal"
            }
            status={
              !hasDataLoaded
                ? "nominal"
                : (currentBearingTemp ?? 0) >= 95
                ? "critical"
                : (currentBearingTemp ?? 0) >= 80
                ? "warning"
                : "nominal"
            }
            iconName="flame"
          />

          <MetricCard
            label="Rotational Speed"
            value={hasDataLoaded && currentRpm !== null ? Math.round(currentRpm) : "--"}
            unit="RPM"
            subtext={selectedMachineId.includes("CNC") ? "Max 24,000 RPM" : "Nominal 1,750 RPM"}
            badge={hasDataLoaded ? "Locked" : "Standby"}
            status={hasDataLoaded ? "active" : "nominal"}
            iconName="rpm"
          />

          <MetricCard
            label="Current Draw"
            value={hasDataLoaded && currentAmps !== null ? Number(currentAmps.toFixed(1)) : "--"}
            unit="Amps"
            subtext="FLA overload trip @ 125%"
            badge={
              !hasDataLoaded
                ? "Standby"
                : (currentAmps ?? 0) > 18.5 && selectedMachineId.includes("CNC")
                ? "Overload"
                : "In Envelope"
            }
            status={
              !hasDataLoaded
                ? "nominal"
                : (currentAmps ?? 0) > 18.5 && selectedMachineId.includes("CNC")
                ? "warning"
                : "nominal"
            }
            iconName="zap"
          />

          <MetricCard
            label="Acoustic Intensity"
            value={hasDataLoaded && currentAcousticDb !== null ? Number(currentAcousticDb.toFixed(1)) : "--"}
            unit="dB"
            subtext="Cavitation pinging alarm"
            badge={
              !hasDataLoaded
                ? "Standby"
                : (currentAcousticDb ?? 0) > 85
                ? "Cavitation Alert"
                : "Normal"
            }
            status={
              !hasDataLoaded
                ? "nominal"
                : (currentAcousticDb ?? 0) > 85
                ? "critical"
                : "nominal"
            }
            iconName="volume"
          />
        </section>

        {/* 7. Ingestion Panel & Dataset Selector */}
        <section>
          <CsvUploader
            apiBaseUrl={API_BASE_URL}
            onAnalysisComplete={handleAnalysisComplete}
            isLoading={isIngesting}
            setIsLoading={setIsIngesting}
          />
        </section>

        {/* 8. Synchronized Multi-Metric Time-Series & AI Copilot Split */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Charts & Anomaly Log (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <TelemetryChart
              data={activeTelemetryPoints}
              anomalyRanges={anomalyRanges}
              sensorContributions={sensorContributions}
              machineId={selectedMachineId}
            />

            <AnomalyTable
              anomalies={activeAnomalyRecords}
              onSelectAnomaly={(anom) => {
                console.log("Selected anomaly to diagnose:", anom);
              }}
            />
          </div>

          {/* Right Column: AI Diagnostics & Field Assistant Dock (5 cols) */}
          <div className="lg:col-span-5">
            <DiagnosticChat
              apiBaseUrl={API_BASE_URL}
              machineId={selectedMachineId}
              diagnosedFault={diagnosedFault}
              currentAnomalySummary={{
                vibration_rms_mms: currentVibration ?? 0,
                bearing_temperature_c: currentBearingTemp ?? 0,
                iso_10816_zone: isoZone,
                acoustic_db: currentAcousticDb ?? 0,
                primary_contributor: sensorContributions[0]?.sensor_channel || "vibration_rms_mms",
                diagnosed_component: diagnosedFault?.diagnosed_component,
                is_anomaly: operationalState !== "Nominal" && hasDataLoaded,
              }}
            />
          </div>
        </section>
      </main>

      {/* 9. Maintenance Work Order Export Action Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        machineId={selectedMachineId}
        operationalState={operationalState}
        sensorSnapshot={{
          vibration_rms_mms: currentVibration ?? 0,
          bearing_temperature_c: currentBearingTemp ?? 0,
          rotational_speed_rpm: currentRpm ?? 0,
          current_draw_amps: currentAmps ?? 0,
          acoustic_db: currentAcousticDb ?? 0,
        }}
        alerts={stream.alerts}
        timestamp={stream.latestFrame?.timestamp}
        isoZone={isoZone}
        primaryContributor={primaryOffendingSensorInfo.channel}
        apiBaseUrl={API_BASE_URL}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span suppressHydrationWarning>FactoryPilot &copy; {new Date().getFullYear()} &mdash; Production Industrial Diagnostics & Vector RAG Architecture</span>
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
