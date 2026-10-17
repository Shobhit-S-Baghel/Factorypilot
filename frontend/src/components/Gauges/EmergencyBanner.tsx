"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  AlertOctagon,
  ShieldAlert,
  Volume2,
  VolumeX,
  FileText,
  AlertTriangle,
  ArrowRight,
  Flame,
  Gauge,
} from "lucide-react";

interface EmergencyBannerProps {
  isCritical: boolean;
  machineId: string;
  primaryOffendingSensor: string;
  offendingValue: string | number;
  offendingUnit: string;
  alerts?: string[];
  onOpenWorkOrder?: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  isCritical,
  machineId,
  primaryOffendingSensor,
  offendingValue,
  offendingUnit,
  alerts = [],
  onOpenWorkOrder,
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play a soft industrial dual-tone beep pulse when critical and unmuted
  const playAlertTone = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15); // drop to A4

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      console.warn("Audio alert blocked by browser autoplay policy:", e);
    }
  };

  useEffect(() => {
    if (isCritical && !isAudioMuted) {
      // Periodic pulse every 2.5 seconds
      playAlertTone();
      intervalRef.current = setInterval(playAlertTone, 2500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isCritical, isAudioMuted]);

  if (!isCritical) return null;

  const formatSensorName = (rawName: string) => {
    switch (rawName) {
      case "vibration_rms_mms":
        return "Vibration Velocity RMS";
      case "bearing_temperature_c":
        return "Bearing Housing Temperature";
      case "acoustic_db":
        return "Ultrasonic Acoustic Intensity";
      case "current_draw_amps":
        return "Electrical Current Draw";
      default:
        return rawName.replace(/_/g, " ").toUpperCase();
    }
  };

  return (
    <div className="relative overflow-hidden bg-rose-600 text-white rounded-xl shadow-lg border-2 border-rose-500 animate-pulse">
      {/* Visual pulse glow gradient bar */}
      <div className="absolute inset-0 bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 opacity-90" />

      <div className="relative px-4 py-3 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Emergency Status & Offending Metric */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <AlertOctagon className="w-6 h-6 text-white animate-bounce" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded bg-black/30 border border-white/20">
                CRITICAL INDUSTRIAL FAULT
              </span>
              <span className="text-xs font-mono font-semibold bg-white/20 px-2 py-0.5 rounded">
                Asset: {machineId}
              </span>
            </div>

            <p className="text-sm sm:text-base font-bold mt-1 tracking-tight text-white flex flex-wrap items-center gap-2">
              <span>Primary Offending Channel:</span>
              <span className="underline decoration-amber-300 font-mono text-amber-200">
                {formatSensorName(primaryOffendingSensor)}: {offendingValue} {offendingUnit}
              </span>
            </p>

            {alerts && alerts.length > 0 && (
              <p className="text-xs text-rose-100 font-mono line-clamp-1 mt-0.5">
                {alerts[0]}
              </p>
            )}
          </div>
        </div>

        {/* Center / Right: LOTO Protocol Advised Badge & Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
          {/* LOTO Protocol Advised Badge */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-black/40 border border-amber-400/60 shadow-sm">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-black tracking-wide text-amber-300 uppercase">
                LOTO Protocol Advised
              </span>
              <span className="text-[10px] text-amber-200/80 font-mono">
                OSHA 29 CFR 1910.147
              </span>
            </div>
          </div>

          {/* Audio toggle button */}
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className={`p-2 rounded-lg text-xs font-medium border transition-colors ${
              isAudioMuted
                ? "bg-white/10 text-white/80 border-white/20 hover:bg-white/20"
                : "bg-white text-rose-700 border-white font-bold"
            }`}
            title={isAudioMuted ? "Unmute audible alarm pulse" : "Mute audible alarm"}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Work Order Action Button */}
          {onOpenWorkOrder && (
            <button
              onClick={onOpenWorkOrder}
              className="flex items-center space-x-1.5 px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 border border-white"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Work Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
