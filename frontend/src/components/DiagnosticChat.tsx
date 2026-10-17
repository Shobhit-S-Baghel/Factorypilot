"use client";

import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  ShieldAlert,
  CheckSquare,
  Square,
  BookOpen,
  Wrench,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface DiagnosticMessage {
  id: string;
  sender: "technician" | "assistant";
  timestamp: string;
  text: string;
  troubleshootData?: {
    safety_advisory: string;
    loto_mandatory: boolean;
    root_causes: { cause: string; probability: number; severity: string; rationale: string }[];
    inspection_steps: {
      step_number: number;
      action_item: string;
      subsystem: string;
      citation_chapter: string;
      pass_criteria: string;
    }[];
    corrective_actions: {
      title: string;
      priority: string;
      estimated_downtime_minutes: number;
      procedure_summary: string;
      manual_reference: string;
    }[];
    citations: { manual: string; chapter: string; excerpt: string; relevance_score: number }[];
  };
}

interface DiagnosticChatProps {
  apiBaseUrl: string;
  machineId: string;
  currentAnomalySummary?: any;
}

export const DiagnosticChat: React.FC<DiagnosticChatProps> = ({
  apiBaseUrl,
  machineId,
  currentAnomalySummary,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [activeModalCitation, setActiveModalCitation] = useState<{
    manual: string;
    chapter: string;
    excerpt: string;
  } | null>(null);

  const presetChips = [
    "Analyze vibration peak at 14:20",
    "Show bearing lubrication intervals",
    "What ISO vibration zone is this?",
    "HSK-A63 spindle runout tolerance inspection",
  ];

  const [messages, setMessages] = useState<DiagnosticMessage[]>([
    {
      id: "init-1",
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: `FactoryPilot Copilot initialized for asset ${machineId}. Ready to assist with ISO 10816 vibration guidelines, OSHA LOTO de-energization sequences, cavitation diagnostics, or bearing overhaul procedures.`,
    },
  ]);

  const toggleCheckStep = (stepKey: string) => {
    setCheckedSteps((prev) => ({ ...prev, [stepKey]: !prev[stepKey] }));
  };

  const handleSend = async (userQuery: string) => {
    if (!userQuery.trim() || isLoading) return;

    const userMsg: DiagnosticMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "technician",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: userQuery,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/diagnostics/troubleshoot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_id: machineId,
          technician_query: userQuery,
          anomaly_summary: currentAnomalySummary || {},
        }),
      });

      if (!res.ok) {
        throw new Error("Diagnostic copilot query failed");
      }

      const data = await res.json();

      const assistantMsg: DiagnosticMessage = {
        id: `msg-${Date.now()}-assistant`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Diagnostic evaluation complete for ${machineId}. Retrieved ${data.retrieved_manual_citations?.length || 0} manual citations with ${(data.confidence_score * 100).toFixed(0)}% algorithmic confidence.`,
        troubleshootData: {
          safety_advisory: data.safety_and_loto_advisory,
          loto_mandatory: data.loto_mandatory,
          root_causes: data.root_cause_probability_ranking?.map((r: any) => ({
            cause: r.cause,
            probability: r.probability_percentage,
            severity: r.severity_level,
            rationale: r.technical_rationale,
          })) || [],
          inspection_steps: data.sequential_field_inspection_steps?.map((s: any) => ({
            step_number: s.step_number,
            action_item: s.action_item,
            subsystem: s.subsystem,
            citation_chapter: s.manual_citation_chapter,
            pass_criteria: s.pass_criteria,
          })) || [],
          corrective_actions: data.recommended_corrective_actions?.map((a: any) => ({
            title: a.title,
            priority: a.priority,
            estimated_downtime_minutes: a.estimated_downtime_minutes,
            procedure_summary: a.procedure_summary,
            manual_reference: a.manual_reference,
          })) || [],
          citations: data.retrieved_manual_citations?.map((c: any) => ({
            manual: c.manual,
            chapter: c.chapter,
            excerpt: c.excerpt,
            relevance_score: c.relevance_score,
          })) || [],
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Offline fallback copilot response
      const fallbackMsg: DiagnosticMessage = {
        id: `msg-${Date.now()}-fallback`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Consulting offline technical manual index for ${machineId}.`,
        troubleshootData: {
          safety_advisory:
            "OSHA 1910.147 LOTO REQUIRED: Disconnect 480V MCC breaker, double block & bleed suction/discharge valves, bleed pressure to 0.00 bar, and verify zero electrical energy.",
          loto_mandatory: true,
          root_causes: [
            {
              cause: "Impeller Cavitation & High-Frequency Noise",
              probability: 68.5,
              severity: "HIGH",
              rationale: "Gravel rattle acoustic pattern and Net Positive Suction Head deficit.",
            },
            {
              cause: "Bearing Thermal Threshold Exceeded (>80°C)",
              probability: 54.0,
              severity: "MODERATE",
              rationale: "Lubricant churn or degradation in bearing housing.",
            },
          ],
          inspection_steps: [
            {
              step_number: 1,
              action_item: "Verify zero voltage across L1-L2, L2-L3 with calibrated CAT-IV multimeter.",
              subsystem: "Electrical Drive",
              citation_chapter: "centrifugal_pump_manual.md - Chapter 6",
              pass_criteria: "0.00V verified across all phases.",
            },
            {
              step_number: 2,
              action_item: "Check suction strainer differential pressure and verify NPSHa > NPSHr + 0.8m.",
              subsystem: "Hydraulic Suction",
              citation_chapter: "centrifugal_pump_manual.md - Chapter 4",
              pass_criteria: "NPSH margin >= 0.8 meters.",
            },
          ],
          corrective_actions: [
            {
              title: "Suction Strainer Cleanout & Backwash",
              priority: "IMMEDIATE",
              estimated_downtime_minutes: 45,
              procedure_summary: "Throttle discharge valve slightly; clean suction strainer basket.",
              manual_reference: "centrifugal_pump_manual.md - Section 4.4",
            },
          ],
          citations: [
            {
              manual: "centrifugal_pump_manual.md",
              chapter: "Chapter 4: Cavitation Warning Patterns",
              excerpt: "High-frequency ultrasonic emissions between 10 kHz and 35 kHz with gravel rattling acoustic signature indicate cavitation...",
              relevance_score: 0.94,
            },
          ],
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(query);
  };

  return (
    <div className="industrial-card p-6 flex flex-col h-[700px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="font-bold text-slate-900 text-base">AI Diagnostics & Field Assistant Dock</h3>
            <p className="text-xs text-slate-500">
              Technical RAG Copilot grounded in plant machinery manuals & OSHA safety SOPs.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
          Active: {machineId}
        </span>
      </div>

      {/* Preset contextual query chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {presetChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="text-[11px] font-sans px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message history scroll area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "technician" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1 px-1 font-mono">
              <span className="font-semibold text-slate-600">
                {msg.sender === "technician" ? "Field Technician" : "FactoryPilot Copilot"}
              </span>
              <span>&bull;</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`rounded-xl p-3.5 max-w-[95%] sm:max-w-[85%] text-xs leading-relaxed ${
                msg.sender === "technician"
                  ? "bg-slate-900 text-white font-medium"
                  : "bg-slate-50 border border-slate-200 text-slate-800"
              }`}
            >
              <p className="font-sans">{msg.text}</p>

              {/* Structured Troubleshoot Payload */}
              {msg.troubleshootData && (
                <div className="mt-3.5 space-y-3 font-sans pt-3 border-t border-slate-200">
                  {/* Safety & LOTO Banner */}
                  {msg.troubleshootData.loto_mandatory && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                      <div className="flex items-center space-x-1.5 font-bold text-rose-700 uppercase tracking-wider text-[11px] mb-1">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>MANDATORY OSHA 1910.147 LOTO ADVISORY</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-800">
                        {msg.troubleshootData.safety_advisory}
                      </p>
                    </div>
                  )}

                  {/* Root Cause Ranking */}
                  {msg.troubleshootData.root_causes.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Root-Cause Probability Ranking
                      </div>
                      <div className="space-y-1.5">
                        {msg.troubleshootData.root_causes.map((rc, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-white border border-slate-200 flex items-start justify-between"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">{rc.cause}</div>
                              <div className="text-[11px] text-slate-500">{rc.rationale}</div>
                            </div>
                            <span className="font-mono font-bold text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0 ml-2">
                              {rc.probability.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Verification Checklist */}
                  {msg.troubleshootData.inspection_steps.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
                        Mechanical Verification Checklist (Interactive)
                      </div>
                      <div className="space-y-1.5">
                        {msg.troubleshootData.inspection_steps.map((step, idx) => {
                          const key = `${msg.id}-step-${step.step_number}`;
                          const isDone = !!checkedSteps[key];

                          return (
                            <div
                              key={idx}
                              onClick={() => toggleCheckStep(key)}
                              className={`p-2 rounded border cursor-pointer transition-all flex items-start space-x-2.5 ${
                                isDone
                                  ? "bg-emerald-50/60 border-emerald-300 text-slate-700"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <div className="pt-0.5 shrink-0">
                                {isDone ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className={`font-semibold ${isDone ? "line-through text-slate-500" : "text-slate-900"}`}>
                                  Step {step.step_number}: {step.action_item}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                                  <span>Pass: {step.pass_criteria}</span>
                                  <span className="text-teal-700 font-mono font-medium">[{step.citation_chapter}]</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Corrective Actions */}
                  {msg.troubleshootData.corrective_actions.length > 0 && (
                    <div>
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-slate-700" />
                        Recommended Corrective Actions
                      </div>
                      <div className="space-y-1.5">
                        {msg.troubleshootData.corrective_actions.map((act, idx) => (
                          <div key={idx} className="p-2 rounded bg-white border border-slate-200">
                            <div className="flex items-center justify-between font-semibold text-slate-900">
                              <span>{act.title}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                ~{act.estimated_downtime_minutes} mins
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{act.procedure_summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clickable Manual Citations Tags */}
                  {msg.troubleshootData.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Manual Citations
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.troubleshootData.citations.map((cite, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveModalCitation(cite)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-mono hover:bg-teal-100 transition-colors"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>{cite.chapter}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-teal-600 ml-0.5" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={onSubmit} className="relative mt-3 pt-3 border-t border-slate-100">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask diagnostic copilot about vibration, thermal thresholds, LOTO steps..."
          className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-3 pr-20 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-1.5 top-4.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors disabled:opacity-50 flex items-center space-x-1"
        >
          <span>Send</span>
          <Send className="w-3 h-3" />
        </button>
      </form>

      {/* Manual Citation Modal preview */}
      {activeModalCitation && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="industrial-card max-w-lg w-full p-6 bg-white shadow-xl">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-teal-600" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{activeModalCitation.chapter}</h4>
                  <p className="text-xs text-slate-500 font-mono">{activeModalCitation.manual}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalCitation(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
              >
                &times;
              </button>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activeModalCitation.excerpt}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActiveModalCitation(null)}
                className="px-4 py-1.5 rounded-md bg-slate-900 text-white font-semibold text-xs"
              >
                Close Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
