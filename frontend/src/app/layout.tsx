import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "FactoryPilot | Predictive Maintenance & AI Diagnostic Copilot",
  description:
    "Production-grade industrial machine telemetry monitoring, ISO 10816 vibration analytics, sub-component fault localization, and automated technical manual RAG copilot.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-black flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">FactoryPilot Industrial AI</span>
              <span className="text-slate-400">•</span>
              <span>OSHA 29 CFR 1910.147 (LOTO) & ISO 10816 Compliant</span>
            </div>
            <div className="flex items-center space-x-4 text-slate-400">
              <span className="text-[11px]">Sub-Component Fault Identification Engine</span>
              <span>•</span>
              <span className="text-[11px]">ChromaDB Technical Manual RAG</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
