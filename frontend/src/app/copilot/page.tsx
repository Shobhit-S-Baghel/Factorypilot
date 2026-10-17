"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DiagnosticChat } from "@/components/DiagnosticChat";
import {
  BrainCircuit,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  Cpu,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders,
  Flame,
  Gauge,
  Radio,
  FileText,
  Activity,
  Layers,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const PRESET_FAULTS = {
  "PUMP-01": {
    diagnosed_component: "Impeller Blade Assembly",
    failure_mechanism: "Vapor Cavitation Erosion",
    failure_mode: "Vapor Cavitation Erosion",
    recommended_action: "Throttle discharge valve, backwash suction basket strainer, and inspect impeller blade assembly for pitting.",
    is_anomaly: true,
    sensor_snapshot: {
      vibration_rms: 4.85,
      bearing_temp: 74.2,
      acoustic_db: 86.4,
      current_amps: 118.0,
      rpm: 1750,
      iso_zone: "Zone C (Warning)",
    },
    safety_loto: "MANDATORY LOTO: Open 480V 3-phase MCC breaker (MCC-B-04) and padlock. Double block & bleed suction knife gate V-SUC-101 and discharge valve V-DIS-102. Depressurize casing via drain valve V-DRN-103 to 0.00 bar.",
  },
  "CNC-SPINDLE-01": {
    diagnosed_component: "Deep Groove Ball Bearing 6205",
    failure_mechanism: "Lubricant Starvation & Raceway Fatigue",
    failure_mode: "Lubricant Starvation & Raceway Fatigue",
    recommended_action: "Isolate MCC 480V breaker, check grease for moisture emulsification, and purge bearing housing with Mobilith SHC 220.",
    is_anomaly: true,
    sensor_snapshot: {
      vibration_rms: 3.92,
      bearing_temp: 86.5,
      acoustic_db: 76.1,
      current_amps: 19.4,
      rpm: 18000,
      iso_zone: "Zone D (Critical)",
    },
    safety_loto: "MANDATORY LOTO: Isolate 400V electrical disconnect at main CNC cabinet. Depressurize thru-spindle coolant line. Allow motor stator to cool below 35°C before handling.",
  },
};

export default function CopilotPage() {
  const [selectedMachineId, setSelectedMachineId] = useState<string>("PUMP-01");
  const [activeFault, setActiveFault] = useState(PRESET_FAULTS["PUMP-01"]);

  const handleSelectMachine = (machineId: string) => {
    setSelectedMachineId(machineId);
    if (machineId === "CNC-SPINDLE-01") {
      setActiveFault(PRESET_FAULTS["CNC-SPINDLE-01"]);
    } else {
      setActiveFault(PRESET_FAULTS["PUMP-01"]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 mb-1">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>Industrial Technical Manual RAG</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            AI Diagnostic Copilot & Troubleshooting Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Ask technical troubleshooting questions, verify OSHA 1910.147 LOTO steps, and review OEM repair citations.
          </p>
        </div>

        {/* Machine Selector Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => handleSelectMachine("PUMP-01")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              selectedMachineId === "PUMP-01"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            PUMP-01 (Slurry Booster)
          </button>
          <button
            onClick={() => handleSelectMachine("CNC-SPINDLE-01")}
            className={`px-3.5 py-2 rounded-lg transition-all ${
              selectedMachineId === "CNC-SPINDLE-01"
                ? "bg-white text-slate-900 shadow-sm font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            CNC-SPINDLE-01 (HSK-A63)
          </button>
        </div>
      </div>

      {/* Prominent Top Card: Diagnosed Broken Part & Failure Mechanism */}
      <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded font-mono text-xs font-bold bg-amber-500 text-slate-950">
                ACTIVE FAULT DIAGNOSIS
              </span>
              <span className="px-2.5 py-1 rounded font-mono text-xs font-semibold bg-slate-900 text-white">
                {selectedMachineId}
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {activeFault.sensor_snapshot.iso_zone}
              </span>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Diagnosed Broken Part:
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-0.5">
                {activeFault.diagnosed_component}
              </h2>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Physical Failure Mechanism:
              </div>
              <p className="text-base font-bold text-amber-800 mt-0.5">
                {activeFault.failure_mechanism}
              </p>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {activeFault.recommended_action}
              </p>
            </div>
          </div>

          {/* Sensor Snapshot Stats on Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2.5 bg-white/90 p-4 rounded-xl border border-slate-200/80 shadow-xs shrink-0 lg:w-80">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Vibration RMS</span>
              <strong className="text-sm font-bold text-slate-900">
                {activeFault.sensor_snapshot.vibration_rms.toFixed(2)} mm/s
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Bearing Temp</span>
              <strong className="text-sm font-bold text-slate-900">
                {activeFault.sensor_snapshot.bearing_temp.toFixed(1)} °C
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Motor Current</span>
              <strong className="text-sm font-bold text-slate-900">
                {activeFault.sensor_snapshot.current_amps.toFixed(1)} A
              </strong>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Acoustic Noise</span>
              <strong className="text-sm font-bold text-slate-900">
                {activeFault.sensor_snapshot.acoustic_db.toFixed(1)} dB
              </strong>
            </div>
          </div>
        </div>

        {/* Safety & LOTO Mandatory Warning Banner */}
        <div className="mt-5 pt-4 border-t border-amber-500/20 flex items-start space-x-3 text-xs text-amber-950">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-900">
              OSHA 29 CFR 1910.147 Lockout/Tagout (LOTO) Mandatory Prior to Inspection:
            </strong>{" "}
            <span>{activeFault.safety_loto}</span>
          </div>
        </div>
      </div>

      {/* Interactive Diagnostic Copilot Chat Interface */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <BrainCircuit className="w-4 h-4 text-slate-700" />
            <span>Interactive Diagnostic Console</span>
          </div>
          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Connected to: /api/v1/diagnostics/troubleshoot
          </span>
        </div>

        <DiagnosticChat
          apiBaseUrl={API_BASE_URL}
          machineId={selectedMachineId}
          currentAnomalySummary={{
            vibration_rms_mms: activeFault.sensor_snapshot.vibration_rms,
            bearing_temperature_c: activeFault.sensor_snapshot.bearing_temp,
            acoustic_db: activeFault.sensor_snapshot.acoustic_db,
            current_draw_amps: activeFault.sensor_snapshot.current_amps,
            rotational_speed_rpm: activeFault.sensor_snapshot.rpm,
            iso_10816_zone: activeFault.sensor_snapshot.iso_zone,
            primary_contributor: activeFault.diagnosed_component.toLowerCase().includes("bearing") ? "bearing_temperature_c" : "vibration_rms_mms",
            overall_state: "Degraded",
          }}
          diagnosedFault={activeFault}
        />
      </div>

      {/* OEM Technical Documentation Badges & Citations Preview */}
      <div className="industrial-card p-6 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Standard Operating Procedure (SOP) Technical Manuals Indexed
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            ChromaDB Vector Store: 2 Documents, 18 Semantic Chunks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                centrifugal_pump_manual.md
              </span>
              <span className="text-[11px] font-semibold text-slate-500">PUMP-01 OEM SOP</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-2">
              Centrifugal Slurry Booster Technical Manual & SOP
            </h4>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li>Chapter 2: ISO 10816-3 Vibration Severity Limits (Zone A/B/C/D)</li>
              <li>Chapter 4: Cavitation Acoustic Signatures (&gt;82 dB) & NPSH Margins</li>
              <li>Chapter 5: Lubrication Schedule & Mobilith SHC 220 Synthetic Grease</li>
              <li>Chapter 6: OSHA 29 CFR 1910.147 LOTO Zero-Energy State Protocol</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                cnc_milling_spindle_manual.md
              </span>
              <span className="text-[11px] font-semibold text-slate-500">CNC-SPINDLE-01 OEM SOP</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm mt-2">
              HSK-A63 High-Speed Spindle Maintenance & Calibration Manual
            </h4>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li>Chapter 2: Spindle Nose Radial Runout Limits (TIR &lt;= 2 µm)</li>
              <li>Chapter 3: Thermal RTD Housing Thresholds (Warning &gt;80°C, Trip &gt;95°C)</li>
              <li>Chapter 4: Motor Stator Chiller Flow & Thru-Spindle Coolant (TSC &gt;20 bar)</li>
              <li>Chapter 5: ISO 7 Cleanroom Hybrid Ceramic Bearing Replacement (P4S)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
