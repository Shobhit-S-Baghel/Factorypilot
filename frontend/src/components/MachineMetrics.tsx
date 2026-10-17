"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Flame, Gauge, Zap, Droplets, RefreshCw } from "lucide-react";

export interface TelemetryReading {
  machine_id: string;
  machine_name: string;
  timestamp: string;
  vibration_rms_mm_s: number;
  bearing_temp_celsius: number;
  rpm?: number;
  current_draw_amps?: number;
  coolant_flow_l_min?: number;
  iso_10816_zone: string;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  alerts: string[];
}

interface MachineMetricsProps {
  readings: TelemetryReading[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const MachineMetrics: React.FC<MachineMetricsProps> = ({ readings, onRefresh, isLoading }) => {
  const getZoneBadge = (zone: string) => {
    if (zone.includes("Zone A")) {
      return {
        label: "ISO Zone A (Good)",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      };
    } else if (zone.includes("Zone B")) {
      return {
        label: "ISO Zone B (Acceptable)",
        color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      };
    } else if (zone.includes("Zone C")) {
      return {
        label: "ISO Zone C (Alert)",
        color: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      };
    } else {
      return {
        label: "ISO Zone D (Danger/Trip)",
        color: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400" />
            Live Machine Telemetry & Vibration Severity
          </h2>
          <p className="text-sm text-slate-400">
            Real-time sensory telemetry aligned with ISO 10816 Class II/IV criteria & continuous thermal monitoring.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-industrial-800 hover:bg-industrial-700 text-slate-200 border border-industrial-700 text-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {readings.map((machine) => {
          const zoneInfo = getZoneBadge(machine.iso_10816_zone);
          const isWarning = machine.status !== "NORMAL";
          const tempWarning = machine.bearing_temp_celsius > 80.0;

          return (
            <div
              key={machine.machine_id}
              className={`rounded-xl border p-6 transition-all bg-industrial-900/90 ${
                isWarning ? "border-amber-500/50 glow-amber" : "border-industrial-800 hover:border-industrial-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {machine.machine_id}
                    </span>
                    <h3 className="font-semibold text-lg text-white">{machine.machine_name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Last update: {new Date(machine.timestamp).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-mono font-medium ${zoneInfo.color}`}>
                    {zoneInfo.label}
                  </span>
                  {isWarning ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {machine.status}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      HEALTHY
                    </span>
                  )}
                </div>
              </div>

              {/* Metric Gauges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {/* Vibration */}
                <div className="bg-industrial-950/60 p-3.5 rounded-lg border border-industrial-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Vibration RMS</span>
                    <Gauge className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold font-mono text-white">
                      {machine.vibration_rms_mm_s.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">mm/s</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">ISO 10816 velocity</div>
                </div>

                {/* Thermal */}
                <div className={`p-3.5 rounded-lg border ${
                  tempWarning
                    ? "bg-amber-950/20 border-amber-500/40"
                    : "bg-industrial-950/60 border-industrial-800/80"
                }`}>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Bearing Temp</span>
                    <Flame className={`w-4 h-4 ${tempWarning ? "text-amber-400 animate-pulse" : "text-slate-500"}`} />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold font-mono ${tempWarning ? "text-amber-400" : "text-white"}`}>
                      {machine.bearing_temp_celsius.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">°C</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Threshold: <span className="text-amber-400">80.0°C</span>
                  </div>
                </div>

                {/* RPM */}
                {machine.rpm !== undefined && (
                  <div className="bg-industrial-950/60 p-3.5 rounded-lg border border-industrial-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Shaft Speed</span>
                      <RefreshCw className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-cyan-400">
                        {Math.round(machine.rpm).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">RPM</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {machine.machine_id.includes("CNC") ? "Max 24,000" : "Rated 1,750"}
                    </div>
                  </div>
                )}

                {/* Current Draw */}
                {machine.current_draw_amps !== undefined && (
                  <div className="bg-industrial-950/60 p-3.5 rounded-lg border border-industrial-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Current Draw</span>
                      <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-white">
                        {machine.current_draw_amps.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Amps</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">FLA 18.5A Max</div>
                  </div>
                )}

                {/* Coolant Flow */}
                {machine.coolant_flow_l_min !== undefined && (
                  <div className="bg-industrial-950/60 p-3.5 rounded-lg border border-industrial-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Coolant Flow</span>
                      <Droplets className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-white">
                        {machine.coolant_flow_l_min.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">L/min</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Min 20.0 L/min</div>
                  </div>
                )}
              </div>

              {/* Alerts Drawer */}
              {machine.alerts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-industrial-800/80">
                  <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Active Industrial Advisory
                  </div>
                  <div className="space-y-1.5">
                    {machine.alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className="text-xs font-mono text-amber-200 bg-amber-500/10 px-3 py-1.5 rounded border border-amber-500/20"
                      >
                        {alert}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
