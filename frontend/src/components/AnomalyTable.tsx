"use client";

import React, { useState } from "react";
import { AlertCircle, AlertTriangle, ShieldCheck, ChevronRight, Info } from "lucide-react";

export interface AnomalyRecord {
  timestamp: string;
  machine_id: string;
  is_anomaly: boolean;
  anomaly_score: number;
  risk_score: number;
  iso_10816_zone: string;
  thermal_status: string;
  primary_contributor?: string;
  affected_metrics: string[];
}

interface AnomalyTableProps {
  anomalies: AnomalyRecord[];
  onSelectAnomaly?: (record: AnomalyRecord) => void;
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({ anomalies, onSelectAnomaly }) => {
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "ANOMALIES" | "CRITICAL">("ALL");

  const filtered = anomalies.filter((a) => {
    if (filterSeverity === "ANOMALIES") return a.is_anomaly;
    if (filterSeverity === "CRITICAL") return a.risk_score > 60 || a.iso_10816_zone.includes("Zone D");
    return true;
  });

  const getZoneBadge = (zone: string) => {
    if (zone.includes("Zone A")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (zone.includes("Zone B")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (zone.includes("Zone C")) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <div className="industrial-card p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">Anomaly Event Log & Statistical Timeline</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological log of machine states, ISO vibration ratings, and isolation forest risk scores.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-mono">
          <button
            onClick={() => setFilterSeverity("ALL")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterSeverity === "ALL" ? "bg-white text-slate-900 font-bold shadow-sm" : "text-slate-600"
            }`}
          >
            All ({anomalies.length})
          </button>
          <button
            onClick={() => setFilterSeverity("ANOMALIES")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterSeverity === "ANOMALIES" ? "bg-white text-amber-700 font-bold shadow-sm" : "text-slate-600"
            }`}
          >
            Anomalies ({anomalies.filter((a) => a.is_anomaly).length})
          </button>
          <button
            onClick={() => setFilterSeverity("CRITICAL")}
            className={`px-2.5 py-1 rounded transition-colors ${
              filterSeverity === "CRITICAL" ? "bg-white text-rose-700 font-bold shadow-sm" : "text-slate-600"
            }`}
          >
            Critical
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
              <th className="py-2.5 px-3 font-semibold">Timestamp (UTC)</th>
              <th className="py-2.5 px-3 font-semibold">Machine ID</th>
              <th className="py-2.5 px-3 font-semibold">Risk Score</th>
              <th className="py-2.5 px-3 font-semibold">ISO 10816 Zone</th>
              <th className="py-2.5 px-3 font-semibold">Primary Driver</th>
              <th className="py-2.5 px-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                  No anomaly records match the selected filter criteria.
                </td>
              </tr>
            ) : (
              filtered.slice(0, 10).map((record, idx) => {
                const isCrit = record.risk_score > 60 || record.iso_10816_zone.includes("Zone D");
                const isWarn = record.is_anomaly && !isCrit;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCrit ? "bg-rose-50/20" : isWarn ? "bg-amber-50/20" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {new Date(record.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{record.machine_id}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          isCrit ? "text-rose-600" : isWarn ? "text-amber-600" : "text-emerald-600"
                        }`}
                      >
                        {record.risk_score.toFixed(1)} / 100
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold ${getZoneBadge(
                          record.iso_10816_zone
                        )}`}
                      >
                        {record.iso_10816_zone.split(" ")[0]} {record.iso_10816_zone.split(" ")[1]}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {record.primary_contributor ? (
                        <span className="font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          {record.primary_contributor}
                        </span>
                      ) : (
                        <span className="text-slate-400">Baseline</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {onSelectAnomaly && record.is_anomaly ? (
                        <button
                          onClick={() => onSelectAnomaly(record)}
                          className="flex items-center space-x-1 text-teal-700 hover:text-teal-900 font-bold hover:underline"
                        >
                          <span>Diagnose</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3 font-sans">
        <span>Showing up to 10 latest events ({filtered.length} total)</span>
        <span className="font-mono text-slate-400">Model: Unsupervised Isolation Forest (contamination=0.08)</span>
      </div>
    </div>
  );
};
