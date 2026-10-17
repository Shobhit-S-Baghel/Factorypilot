"use client";

import React from "react";
import { Gauge, Flame, RefreshCw, Zap, Volume2, ShieldAlert } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number | string;
  unit: string;
  subtext?: string;
  badge?: string;
  status?: "nominal" | "warning" | "critical" | "active";
  iconName: "gauge" | "flame" | "rpm" | "zap" | "volume";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  badge,
  status = "nominal",
  iconName,
}) => {
  const getIcon = () => {
    switch (iconName) {
      case "gauge":
        return <Gauge className="w-4 h-4 text-teal-600" />;
      case "flame":
        return <Flame className="w-4 h-4 text-amber-500" />;
      case "rpm":
        return <RefreshCw className="w-4 h-4 text-slate-600" />;
      case "zap":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "volume":
        return <Volume2 className="w-4 h-4 text-teal-600" />;
    }
  };

  const getBorderAndBg = () => {
    switch (status) {
      case "warning":
        return "border-amber-200 bg-amber-50/40 glow-warning";
      case "critical":
        return "border-rose-200 bg-rose-50/50 glow-critical";
      case "active":
        return "border-teal-200 bg-teal-50/30";
      default:
        return "border-slate-200 bg-white hover:border-slate-300";
    }
  };

  const getBadgeClass = () => {
    if (!badge) return "";
    if (badge.includes("Zone A")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (badge.includes("Zone B")) return "bg-teal-50 text-teal-700 border-teal-200";
    if (badge.includes("Zone C") || badge.includes("Warning")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (badge.includes("Zone D") || badge.includes("Critical")) return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className={`industrial-card p-4 transition-all duration-150 ${getBorderAndBg()}`}>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span className="font-medium text-slate-600">{label}</span>
        <div className="p-1 rounded bg-slate-50 border border-slate-100">{getIcon()}</div>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {typeof value === "number" ? value.toFixed(1) : value}
          </span>
          <span className="text-xs font-mono text-slate-500">{unit}</span>
        </div>

        {badge && (
          <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-full border ${getBadgeClass()}`}>
            {badge}
          </span>
        )}
      </div>

      {subtext && <p className="text-[11px] text-slate-500 mt-2 font-sans">{subtext}</p>}
    </div>
  );
};
