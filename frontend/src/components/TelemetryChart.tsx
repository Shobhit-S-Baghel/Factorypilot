"use client";

import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Gauge, AlertTriangle, Layers, BarChart3, Clock } from "lucide-react";

export interface TelemetryPoint {
  time: string;
  timestamp: string;
  vibration_rms: number;
  bearing_temp: number;
  rpm: number;
  current_amps: number;
  acoustic_db: number;
  is_anomaly?: boolean;
  anomaly_score?: number;
}

export interface SensorContributionData {
  sensor_channel: string;
  contribution_score: number;
  current_value: number;
  unit: string;
}

interface TelemetryChartProps {
  data: TelemetryPoint[];
  anomalyRanges?: { start: string; end: string; severity: "warning" | "critical" }[];
  sensorContributions?: SensorContributionData[];
  machineId: string;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  data,
  anomalyRanges = [],
  sensorContributions = [],
  machineId,
}) => {
  const [activeMetrics, setActiveMetrics] = useState({
    vibration: true,
    temperature: true,
    current: true,
    rpm: false,
  });

  const toggleMetric = (key: keyof typeof activeMetrics) => {
    setActiveMetrics((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getBarColor = (score: number) => {
    if (score >= 0.4) return "#EF4444"; // High risk
    if (score >= 0.2) return "#F59E0B"; // Warning
    return "#0D9488"; // Nominal active
  };

  return (
    <div className="space-y-6">
      {/* Time-Series Card */}
      <div className="industrial-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-teal-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Multi-Channel Sensory Telemetry & Anomaly Bands
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              ISO 10816 vibration velocity, thermal threshold ({">"}80°C), and electrical current draw along a synchronized timeline.
            </p>
          </div>

          {/* Metric toggle pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => toggleMetric("vibration")}
              className={`px-2.5 py-1 rounded border transition-colors ${
                activeMetrics.vibration
                  ? "bg-teal-50 border-teal-300 text-teal-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              Vib RMS (mm/s)
            </button>
            <button
              onClick={() => toggleMetric("temperature")}
              className={`px-2.5 py-1 rounded border transition-colors ${
                activeMetrics.temperature
                  ? "bg-amber-50 border-amber-300 text-amber-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              Temp (°C)
            </button>
            <button
              onClick={() => toggleMetric("current")}
              className={`px-2.5 py-1 rounded border transition-colors ${
                activeMetrics.current
                  ? "bg-rose-50 border-rose-300 text-rose-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              Current (A)
            </button>
            <button
              onClick={() => toggleMetric("rpm")}
              className={`px-2.5 py-1 rounded border transition-colors ${
                activeMetrics.rpm
                  ? "bg-slate-100 border-slate-300 text-slate-800 font-semibold"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              RPM / 100
            </button>
          </div>
        </div>

        {/* Multi-channel synchronized chart */}
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                fontFamily="ui-monospace, monospace"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  fontSize: "12px",
                  fontFamily: "ui-monospace, monospace",
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />

              {/* Render semi-transparent shaded bands directly over time ranges where anomalies were detected */}
              {anomalyRanges.map((range, idx) => (
                <ReferenceArea
                  key={idx}
                  x1={range.start}
                  x2={range.end}
                  fill={range.severity === "critical" ? "#EF4444" : "#F59E0B"}
                  fillOpacity={0.18}
                  stroke={range.severity === "critical" ? "#EF4444" : "#F59E0B"}
                  strokeOpacity={0.4}
                  strokeDasharray="2 2"
                  label={{
                    value: "ANOMALY EXCURSION",
                    position: "insideTop",
                    fill: range.severity === "critical" ? "#B91C1C" : "#B45309",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
              ))}

              {activeMetrics.vibration && (
                <Line
                  type="monotone"
                  dataKey="vibration_rms"
                  name="Vibration RMS (mm/s)"
                  stroke="#0D9488"
                  strokeWidth={2.2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {activeMetrics.temperature && (
                <Line
                  type="monotone"
                  dataKey="bearing_temp"
                  name="Bearing Temp (°C)"
                  stroke="#F59E0B"
                  strokeWidth={2.2}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {activeMetrics.current && (
                <Line
                  type="monotone"
                  dataKey="current_amps"
                  name="Current Draw (A)"
                  stroke="#EF4444"
                  strokeWidth={2.0}
                  dot={{ r: 2 }}
                  activeDot={{ r: 5 }}
                />
              )}

              {activeMetrics.rpm && (
                <Line
                  type="monotone"
                  dataKey="rpm"
                  name="Shaft Speed (RPM)"
                  stroke="#64748B"
                  strokeWidth={1.8}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/40 inline-block" />
              <span>Degraded Alert Band</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/40 inline-block" />
              <span>Critical Trip Band</span>
            </span>
          </div>
          <span className="font-mono text-slate-400">Time Window: 5-min rolling window</span>
        </div>
      </div>

      {/* Sensor Contribution Breakdown Card */}
      <div className="industrial-card p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">
              Sensor Contribution & Anomaly Driver Breakdown
            </h3>
          </div>
          <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Attribution Model (Z-Score + Isolation Forest)
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Identifies which physical channels contribute most significantly to the machine&apos;s anomaly risk score.
        </p>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sensorContributions}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                fontSize={11}
                stroke="#94A3B8"
                fontFamily="ui-monospace, monospace"
              />
              <YAxis
                type="category"
                dataKey="sensor_channel"
                fontSize={11}
                stroke="#475569"
                fontFamily="ui-monospace, monospace"
                tickLine={false}
              />
              <Tooltip
                formatter={(value: any) => [`${(Number(value) * 100).toFixed(1)}%`, "Contribution"]}
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontFamily: "ui-monospace, monospace",
                }}
              />
              <Bar dataKey="contribution_score" radius={[0, 4, 4, 0]}>
                {sensorContributions.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.contribution_score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
