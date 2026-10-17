"use client";

import React from "react";
import { Cpu, Activity, ShieldCheck, HardDrive, Radio, Layers } from "lucide-react";

interface HeaderProps {
  selectedMachineId: string;
  onSelectMachine: (id: string) => void;
  backendStatus: string;
  equipmentHealth: number;
  operationalState: string;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMachineId,
  onSelectMachine,
  backendStatus,
  equipmentHealth,
  operationalState,
}) => {
  const getStatusBadge = (state: string) => {
    switch (state.toLowerCase()) {
      case "nominal":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "degraded":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shadow-md">
            <Cpu className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">FactoryPilot</span>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                PROD v0.2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Industrial Telemetry & AI Diagnostic Copilot</p>
          </div>
        </div>

        {/* Machine Asset Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <button
            onClick={() => onSelectMachine("PUMP-01")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedMachineId === "PUMP-01"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            PUMP-01 (Slurry Booster)
          </button>
          <button
            onClick={() => onSelectMachine("CNC-SPINDLE-01")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              selectedMachineId === "CNC-SPINDLE-01"
                ? "bg-white text-slate-900 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            CNC-SPINDLE-01 (HSK-A63)
          </button>
        </div>

        {/* Status badges */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs">
            <Activity className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <span className="text-slate-600">Backend:</span>
            <span className="font-mono font-semibold text-slate-800">{backendStatus.toUpperCase()}</span>
          </div>

          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${getStatusBadge(operationalState)}`}>
            <Radio className="w-3.5 h-3.5" />
            <span>{operationalState.toUpperCase()} ({equipmentHealth}%)</span>
          </div>

          <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>OSHA LOTO Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};
