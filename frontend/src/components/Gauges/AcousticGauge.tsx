"use client";

import React from "react";
import { Volume2, VolumeX, AlertTriangle, Radio } from "lucide-react";

interface AcousticGaugeProps {
  value: number; // in dB
  cavitationThreshold?: number; // default 85.0 dB
  maxScale?: number; // default 110.0 dB
}

export const AcousticGauge: React.FC<AcousticGaugeProps> = ({
  value,
  cavitationThreshold = 85.0,
  maxScale = 110.0,
}) => {
  const safeVal = Math.max(40, Math.min(value, maxScale));
  // Map 40-110 dB to 0-100%
  const percent = Math.min(100, Math.max(0, Math.round(((safeVal - 40) / (maxScale - 40)) * 100)));

  const isCavitation = safeVal >= cavitationThreshold;
  const isElevated = safeVal >= 80.0 && safeVal < cavitationThreshold;

  // 12 LED segments for the VU meter
  const numSegments = 12;
  const activeSegments = Math.round((percent / 100) * numSegments);

  const getStatus = () => {
    if (isCavitation) {
      return {
        label: "Cavitation Surge (>85 dB)",
        color: "text-rose-600",
        badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
        statusText: "High-frequency bubble collapse shockwaves detected",
      };
    }
    if (isElevated) {
      return {
        label: "Elevated Acoustics (80-85 dB)",
        color: "text-amber-500",
        badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
        statusText: "Suction head turbulence or incipient cavitation",
      };
    }
    return {
      label: "Baseline Flow Noise",
      color: "text-teal-600",
      badgeBg: "bg-teal-50 text-teal-700 border-teal-200",
      statusText: "Hydraulic flow envelope within normal decibel limits",
    };
  };

  const status = getStatus();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
      {isCavitation && (
        <div className="absolute inset-0 bg-rose-500/5 pointer-events-none animate-pulse" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isCavitation
                ? "bg-rose-100 text-rose-700"
                : isElevated
                ? "bg-amber-100 text-amber-700"
                : "bg-teal-100 text-teal-700"
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Acoustic Intensity
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Ultrasonic Cavitation</span>
          </div>
        </div>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${status.badgeBg}`}
        >
          {status.label}
        </span>
      </div>

      {/* Numerical display + VU meter */}
      <div className="py-2 flex items-center justify-between">
        <div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-3xl font-black font-mono tracking-tight ${status.color}`}>
              {value.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-500">dB</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {isCavitation ? "⚠️ Ping Frequency: 18.4 kHz" : "Baseline: 1.2 kHz - 4.5 kHz"}
          </span>
        </div>

        {/* LED Segment Bar VU Meter */}
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-end space-x-1 h-12 px-2 bg-slate-50 rounded-lg border border-slate-200 py-1.5">
            {Array.from({ length: numSegments }).map((_, i) => {
              const isActive = i < activeSegments;
              const isDangerSegment = i >= 8; // top segments >85 dB
              const isWarningSegment = i >= 6 && i < 8; // 80-85 dB

              let barColor = "bg-slate-200";
              if (isActive) {
                if (isDangerSegment) barColor = "bg-rose-500 shadow-sm";
                else if (isWarningSegment) barColor = "bg-amber-500";
                else barColor = "bg-teal-500";
              }

              return (
                <div
                  key={i}
                  className={`w-1.5 rounded-sm transition-all duration-150 ${barColor}`}
                  style={{ height: `${20 + (i / numSegments) * 80}%` }}
                />
              );
            })}
          </div>
          <span className="text-[9px] font-mono font-semibold text-slate-400">VU SURGE</span>
        </div>
      </div>

      {/* Decibel thresholds */}
      <div className="mt-2 pt-3 border-t border-slate-100">
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span>40 dB</span>
          <span className="text-teal-600 font-semibold">&lt;80 dB Safe</span>
          <span className="text-amber-500 font-semibold">80-85 dB Elev</span>
          <span className="text-rose-600 font-bold">&gt;85 dB Cavitation</span>
          <span>110 dB</span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
          <div className="w-[57%] bg-teal-400" />
          <div className="w-[14%] bg-amber-400" />
          <div className="w-[29%] bg-rose-500" />
        </div>

        <p className="text-[11px] text-center text-slate-500 mt-2 font-medium">
          {status.statusText}
        </p>
      </div>
    </div>
  );
};
