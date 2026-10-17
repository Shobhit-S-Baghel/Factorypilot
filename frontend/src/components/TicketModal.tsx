"use client";

import React, { useState } from "react";
import {
  X,
  FileDown,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Download,
} from "lucide-react";

export interface ChecklistItem {
  step_number: number;
  action_item: string;
  subsystem: string;
  is_completed: boolean;
}

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  machineId: string;
  operationalState: string;
  sensorSnapshot: {
    vibration_rms_mms: number;
    bearing_temperature_c: number;
    rotational_speed_rpm: number;
    current_draw_amps: number;
    acoustic_db: number;
  };
  alerts?: string[];
  timestamp?: string;
  isoZone?: string;
  primaryContributor?: string;
  recommendedMitigations?: Array<{
    title: string;
    priority: string;
    procedure_summary: string;
    estimated_downtime_minutes?: number;
  }>;
  apiBaseUrl?: string;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  machineId,
  operationalState,
  sensorSnapshot,
  alerts = [],
  timestamp,
  isoZone = "Zone C (Warning)",
  primaryContributor = "vibration_rms_mms",
  recommendedMitigations = [],
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
}) => {
  const [technicianName, setTechnicianName] = useState("Field Reliability Tech - Level 3");
  const [issueTitle, setIssueTitle] = useState(
    `Unscheduled Maintenance: ${machineId} ${operationalState.toUpperCase()} Alert`
  );
  const [lotoRequired, setLotoRequired] = useState(true);
  const [workOrderNotes, setWorkOrderNotes] = useState(
    "Automated fault telemetry capture. High priority corrective action requested."
  );

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    {
      step_number: 1,
      action_item: "Lock out primary 480V 3-phase MCC breaker; verify 0.00 VAC with CAT-IV meter.",
      subsystem: "Electrical Isolation",
      is_completed: true,
    },
    {
      step_number: 2,
      action_item: "Double block and bleed suction/discharge valves; depressurize casing to 0.00 bar.",
      subsystem: "Hydraulic Bleed",
      is_completed: true,
    },
    {
      step_number: 3,
      action_item: "Inspect impeller vane passages & suction strainer for cavitation pitting or debris.",
      subsystem: "Mechanical Inspection",
      is_completed: false,
    },
    {
      step_number: 4,
      action_item: "Inspect drive-end bearing grease for particulate discolouration or moisture emulsification.",
      subsystem: "Lubrication System",
      is_completed: false,
    },
    {
      step_number: 5,
      action_item: "Conduct triaxial vibration FFT baseline check post-repair before de-LOTO.",
      subsystem: "Re-commissioning",
      is_completed: false,
    },
  ]);

  const [isExporting, setIsExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleChecklist = (index: number) => {
    setChecklist((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, is_completed: !item.is_completed } : item))
    );
  };

  const handleExportDownload = async (format: "markdown" | "json") => {
    setIsExporting(true);
    setErrorMessage(null);

    const payload = {
      machine_id: machineId,
      issue_title: issueTitle,
      technician_name: technicianName,
      format,
      anomaly_flags: alerts.length > 0 ? alerts : [`Elevated ${primaryContributor} in ${isoZone}`],
      sensor_snapshot: sensorSnapshot,
      technician_checklist: checklist,
      manual_citations: [
        {
          manual: machineId.includes("PUMP") ? "centrifugal_pump_manual.md" : "cnc_milling_spindle_manual.md",
          chapter: machineId.includes("PUMP") ? "Section 4.3: Cavitation & Suction Head" : "Section 3.1: Spindle Bearings",
          excerpt: "Perform zero-energy isolation per OSHA 1910.147 prior to dismantling housing.",
        },
      ],
      corrective_actions:
        recommendedMitigations.length > 0
          ? recommendedMitigations
          : [
              {
                title: "Suction Line De-aeration & Backwash",
                priority: "IMMEDIATE",
                estimated_downtime_minutes: 45,
                procedure_summary: "Throttle discharge, bleed air locks, backwash strainer basket.",
              },
              {
                title: "Bearing Regreasing Protocol",
                priority: "SCHEDULED",
                estimated_downtime_minutes: 30,
                procedure_summary: "Purge casing with Mobilith SHC 220 until clean grease emerges.",
              },
            ],
      loto_required: lotoRequired,
      work_order_notes: workOrderNotes,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/diagnostics/export-ticket?download=true`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const fileExt = format === "markdown" ? "md" : "json";
      link.download = `WORK_ORDER_${machineId}_${new Date().toISOString().slice(0, 10)}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error("Export ticket failed:", err);
      setErrorMessage(err.message || "Failed to generate work order ticket.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewMarkdown = async () => {
    setIsExporting(true);
    setErrorMessage(null);

    const payload = {
      machine_id: machineId,
      issue_title: issueTitle,
      technician_name: technicianName,
      format: "markdown",
      anomaly_flags: alerts.length > 0 ? alerts : [`Elevated ${primaryContributor}`],
      sensor_snapshot: sensorSnapshot,
      technician_checklist: checklist,
      manual_citations: [],
      corrective_actions: recommendedMitigations,
      loto_required: lotoRequired,
      work_order_notes: workOrderNotes,
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/diagnostics/export-ticket?download=false`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate preview: ${response.statusText}`);
      }

      const data = await response.json();
      setPreviewContent(data.markdown_content || "No markdown content returned.");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to fetch work order preview.");
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = () => {
    if (previewContent) {
      navigator.clipboard.writeText(previewContent);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">Maintenance Work Order Generator</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {machineId}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official OSHA 1910.147 Compliant Field Work Order Dispatch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Top: Title & Tech Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Order / Incident Title
              </label>
              <input
                type="text"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Lead Technician
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* LOTO Compliance Toggle */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-900 block">
                  Mandatory OSHA 29 CFR 1910.147 LOTO Execution
                </span>
                <span className="text-[11px] text-amber-700">
                  Zero-energy state certified before mechanical dismantling or casing entry.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={lotoRequired}
                onChange={(e) => setLotoRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Sensor Snapshot Cards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Live Sensor Telemetry Snapshot
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Vibration</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {sensorSnapshot.vibration_rms_mms.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 block">mm/s</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Bearing Temp</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {sensorSnapshot.bearing_temperature_c.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 block">°C</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Speed</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {Math.round(sensorSnapshot.rotational_speed_rpm)}
                </span>
                <span className="text-[10px] text-slate-500 block">RPM</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Current</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {sensorSnapshot.current_draw_amps.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 block">Amps</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Acoustics</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  {sensorSnapshot.acoustic_db.toFixed(1)}
                </span>
                <span className="text-[10px] text-slate-500 block">dB</span>
              </div>
            </div>
          </div>

          {/* Active Checklist Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Technician Inspection Checklist
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {checklist.filter((c) => c.is_completed).length} of {checklist.length} Complete
              </span>
            </div>

            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {checklist.map((item, idx) => (
                <label
                  key={item.step_number}
                  className="flex items-start space-x-2.5 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={item.is_completed}
                    onChange={() => toggleChecklist(idx)}
                    className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900">
                      Step {item.step_number} [{item.subsystem}]:
                    </span>{" "}
                    <span className="text-slate-600">{item.action_item}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Work Order Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Technician Observations & Log Notes
            </label>
            <textarea
              rows={2}
              value={workOrderNotes}
              onChange={(e) => setWorkOrderNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Markdown Preview Area if requested */}
          {previewContent && (
            <div className="mt-4 border border-slate-300 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Markdown Output Preview</span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-1 text-teal-700 hover:text-teal-800"
                >
                  {hasCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{hasCopied ? "Copied" : "Copy Markdown"}</span>
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-slate-800 bg-slate-50 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {previewContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handlePreviewMarkdown}
            disabled={isExporting}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium underline underline-offset-2"
          >
            {previewContent ? "Refresh Preview" : "Preview Work Order Markdown"}
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={() => handleExportDownload("markdown")}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download Work Order (.MD)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
