"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  Radio,
  FileText,
  BrainCircuit,
  Layers,
  Wrench,
  Clock,
  Gauge,
  Sparkles,
  BarChart3,
  Check,
  X,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/60 border-b border-slate-200 py-16 md:py-24">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E2E8F0_1px,transparent_1px),linear-gradient(to_bottom,#E2E8F0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-semibold mb-6 shadow-xs animate-in fade-in duration-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Industrial Predictive Maintenance 4.0</span>
            <span className="text-amber-400">•</span>
            <span className="text-amber-700 font-mono">ISO 10816 + RAG</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-none">
            Predict Industrial Machine Failures{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700">
              Before Costly Downtime.
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            FactoryPilot transforms complex sensor telemetry into deterministic mechanical root-cause diagnoses, automated ISO 10816 zoning, and OSHA-compliant LOTO repair procedures in seconds.
          </p>

          {/* Call to Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/telemetry"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all group"
            >
              <span>Open Telemetry Sandbox</span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/copilot"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-300 shadow-xs hover:shadow-sm transition-all"
            >
              <BrainCircuit className="w-4 h-4 text-slate-600" />
              <span>Launch AI Diagnostic Copilot</span>
            </Link>

            <Link
              href="/architecture"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-3.5 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
            >
              <Layers className="w-4 h-4" />
              <span>How AI Agents Work</span>
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="mt-14 pt-10 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">$260,000</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">Average Cost Per Hour</div>
              <div className="text-[11px] text-slate-500">Unplanned industrial downtime</div>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">&lt; 30 Seconds</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">Fault Localization</div>
              <div className="text-[11px] text-slate-500">From raw telemetry to broken part</div>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">4 Sub-Components</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">Deterministic Pinpointing</div>
              <div className="text-[11px] text-slate-500">Impeller, bearings, stator, spindle</div>
            </div>

            <div className="p-4 rounded-xl bg-white/80 border border-slate-200/70 shadow-xs">
              <div className="text-2xl sm:text-3xl font-extrabold text-teal-600">OSHA 1910.147</div>
              <div className="text-xs font-semibold text-slate-700 mt-1">LOTO Safety First</div>
              <div className="text-[11px] text-slate-500">Automated zero-energy validation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs. Solution Section */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
              Industry Challenge vs. Modern Automation
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              Why Manual Telemetry Inspection Fails on the Plant Floor
            </h3>
            <p className="mt-3 text-slate-600 text-sm">
              Plant reliability engineers monitor hundreds of rotating assets. Spotting micro-jet cavitation or raceway fatigue in raw CSV data before catastrophic seizure is humanly impossible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm mb-4">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-rose-600" />
                  </div>
                  <span>The Legacy Approach: Reactive & Manual</span>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-4">
                  Endless CSV rows, late alarms, and sudden line stops
                </h4>

                <ul className="space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-rose-200 text-rose-700 mt-0.5">✕</span>
                    <span><strong>Tedious CSV Inspection:</strong> Technicians scroll thousands of rows of vibration and temperature readings without multi-sensor correlation.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-rose-200 text-rose-700 mt-0.5">✕</span>
                    <span><strong>Unnoticed Cavitation:</strong> Subtle acoustic spikes (85+ dB) and discharge pressure flutter go unnoticed until impeller vanes pit through.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-rose-200 text-rose-700 mt-0.5">✕</span>
                    <span><strong>Scrambling for Manuals:</strong> Searching through 400-page OEM binder manuals while the production line is down costs thousands per minute.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-rose-200 text-rose-700 mt-0.5">✕</span>
                    <span><strong>Safety Hazards:</strong> Rushing to repair high-pressure hydraulic pumps without verified OSHA zero-energy Lockout/Tagout procedures.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-rose-200/80 text-rose-900 font-medium text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Result: Catastrophic trips, ruined tool tooling, and $260k/hr downtime losses.</span>
              </div>
            </div>

            {/* The FactoryPilot Way */}
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/40 p-6 sm:p-8 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm mb-4">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>The FactoryPilot Solution: Automated & Deterministic</span>
                </div>

                <h4 className="text-xl font-bold text-slate-900 mb-4">
                  Instant root-cause pinpointing & automated LOTO procedures
                </h4>

                <ul className="space-y-3.5 text-xs text-slate-700">
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-emerald-200 text-emerald-700 mt-0.5">✓</span>
                    <span><strong>Multi-Sensor Cross-Correlation:</strong> Correlates vibration RMS, acoustic dB, motor current, and thermal RTD metrics simultaneously.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-emerald-200 text-emerald-700 mt-0.5">✓</span>
                    <span><strong>Explicit Broken Part Pinpointing:</strong> Deterministically identifies whether it is the Impeller, Bearing 6205, Stator Winding, or Spindle Shaft.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-emerald-200 text-emerald-700 mt-0.5">✓</span>
                    <span><strong>ChromaDB Vector RAG:</strong> Semantically pulls exact chapter guidelines, replacement part numbers, and torque specs from manufacturer SOPs.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="p-1 rounded-full bg-emerald-200 text-emerald-700 mt-0.5">✓</span>
                    <span><strong>Automated OSHA 1910.147 Compliance:</strong> Enforces mandatory zero-energy verification before physical maintenance begins.</span>
                  </li>
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-emerald-200/80 text-emerald-950 font-medium text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Result: Failure prevented up to 48 hours prior to trip, protecting multi-million dollar assets.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Machinery In Focus Section */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
                Monitored Industrial Machinery
              </h2>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                Two Critical Plant Assets Supported Out-of-the-Box
              </h3>
            </div>
            <Link
              href="/telemetry"
              className="mt-4 md:mt-0 inline-flex items-center text-xs font-bold text-slate-900 hover:text-amber-600 transition-colors"
            >
              <span>Test both assets in Telemetry Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PUMP-01 Card */}
            <div className="industrial-card p-6 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                    PUMP-01
                  </span>
                  <h4 className="text-xl font-bold text-slate-900 mt-2">Centrifugal Slurry Booster Pump</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  Class II Rotating Asset
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Heavy-duty booster pump operating in mineral processing plants. Pumps high-density slurry at 1,750 RPM under severe hydraulic friction and cavitation risks.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Failure Mode</span>
                  <strong className="text-slate-800">Vapor Cavitation Erosion</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pinpointed Part</span>
                  <strong className="text-slate-800">Impeller Blade Assembly</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Key Sensor Signals</span>
                  <span className="text-slate-700">Acoustic &gt; 82 dB, Vib &gt; 2.8 mm/s</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Safety Mandate</span>
                  <span className="text-amber-700 font-medium">480V MCC + Knife Gate LOTO</span>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/telemetry?preset=pump_cavitation"
                  className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  <span>Load Cavitation Telemetry Run</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>

            {/* CNC-SPINDLE-01 Card */}
            <div className="industrial-card p-6 rounded-xl hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    CNC-SPINDLE-01
                  </span>
                  <h4 className="text-xl font-bold text-slate-900 mt-2">HSK-A63 High-Speed Milling Spindle</h4>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  Precision Machine Tool
                </span>
              </div>

              <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                Direct-drive electro-spindle running up to 24,000 RPM for precision aerospace turbine milling. Equipped with hybrid ceramic angular contact bearings.
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Failure Mode</span>
                  <strong className="text-slate-800">Lubricant Starvation & Raceway Fatigue</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pinpointed Part</span>
                  <strong className="text-slate-800">Deep Groove Ball Bearing 6205</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Key Sensor Signals</span>
                  <span className="text-slate-700">Temp &gt; 80°C, Vibration Zone D</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Safety Mandate</span>
                  <span className="text-amber-700 font-medium">400V VFD + Thru-Spindle Coolant</span>
                </div>
              </div>

              <div className="mt-5">
                <Link
                  href="/telemetry?preset=cnc_bearing"
                  className="inline-flex items-center text-xs font-bold text-amber-700 hover:text-amber-800"
                >
                  <span>Load Bearing Overheat Telemetry Run</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Pipeline Overview */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">
              Autonomous Architecture
            </h2>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
              From Sensor Impulse to Field Work Order in 4 Stages
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-sm mb-3">
                01
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Telemetry Ingestion</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Validates CSV files & WebSocket packets across 6 channels: Vibration, Temp, Current, RPM, and Acoustics.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm mb-3">
                02
              </div>
              <h4 className="font-bold text-slate-900 text-sm">ML Anomaly Detection</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Applies scikit-learn Isolation Forest calibrated against ISO 10816 vibration standards and rolling Crest Factors.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 font-bold flex items-center justify-center text-sm mb-3">
                03
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Fault Localization</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Cross-correlates multi-channel deviations to pinpoint the exact failing mechanical component and physical damage mode.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-sm mb-3">
                04
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Vector RAG Copilot</h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Retrieves verified OEM manual chapters, OSHA 1910.147 LOTO steps, and downloads formatted Maintenance Work Orders.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/architecture"
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 underline underline-offset-4"
            >
              <span>Read the full technical specification for all 5 AI Agents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-14 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Ready to test FactoryPilot on real factory telemetry?
          </h2>
          <p className="mt-3 text-slate-300 text-sm max-w-xl mx-auto">
            Zero configuration required. Load our sample industrial failure datasets or upload your plant CSV to detect anomalies in real time.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/telemetry"
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all inline-flex items-center space-x-1.5"
            >
              <span>Open Telemetry Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/copilot"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all inline-flex items-center space-x-1.5"
            >
              <span>Ask AI Copilot</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
