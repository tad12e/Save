"use client";

import React from "react";

export default function DualCoreIntelligence() {
  return (
    <section id="intent" className="py-24 border-b border-surface-container-high bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Headline */}
        <div className="max-w-3xl mb-16 space-y-3">
          <span className="font-geist text-xs uppercase tracking-wider text-outline font-semibold block">
            Engine Architecture
          </span>
          <h2 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
            Two systems, one unified intelligence layer.
          </h2>
          <p className="font-inter text-sm md:text-base text-on-surface-variant mt-4 leading-relaxed">
            Save splits intent processing between a client-side heuristic circuit for sub-millisecond sorting and an asynchronous LLM pipeline for deep unstructured parsing.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Card 1: Dual-Tier Intent Detection */}
          <div className="p-8 rounded-[24px] bg-white border border-surface-container-high flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[22px]">schema</span>
              </div>
              <h3 className="font-geist text-xl font-semibold text-on-surface mb-3">
                Dual-Tier Intent Detection
              </h3>
              <p className="font-inter text-sm text-on-surface-variant mb-6 leading-relaxed">
                Instant rule-based matching runs synchronously on page load, followed by background Gemini contextual parsing into 7 core action intents.
              </p>

              {/* Intent Pills Display */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 mb-6">
                {[
                  { name: "apply", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                  { name: "learn", color: "text-blue-700 bg-blue-50 border-blue-200" },
                  { name: "buy", color: "text-amber-700 bg-amber-50 border-amber-200" },
                  { name: "attend", color: "text-pink-700 bg-pink-50 border-pink-200" },
                  { name: "hire", color: "text-teal-700 bg-teal-50 border-teal-200" },
                  { name: "track", color: "text-orange-700 bg-orange-50 border-orange-200" },
                  { name: "other", color: "text-zinc-700 bg-zinc-50 border-zinc-200 col-span-2" },
                ].map((intent) => (
                  <div
                    key={intent.name}
                    className={`p-2 rounded-lg border text-center font-code text-xs font-medium ${intent.color}`}
                  >
                    {intent.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant font-code">
              <span>0ms Heuristic Rule Pass</span>
              <span className="text-primary font-medium">Auto-Route Validated</span>
            </div>
          </div>

          {/* Card 2: Temporal Intelligence & Deadlines */}
          <div className="p-8 rounded-[24px] bg-white border border-surface-container-high flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[22px]">hourglass_top</span>
              </div>
              <h3 className="font-geist text-xl font-semibold text-on-surface mb-3">
                Temporal Intelligence & Deadlines
              </h3>
              <p className="font-inter text-sm text-on-surface-variant mb-6 leading-relaxed">
                Never miss an expiration date, grant cycle, concert presale, or job window. Dates are auto-bound to iCal, Google Calendar, and push alerts.
              </p>

              {/* Temporal Visualizer */}
              <div className="space-y-3 mb-6 bg-surface-container-low p-4 rounded-xl border border-surface-container-high">
                <div className="flex items-center justify-between text-xs font-code">
                  <span className="text-on-surface font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-error" />
                    <span>Critical Alert (&lt;48h window)</span>
                  </span>
                  <span className="text-outline">Trigger: Push & SMS</span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full w-3/4" />
                </div>
                <p className="text-[11px] text-on-surface-variant font-code">
                  RFC 3339 parsed: 2026-04-12T18:00:00Z → Synced with Calendar Bridge
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-container-high flex items-center justify-between text-xs text-on-surface-variant font-code">
              <span>Autonomous Cron Evaluator</span>
              <span className="text-primary font-medium">99.98% Accuracy</span>
            </div>
          </div>
        </div>

        {/* Synthesis Engine Showcase Banner (Smooth Soft Pastel Ambient Blend - No Harsh Cuts) */}
        <div className="mb-8 p-6 md:p-8 rounded-[2rem] bg-gradient-to-r from-rose-50/70 via-purple-50/60 to-amber-50/70 border border-zinc-200/80 shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-200/70">
            <div>
              <h4 className="font-geist text-lg sm:text-xl font-semibold text-on-surface">
                Real-Time Action Synthesis Engine
              </h4>
              <p className="text-xs text-on-surface-variant font-code mt-0.5">
                Autonomous Pipeline v2.4 — Live Dispatch Cluster
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-code text-emerald-700 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Zero Human Intervention</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs text-on-surface-variant font-code block mb-1">
                Incoming Stream
              </span>
              <div className="font-geist text-2xl font-bold text-on-surface">1,420 clips/sec</div>
              <span className="text-[11px] text-emerald-600 font-code font-medium">✓ Buffer healthy</span>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs text-on-surface-variant font-code block mb-1">
                Intent Resolution
              </span>
              <div className="font-geist text-2xl font-bold text-on-surface">14.8ms</div>
              <span className="text-[11px] text-indigo-600 font-code font-medium">⚡ Deterministic & LLM pass</span>
            </div>
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-zinc-200/80 shadow-xs">
              <span className="text-xs text-on-surface-variant font-code block mb-1">
                Database Sync Target
              </span>
              <div className="font-geist text-2xl font-bold text-on-surface">100% Lossless</div>
              <span className="text-[11px] text-emerald-600 font-code font-medium">⟳ Notion / Sheets / Airtable</span>
            </div>
          </div>
        </div>

        {/* Telemetry Card (Wide 3-Column Stats) */}
        <div className="p-8 rounded-[24px] bg-white border border-surface-container-high shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-surface-container-high">
            <div className="space-y-1">
              <span className="font-geist text-xs uppercase tracking-wider text-outline font-semibold">
                Network Propagation
              </span>
              <div className="font-geist text-4xl font-bold text-on-surface">88ms</div>
              <p className="font-code text-xs text-on-surface-variant">P95 Global Sync Latency</p>
            </div>
            <div className="space-y-1 md:pl-8 pt-6 md:pt-0">
              <span className="font-geist text-xs uppercase tracking-wider text-outline font-semibold">
                Intent Certainty
              </span>
              <div className="font-geist text-4xl font-bold text-on-surface">99.8%</div>
              <p className="font-code text-xs text-on-surface-variant">Classification Confidence</p>
            </div>
            <div className="space-y-1 md:pl-8 pt-6 md:pt-0">
              <span className="font-geist text-xs uppercase tracking-wider text-outline font-semibold">
                Cognitive Throughput
              </span>
              <div className="font-geist text-4xl font-bold text-on-surface">14.2</div>
              <p className="font-code text-xs text-on-surface-variant">Clips/wk Reading Velocity</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

