"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  Activity,
  ShieldCheck,
  Radio,
  FileText,
  BrainCircuit,
  Menu,
  X,
  ArrowRight,
  Layers,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const NAV_LINKS = [
  {
    href: "/",
    label: "Overview",
    sublabel: "Home",
    icon: Activity,
  },
  {
    href: "/telemetry",
    label: "Plant Operations",
    sublabel: "Telemetry Sandbox",
    icon: Radio,
  },
  {
    href: "/copilot",
    label: "AI Copilot",
    sublabel: "Troubleshooting Assistant",
    icon: BrainCircuit,
  },
  {
    href: "/architecture",
    label: "Architecture",
    sublabel: "How AI Agents Work",
    icon: Layers,
  },
];

interface NavbarProps {
  backendStatus?: string;
  chromaStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendStatus: propBackendStatus,
  chromaStatus: propChromaStatus,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [internalStatus, setInternalStatus] = useState<string>("healthy");

  useEffect(() => {
    if (propBackendStatus) return;
    const check = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (res.ok) setInternalStatus("healthy");
        else setInternalStatus("degraded");
      } catch {
        setInternalStatus("offline (mock)");
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => clearInterval(interval);
  }, [propBackendStatus]);

  const backendStatus = propBackendStatus || internalStatus;
  const chromaStatus = propChromaStatus || "ready";

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform duration-200">
              <Cpu className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">FactoryPilot</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  PROD v0.3.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Industrial AI Maintenance Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Status Indicators & CTA */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div
                className={`w-2 h-2 rounded-full ${
                  backendStatus === "healthy"
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              <span className="text-slate-500 font-medium">FastAPI:</span>
              <span className="font-mono font-bold text-slate-800 text-[11px]">
                {backendStatus.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>OSHA 1910.147</span>
            </div>

            <Link
              href="/telemetry"
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs hover:shadow-sm transition-all"
            >
              <span>Sandbox</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/telemetry"
              className="px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Sandbox
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
                <div>
                  <div className="font-bold">{link.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{link.sublabel}</div>
                </div>
              </Link>
            );
          })}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>FastAPI: <strong className="text-slate-800">{backendStatus.toUpperCase()}</strong></span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> OSHA LOTO Ready
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
