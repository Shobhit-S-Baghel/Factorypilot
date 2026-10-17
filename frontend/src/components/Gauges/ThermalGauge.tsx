"use client";

import React from "react";
import { Flame, AlertOctagon, ShieldAlert, Thermometer } from "lucide-react";

interface ThermalGaugeProps {
  value: number; // in °C
  threshold?: number; // default 80°C limit
  maxScale?: number; // default 120°C
}

export const ThermalGauge: React.FC<ThermalGaugeProps> = ({
  value,
  threshold = 80.0,
  maxScale = 120.0,
}) => {
  const safeVal = Math.max(0, Math.min(value, maxScale));
  const percent = Math.min(100, Math.round((safeVal / maxScale) * 100));
  const thresholdPercent = Math.round((threshold / maxScale) * 100);

  // Temperature zones:
  // < 70°C: Nominal
  // 70 - 80°C: Elevated (approaching limit)
  // 80 - 95°C: Warning (Limit exceeded)
  // > 95°C: Catastrophic Trip
  const isTrip = safeVal >= 95.0;
  const isWarning = safeVal >= threshold && safeVal < 95.0;
  const isApproaching = safeVal >= 70.0 && safeVal < threshold;
  const isNominal = safeVal < 70.0;

  const getThermalStatus = () => {
    if (isTrip) {
      return {
        label: "Catastrophic Trip (>95°C)",
        color: "text-rose-600",
        badgeBg: "bg-rose-100 text-rose-800 border-rose-300",
        barColor: "bg-rose-600",
        stroke: "#E11D48",
        message: "LOTO Advised: Bearing Seizure Risk",
      };
    }
    if (isWarning) {
      return {
        label: "Overheat Warning (>80°C)",
        color: "text-rose-500",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        barColor: "bg-rose-500",
        stroke: "#F43F5E",
        message: "Lubricant breakdown threshold crossed",
      };
    }
    if (isApproaching) {
      return {
        label: "Thermal Buildup (70-80°C)",
        color: "text-amber-500",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        barColor: "bg-amber-500",
        stroke: "#F59E0B",
        message: "Approaching 80°C continuous service limit",
      };
    }
    return {
      label: "Nominal Operating Range",
      color: "text-teal-600",
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      barColor: "bg-teal-500",
      stroke: "#0D9488",
      message: "Hydrodynamic film barrier stable",
    };
  };

  const status = getThermalStatus();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
      {/* Background alert pulse */}
      {isTrip && (
        <div className="absolute inset-0 bg-rose-600/5 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isTrip || isWarning
                ? "bg-rose-100 text-rose-700"
                : isApproaching
                ? "bg-amber-100 text-amber-700"
                : "bg-teal-100 text-teal-700"
            }`}
          >
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Bearing Thermal
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Housing RTD Sensor</span>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${status.badgeBg}`}
        >
          {status.label}
        </span>
      </div>

      {/* Numerical display & thermometer bar */}
      <div className="py-2 flex items-center justify-between space-x-4">
        {/* Big Numerical Reading */}
        <div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-3xl font-black font-mono tracking-tight ${status.color}`}>
              {value.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-500">°C</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {((value * 9) / 5 + 32).toFixed(1)}°F
          </span>
        </div>

        {/* Circular Ring Gauge */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="stroke-slate-100"
              strokeWidth="3.8"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              stroke={status.stroke}
              strokeWidth="3.8"
              strokeDasharray={`${percent}, 100`}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-300 ease-out"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Thermometer className={`w-4 h-4 ${status.color}`} />
            <span className="text-[9px] font-mono text-slate-400 font-bold">{percent}%</span>
          </div>
        </div>
      </div>

      {/* Thermal Gradient Progress Bar with 80°C Limit Marker */}
      <div className="mt-2 pt-3 border-t border-slate-100">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span>0°C</span>
          <span className="text-teal-600 font-semibold">Nominal (&lt;70°C)</span>
          <span className="text-amber-500 font-semibold">Warn (70-80°C)</span>
          <span className="text-rose-600 font-bold">Limit: 80°C</span>
          <span>120°C</span>
        </div>

        <div className="relative w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          {/* Gradient background track */}
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${percent}%`,
              backgroundColor: status.stroke,
            }}
          />
        </div>

        {/* 80°C reference pin */}
        <div className="relative w-full h-2">
          <div
            className="absolute top-0 transform -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${thresholdPercent}%` }}
          >
            <div className="w-0.5 h-2 bg-rose-500" />
            <span className="text-[8px] font-mono font-bold text-rose-600 -mt-0.5">80°C</span>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-2 font-medium">
          {status.message}
        </p>
      </div>
    </div>
  );
};
