"use client";

import React from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  Sliders,
  ChevronDown,
  FastForward,
  Zap,
  Activity,
  Layers,
} from "lucide-react";
import { ConnectionState, SpeedMultiplier } from "@/hooks/useTelemetryStream";

export interface ScenarioOption {
  id: string;
  name: string;
  machineId: string;
  description: string;
  faultSignatures: string[];
}

export const SCENARIO_OPTIONS: ScenarioOption[] = [
  {
    id: "centrifugal_pump_cavitation",
    name: "Centrifugal Pump Cavitation",
    machineId: "PUMP-01",
    description: "Flow breakdown causing high-frequency acoustic emissions (>85 dB) & turbulent vibration.",
    faultSignatures: ["Acoustic >85 dB", "Vibration RMS >4.5 mm/s", "Mild Current Fluctuations"],
  },
  {
    id: "cnc_spindle_bearing_wear",
    name: "CNC Bearing Wear",
    machineId: "CNC-SPINDLE-01",
    description: "ISO 10816 Zone D critical vibration elevation (>7.1 mm/s) & thermal runaway (>85°C).",
    faultSignatures: ["ISO Zone D (>7.1 mm/s)", "Bearing Temp >80°C", "Spindle Drag Current"],
  },
  {
    id: "thermal_overload_baseline",
    name: "Thermal Overload",
    machineId: "PUMP-01",
    description: "Stator winding thermal buildup from persistent 120% full-load current draw.",
    faultSignatures: ["Bearing Temp >80°C", "120% FLA Overload", "Nominal Vibration"],
  },
];

interface StreamControlsProps {
  connectionState: ConnectionState;
  isPlaying: boolean;
  selectedScenario: string;
  speedMultiplier: SpeedMultiplier;
  currentTick: number;
  totalTicks: number;
  disabled?: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onSelectSpeed: (speed: SpeedMultiplier) => void;
  onSeek?: (tick: number) => void;
  onReconnect?: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  connectionState,
  isPlaying,
  selectedScenario,
  speedMultiplier,
  currentTick,
  totalTicks,
  disabled = false,
  onPlay,
  onPause,
  onReset,
  onSelectScenario,
  onSelectSpeed,
  onSeek,
  onReconnect,
}) => {
  const currentScenarioObj =
    SCENARIO_OPTIONS.find((s) => s.id === selectedScenario) || SCENARIO_OPTIONS[0];

  const getConnectionBadge = (state: ConnectionState) => {
    switch (state) {
      case "Live":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500 animate-pulse",
          label: "Live Telemetry",
        };
      case "Reconnecting":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-500 animate-ping",
          label: "Reconnecting...",
        };
      case "Offline":
      default:
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          label: "Stream Offline",
        };
    }
  };

  const badgeInfo = getConnectionBadge(connectionState);

  const progressPercent = totalTicks > 0 ? Math.min(100, Math.round((currentTick / totalTicks) * 100)) : 0;

  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 ${disabled ? "opacity-75" : ""}`}>
      {/* Top row: controls bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Playback action buttons */}
        <div className="flex items-center space-x-2">
          {isPlaying ? (
            <button
              disabled={disabled}
              onClick={onPause}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Pause Live Telemetry Stream"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              disabled={disabled}
              onClick={onPlay}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              title={disabled ? "Upload telemetry data to activate controls" : "Resume Live Telemetry Stream"}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Play Stream</span>
            </button>
          )}

          <button
            disabled={disabled}
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Reset Stream Buffer & Replay"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          {/* Speed selector pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            {([1, 2, 5] as SpeedMultiplier[]).map((spd) => (
              <button
                key={spd}
                disabled={disabled}
                onClick={() => onSelectSpeed(spd)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  speedMultiplier === spd
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                title={`Playback Speed ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Scenario Selector Dropdown */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <select
              disabled={disabled}
              value={selectedScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {SCENARIO_OPTIONS.map((scen) => (
                <option key={scen.id} value={scen.id}>
                  {scen.name} &bull; ({scen.machineId})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Right: Connection State Indicator */}
        <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0">
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${badgeInfo.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${badgeInfo.dot}`} />
            <span>{badgeInfo.label}</span>
          </div>

          {connectionState === "Offline" && onReconnect && (
            <button
              onClick={onReconnect}
              className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium border border-slate-200 transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Timeline scrubber & scenario summary */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-500">
          <Activity className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="font-semibold text-slate-700">{currentScenarioObj.name}:</span>
          <span className="text-slate-500 line-clamp-1">{currentScenarioObj.description}</span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          {/* Progress bar */}
          <div className="flex items-center space-x-2">
            <span className="font-mono text-slate-400 text-[11px]">
              Tick {currentTick}/{totalTicks}
            </span>
            <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-slate-600 text-[11px] font-semibold">{progressPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
