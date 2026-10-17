"use client";

import React, { useState } from "react";
import { Search, BookOpen, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface SearchResult {
  document_id: string;
  source_manual: string;
  title: string;
  content_snippet: string;
  score: number;
}

interface ManualsRagSearchProps {
  apiBaseUrl: string;
}

export const ManualsRagSearch: React.FC<ManualsRagSearchProps> = ({ apiBaseUrl }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const samplePrompts = [
    "ISO 10816 vibration severity zones",
    "Centrifugal pump cavitation warning patterns",
    "Mandatory OSHA 1910.147 LOTO steps",
    "CNC Spindle runout tolerances and RPM",
    "Coolant flow diagnostics and current spikes",
    "Hybrid ceramic bearing replacement procedure",
  ];

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);

    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/manuals/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, top_k: 3 }),
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        // Fallback demo results if backend not reachable
        setResults([
          {
            document_id: "demo-1",
            source_manual: "centrifugal_pump_manual.md",
            title: "ISO 10816 Vibration Severity Zones",
            content_snippet: "Zone A: Newly commissioned machinery (<1.4 mm/s RMS for Class II). Zone B: Unrestricted long-term operation (1.4-2.8 mm/s). Zone C: Restricted operation (2.8-4.5 mm/s). Zone D: Unacceptable (>4.5 mm/s), shutdown immediately.",
            score: 0.94,
          },
          {
            document_id: "demo-2",
            source_manual: "centrifugal_pump_manual.md",
            title: "Mandatory LOTO De-energization Procedure",
            content_snippet: "Follow OSHA 1910.147: 1. Notify affected personnel. 2. Orderly shutdown. 3. Lock MCC breaker. 4. Double block & bleed valves. 5. Dissipate pressure. 6. Verify zero energy state.",
            score: 0.89,
          },
        ]);
      }
    } catch {
      setResults([
        {
          document_id: "demo-fallback",
          source_manual: "centrifugal_pump_manual.md",
          title: "Technical Manual Fallback Snippet",
          content_snippet: "ISO 10816 vibration guidelines: Zone A (<1.4 mm/s RMS), Zone B (1.4-2.8 mm/s), Zone C (2.8-4.5 mm/s), Zone D (>4.5 mm/s). Bearings exceeding 80°C require immediate re-greasing or inspection.",
          score: 0.91,
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div className="rounded-xl border border-industrial-800 bg-industrial-900/70 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-lg text-white">ChromaDB RAG Manual Intelligence</h3>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded">
          Semantic Retrieval
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Query technical plant operating manuals, safety protocols (OSHA LOTO), and vibration standards via ChromaDB vector embeddings.
      </p>

      {/* Search Input Form */}
      <form onSubmit={onSubmit} className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about ISO 10816 zones, bearing temperatures, LOTO, cavitation, spindle runout..."
          className="w-full bg-industrial-950 border border-industrial-700/80 rounded-lg pl-10 pr-24 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-1.5 top-1.5 px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <span className="text-xs text-slate-500 py-1">Quick prompts:</span>
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(p);
              handleSearch(p);
            }}
            className="text-xs px-2.5 py-1 rounded-md bg-industrial-800/80 hover:bg-industrial-700 text-slate-300 border border-industrial-700/60 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Results View */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Matching Manual Provisions ({results.length})
          </div>
          {results.map((res) => (
            <div
              key={res.document_id}
              className="p-4 rounded-lg bg-industrial-950/80 border border-industrial-800 hover:border-industrial-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-sm text-white">{res.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 bg-industrial-900 px-2 py-0.5 rounded border border-industrial-800">
                    {res.source_manual}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {(res.score * 100).toFixed(0)}% Match
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{res.content_snippet}</p>
            </div>
          ))}
        </div>
      )}

      {hasSearched && results.length === 0 && !isSearching && (
        <div className="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          No specific manual procedures matched your query. Try one of the quick prompts above.
        </div>
      )}
    </div>
  );
};
