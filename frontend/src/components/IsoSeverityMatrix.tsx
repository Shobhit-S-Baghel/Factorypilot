"use client";

import React from "react";
import { Info, ShieldAlert } from "lucide-react";

export const IsoSeverityMatrix: React.FC = () => {
  return (
    <div className="rounded-xl border border-industrial-800 bg-industrial-900/60 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-lg text-white">ISO 10816 Vibration Severity Matrix</h3>
        </div>
        <span className="text-xs font-mono text-slate-400 bg-industrial-800 px-2.5 py-1 rounded">
          Class I - IV Standard
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Evaluation of machine vibration by measurements on non-rotating parts (Velocity RMS mm/s).
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-industrial-800 text-slate-400">
              <th className="py-2.5 px-3">Velocity RMS (mm/s)</th>
              <th className="py-2.5 px-3">Class I (Small &lt;15kW)</th>
              <th className="py-2.5 px-3">Class II (Medium 15-75kW)</th>
              <th className="py-2.5 px-3">Class III (Heavy Rigid)</th>
              <th className="py-2.5 px-3">Class IV (Heavy Soft Base)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-800/60 text-slate-300">
            <tr className="bg-emerald-950/20 text-emerald-300">
              <td className="py-2.5 px-3 font-bold">&lt; 0.71 mm/s</td>
              <td className="py-2.5 px-3 font-semibold">Zone A (Good)</td>
              <td className="py-2.5 px-3 font-semibold">Zone A (Good)</td>
              <td className="py-2.5 px-3 font-semibold">Zone A (Good)</td>
              <td className="py-2.5 px-3 font-semibold">Zone A (Good)</td>
            </tr>
            <tr className="bg-emerald-950/10 text-emerald-400">
              <td className="py-2.5 px-3 font-bold">0.71 - 1.80 mm/s</td>
              <td className="py-2.5 px-3">Zone B (Acceptable)</td>
              <td className="py-2.5 px-3">Zone A / B</td>
              <td className="py-2.5 px-3">Zone A</td>
              <td className="py-2.5 px-3">Zone A</td>
            </tr>
            <tr className="bg-cyan-950/20 text-cyan-300">
              <td className="py-2.5 px-3 font-bold">1.80 - 2.80 mm/s</td>
              <td className="py-2.5 px-3 text-amber-400">Zone C (Alert)</td>
              <td className="py-2.5 px-3">Zone B (Acceptable)</td>
              <td className="py-2.5 px-3">Zone B (Acceptable)</td>
              <td className="py-2.5 px-3">Zone B (Acceptable)</td>
            </tr>
            <tr className="bg-amber-950/20 text-amber-300">
              <td className="py-2.5 px-3 font-bold">2.80 - 4.50 mm/s</td>
              <td className="py-2.5 px-3 text-rose-400 font-bold">Zone D (Critical)</td>
              <td className="py-2.5 px-3 text-amber-400">Zone C (Alert)</td>
              <td className="py-2.5 px-3">Zone B / C</td>
              <td className="py-2.5 px-3">Zone B / C</td>
            </tr>
            <tr className="bg-rose-950/30 text-rose-300">
              <td className="py-2.5 px-3 font-bold">&gt; 4.50 mm/s</td>
              <td className="py-2.5 px-3 text-rose-400 font-bold">Zone D (Trip)</td>
              <td className="py-2.5 px-3 text-rose-400 font-bold">Zone D (Trip)</td>
              <td className="py-2.5 px-3 text-amber-400">Zone C / D</td>
              <td className="py-2.5 px-3 text-rose-400 font-bold">Zone D (Trip)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-industrial-950/50 p-3 rounded-lg border border-industrial-800">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>Centrifugal Pump P-101</strong> falls under Class II (rigid base). 
          <strong> CNC Milling Spindle SP-300</strong> high-speed tool operates under precision balance tolerance G0.4.
        </span>
      </div>
    </div>
  );
};
