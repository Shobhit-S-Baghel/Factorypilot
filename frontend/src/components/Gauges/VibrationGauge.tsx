"use client";

import React from "react";
import { Gauge, AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

interface VibrationGaugeProps {
  value: number; // in mm/s
  maxScale?: number; // default 12.0 mm/s
}

export const VibrationGauge: React.FC<VibrationGaugeProps> = ({
  value,
  maxScale = 12.0,
}) => {
  const safeVal = Math.max(0, Math.min(value, maxScale));
  const percent = Math.min(100, Math.round((safeVal / maxScale) * 100));

  // ISO 10816-3 Zones:
  // Zone A/B: < 2.8 mm/s (Green - Nominal)
  // Zone C: 2.8 - 7.1 mm/s (Amber - Restricted Operation / Alert)
  // Zone D: > 7.1 mm/s (Red - Critical Danger / Trip)
  const isGreen = safeVal < 2.8;
  const isAmber = safeVal >= 2.8 && safeVal <= 7.1;
  const isRed = safeVal > 7.1;

  const getZoneDetails = () => {
    if (isRed) {
      return {
        zone: "Zone D (Critical Trip)",
        color: "text-rose-600",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        barColor: "bg-rose-500",
        strokeColor: "#EF4444",
        statusText: "Immediate Shutdown Required",
      };
    }
    if (isAmber) {
      return {
        zone: "Zone C (Warning Alert)",
        color: "text-amber-600",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        barColor: "bg-amber-500",
        strokeColor: "#F59E0B",
        statusText: "Restricted Long-Term Operation",
      };
    }
    return {
      zone: "Zone A/B (Nominal)",
      color: "text-emerald-600",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      barColor: "bg-emerald-500",
      strokeColor: "#10B981",
      statusText: "Continuous Unrestricted Operation",
    };
  };

  const details = getZoneDetails();

  // Calculate needle angle for semi-circle gauge (-90 deg to +90 deg)
  const needleAngle = -90 + (percent / 100) * 180;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient glow when critical */}
      {isRed && (
        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isRed
                ? "bg-rose-100 text-rose-700"
                : isAmber
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Vibration Severity
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">ISO 10816-3 RMS</span>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${details.badgeBg}`}
        >
          {details.zone}
        </span>
      </div>

      {/* Semi-Circle SVG Radial Gauge */}
      <div className="relative w-48 h-28 mx-auto flex items-center justify-center mt-1">
        <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible">
          {/* Arc Background Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Green Zone A/B (< 2.8 mm/s -> 0% to ~23.3%) */}
          <path
            d="M 10 50 A 40 40 0 0 1 28 20"
            fill="none"
            stroke="#10B981"
            strokeWidth="8"
            strokeOpacity="0.4"
          />

          {/* Amber Zone C (2.8 - 7.1 mm/s -> ~23.3% to ~59.1%) */}
          <path
            d="M 28 20 A 40 40 0 0 1 67 15"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="8"
            strokeOpacity="0.4"
          />

          {/* Red Zone D (> 7.1 mm/s -> ~59.1% to 100%) */}
          <path
            d="M 67 15 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#EF4444"
            strokeWidth="8"
            strokeOpacity="0.4"
          />

          {/* Dynamic Value Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={details.strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125.66"
            strokeDashoffset={125.66 - (125.66 * (percent / 100))}
            className="transition-all duration-300 ease-out"
          />

          {/* Pivot point */}
          <circle cx="50" cy="50" r="4" fill="#1E293B" />

          {/* Needle Pointer */}
          <g
            transform={`rotate(${needleAngle} 50 50)`}
            className="transition-transform duration-300 ease-out"
          >
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke="#0F172A"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Big Numerical Reading Overlay */}
        <div className="absolute bottom-0 inset-x-0 flex flex-col items-center">
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-black font-mono tracking-tight ${details.color}`}>
              {value.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-500">mm/s</span>
          </div>
        </div>
      </div>

      {/* ISO Threshold Scale Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex justify-between text-[10px] font-mono font-medium text-slate-400 mb-1">
          <span>0.0</span>
          <span className="text-emerald-600 font-semibold">&lt;2.8 (A/B)</span>
          <span className="text-amber-600 font-semibold">2.8–7.1 (C)</span>
          <span className="text-rose-600 font-semibold">&gt;7.1 (D)</span>
          <span>{maxScale.toFixed(0)}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
          <div className="w-[23.3%] bg-emerald-400" />
          <div className="w-[35.8%] bg-amber-400" />
          <div className="w-[40.9%] bg-rose-500" />
        </div>
        <p className="text-[11px] text-center text-slate-500 mt-2 font-medium">
          {details.statusText}
        </p>
      </div>
    </div>
  );
};
