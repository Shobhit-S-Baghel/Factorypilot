"use client";

import React from "react";
import { Activity, ShieldCheck, Cpu, HardDrive } from "lucide-react";

interface NavbarProps {
  backendStatus: string;
  chromaStatus: string;
}

export const Navbar: React.FC<NavbarProps> = ({ backendStatus, chromaStatus }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-industrial-800 bg-industrial-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Cpu className="w-6 h-6 text-black" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">FactoryPilot</span>
              <span className="px-2 py-0.5 text-xs font-mono font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PROD v0.1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Industrial Asset Telemetry & Diagnostics</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-industrial-800/60 border border-industrial-700/50 text-xs">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="text-slate-300">FastAPI Backend:</span>
            <span className={`font-mono font-semibold ${backendStatus === "healthy" ? "text-emerald-400" : "text-amber-400"}`}>
              {backendStatus.toUpperCase()}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-industrial-800/60 border border-industrial-700/50 text-xs">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">ChromaDB RAG:</span>
            <span className="font-mono font-semibold text-cyan-400">
              {chromaStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-semibold">OSHA LOTO Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};
