"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Database,
  BrainCircuit,
  Search,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Activity,
  Radio,
  FileText,
  AlertTriangle,
  Flame,
  Gauge,
  Sliders,
  Sparkles,
} from "lucide-react";

interface AgentSpec {
  id: number;
  name: string;
  tag: string;
  badgeColor: string;
  borderColor: string;
  icon: any;
  summary: string;
  plainLanguage: string;
  inputs: string[];
  outputs: string[];
  codeLocation: string;
  sampleRule: string;
}

const AGENTS: AgentSpec[] = [
  {
    id: 1,
    name: "Data Ingestion & Sanitization Engine",
    tag: "Agent 1: Ingestion & Features",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-200",
    borderColor: "border-teal-500",
    icon: Database,
    summary:
      "Validates incoming sensor CSV files and WebSocket frames, imputes missing records, and computes rolling statistical features.",
    plainLanguage:
      "Like a vigilant plant gatekeeper: it ensures every sensor number makes sense, catches frozen or missing sensor readings, and prepares rolling 5-minute averages before sending data downstream.",
    inputs: [
      "Multipart CSV file or WebSocket frame",
      "Timestamp & Machine Asset Tag (PUMP-01, CNC-SPINDLE-01)",
      "Raw vibration, temperature, speed, current, and acoustic channels",
    ],
    outputs: [
      "Sanitized pandas DataFrame with UTC timestamps",
      "Rolling 5-minute RMS & peak-to-peak variance",
      "Vibration Crest Factor (peak / RMS ratio)",
    ],
    codeLocation: "backend/app/services/telemetry_service.py",
    sampleRule: "Validate 7 required channels; impute missing values with rolling median; reject non-monotonic timestamps.",
  },
  {
    id: 2,
    name: "Anomaly Detection Engine (ISO 10816 & ML)",
    tag: "Agent 2: Statistical & Standards",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    borderColor: "border-amber-500",
    icon: Activity,
    summary:
      "Combines scikit-learn Isolation Forest with deterministic ISO 10816-3 vibration severity limits and thermal housing thresholds.",
    plainLanguage:
      "Like a seasoned vibration analyst: it constantly checks if the machine is vibrating too hard or running too hot according to international engineering standards, scoring overall health from 0 to 100%.",
    inputs: [
      "Rolling statistical feature matrix",
      "ISO 10816-3 Class II / precision machine limits",
      "Pt100 RTD bearing temperature readings",
    ],
    outputs: [
      "Calibrated Risk Score (0.0 to 100.0)",
      "ISO 10816 Zone (Zone A: Good, Zone B: Acceptable, Zone C: Warning, Zone D: Trip)",
      "Equipment Health Index (EHI 0-100%)",
    ],
    codeLocation: "backend/app/services/ml_engine.py",
    sampleRule: "Vibration > 2.80 mm/s triggers Zone C (Warning); Vibration > 4.50 mm/s triggers Zone D (Trip); Bearing Temp > 80°C triggers Thermal Warning.",
  },
  {
    id: 3,
    name: "Sub-Component Fault Localization Agent",
    tag: "Agent 3: Deterministic Mechanical Correlation",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    borderColor: "border-rose-500",
    icon: Wrench,
    summary:
      "Evaluates multi-sensor correlation to pinpoint the exact failing mechanical sub-component and physical damage mechanism.",
    plainLanguage:
      "Like an expert diagnostic mechanic: it doesn't just say 'machine broken' — it looks at acoustics plus vibration to diagnose the Impeller, or temperature plus vibration to diagnose Bearing 6205.",
    inputs: [
      "Peak vibration velocity RMS & Crest Factor",
      "Pt100 RTD bearing temperature",
      "Acoustic noise dB & motor current Amps",
      "RPM deviations and speed spectrum",
    ],
    outputs: [
      "Diagnosed Part: 'Impeller Blade Assembly', 'Deep Groove Ball Bearing 6205', 'Stator Winding Assembly', 'High-Speed Spindle Shaft'",
      "Failure Mode: 'Vapor Cavitation Erosion', 'Lubricant Starvation & Raceway Fatigue', 'Electrical Phase Overload', 'Dynamic Unbalance & Misalignment'",
    ],
    codeLocation: "backend/app/services/ml_engine.py",
    sampleRule: "High Vib (>2.8 mm/s) + Acoustic Surge (>82 dB) -> Impeller Blade Assembly (Vapor Cavitation Erosion).",
  },
  {
    id: 4,
    name: "Manual Retrieval Agent (Vector RAG)",
    tag: "Agent 4: Semantic Search & SOPs",
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    borderColor: "border-cyan-500",
    icon: Search,
    summary:
      "Performs semantic vector search over technical plant manuals to find manufacturer guidelines, torque specs, and safety precautions.",
    plainLanguage:
      "Like an instant library researcher: it scans 500-page equipment manuals in milliseconds to find the exact page, chapter, and diagram explaining how to fix the specific problem.",
    inputs: [
      "Technician natural-language diagnostic query",
      "Machine asset tag filter (centrifugal pump vs CNC spindle)",
      "Primary anomaly sensor channel",
    ],
    outputs: [
      "Semantic manual chunks with cosine similarity score",
      "Document name, SOP chapter title, and extracted safety recommendations",
      "Replacement part numbers and manufacturer specifications",
    ],
    codeLocation: "backend/app/services/rag_service.py",
    sampleRule: "Chunk manuals at 800 tokens; index with TF-IDF cosine vectors; boost chunks matching asset tag and symptoms.",
  },
  {
    id: 5,
    name: "Diagnostic Advisor Copilot",
    tag: "Agent 5: Safety & Work Order Planning",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200",
    borderColor: "border-indigo-500",
    icon: BrainCircuit,
    summary:
      "Orchestrates diagnostic output, enforces OSHA 29 CFR 1910.147 LOTO compliance, and formats downloadable work orders.",
    plainLanguage:
      "Like the plant reliability chief: it creates a step-by-step repair plan with safety precautions, verifies zero electrical energy before anyone touches a wrench, and prints the official work order.",
    inputs: [
      "Pinpointed broken sub-component & failure mode",
      "Retrieved OEM manual SOP chapters",
      "Active sensor anomaly snapshot",
    ],
    outputs: [
      "Mandatory OSHA 1910.147 Lockout/Tagout (LOTO) Advisory",
      "Sequential Field Inspection Steps with Pass/Fail Criteria",
      "Downloadable Maintenance Work Orders (Markdown & JSON)",
    ],
    codeLocation: "backend/app/api/v1/endpoints/diagnostics.py",
    sampleRule: "Enforce LOTO if ISO Zone C/D or Temp > 80°C; output 4-step zero-energy checklist with 480V MCC isolation.",
  },
];

export default function ArchitecturePage() {
  const [selectedAgentId, setSelectedAgentId] = useState<number>(3);
  const activeAgent = AGENTS.find((a) => a.id === selectedAgentId) || AGENTS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 mb-1">
          <Layers className="w-3.5 h-3.5" />
          <span>System Architecture & Agent Specifications</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          How FactoryPilot&apos;s 5 AI Engines Work Together
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
          FactoryPilot replaces guesswork with a deterministic multi-agent pipeline. Below is the complete engineering specification of how raw telemetry transforms into verified field repairs.
        </p>
      </div>

      {/* Interactive Pipeline Diagram */}
      <div className="industrial-card p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-teal-600" />
            <span>Interactive End-to-End Data Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any stage in the flow below to inspect its inputs, outputs, algorithms, and source code.
          </p>
        </div>

        {/* Pipeline Steps Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isSelected = agent.id === selectedAgentId;
            return (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`cursor-pointer p-4 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-500/50"
                    : "bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      STAGE 0{agent.id}
                    </span>
                    <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-slate-500"}`} />
                  </div>
                  <h3 className="font-bold text-xs line-clamp-2 leading-tight">
                    {agent.name.split("(")[0]}
                  </h3>
                </div>
                <div className={`mt-3 pt-2 text-[10px] font-semibold flex items-center justify-between ${isSelected ? "border-slate-700 text-slate-300" : "border-slate-200 text-slate-500"}`}>
                  <span>Inspect details</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Stage Deep-Dive Card */}
        <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs">
                0{activeAgent.id}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{activeAgent.name}</h3>
                <span className="text-xs text-slate-500 font-mono">{activeAgent.codeLocation}</span>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${activeAgent.badgeColor}`}>
              {activeAgent.tag}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">What It Does in Plain English</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {activeAgent.plainLanguage}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Deterministic Rule or Math</h4>
                <p className="text-xs font-mono text-slate-800 mt-1 bg-amber-50/70 p-3 rounded-lg border border-amber-200/70">
                  {activeAgent.sampleRule}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Stage Inputs</h4>
                <ul className="text-xs text-slate-600 mt-1 space-y-1 bg-white p-3 rounded-lg border border-slate-200 list-disc list-inside">
                  {activeAgent.inputs.map((inp, idx) => (
                    <li key={idx}><strong>{inp}</strong></li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Stage Outputs</h4>
                <ul className="text-xs text-slate-600 mt-1 space-y-1 bg-white p-3 rounded-lg border border-slate-200 list-disc list-inside">
                  {activeAgent.outputs.map((out, idx) => (
                    <li key={idx} className="text-emerald-800">✓ {out}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Agent Detailed Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Complete Agent Roles & Responsibilities
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every agent operates deterministically with zero black-box hallucination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <div
                key={agent.id}
                className="industrial-card p-5 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${agent.badgeColor}`}>
                      AGENT 0{agent.id}
                    </span>
                    <Icon className="w-5 h-5 text-slate-700" />
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{agent.name}</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {agent.summary}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Key Rule:</span>
                      <span className="text-slate-800 text-[11px] font-mono">{agent.sampleRule}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Source File:</span>
                      <code className="text-slate-600 text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                        {agent.codeLocation}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                  <button
                    onClick={() => setSelectedAgentId(agent.id)}
                    className="hover:text-amber-600 transition-colors inline-flex items-center space-x-1"
                  >
                    <span>Inspect Pipeline Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Standards & Compliance Card */}
          <div className="industrial-card p-5 rounded-xl border-amber-300 bg-amber-50/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 border border-amber-300">
                  STATUTORY STANDARDS
                </span>
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>

              <h3 className="text-base font-bold text-slate-900">Industrial Compliance Matrix</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                FactoryPilot adheres strictly to international vibration severity guidelines and statutory technician safety mandates:
              </p>

              <ul className="text-xs text-slate-700 mt-3 space-y-2">
                <li className="flex items-start space-x-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>ISO 10816-3:</strong> Mechanical vibration evaluation on non-rotating machine housings.</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>OSHA 29 CFR 1910.147:</strong> The control of hazardous energy (Lockout/Tagout).</span>
                </li>
                <li className="flex items-start space-x-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span><strong>ISO 7 Cleanroom:</strong> Spindle bearing overhaul requirements for P4S tolerance classes.</span>
                </li>
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t border-amber-200 text-xs font-bold text-amber-900">
              <span>Zero-Energy Safety Certified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Call to Action */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">See the 5 Agents Live in Action</h3>
          <p className="text-xs text-slate-300 mt-1">
            Test telemetry streaming in the Sandbox or query the AI Copilot to see RAG retrieval live.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/telemetry"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center space-x-1.5"
          >
            <span>Telemetry Sandbox</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/copilot"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all inline-flex items-center space-x-1.5"
          >
            <span>AI Copilot</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
