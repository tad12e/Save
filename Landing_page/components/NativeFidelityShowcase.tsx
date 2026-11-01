"use client";

import React, { useState } from "react";
import { YouTubeLogo, XLogo, GitHubLogo } from "./BrandLogos";

export default function NativeFidelityShowcase() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [syncedNotion, setSyncedNotion] = useState(false);
  const [outreachQueued, setOutreachQueued] = useState(false);
  const [priceAlertSet, setPriceAlertSet] = useState(false);

  return (
    <section id="previews" className="py-24 border-b border-surface-container-high bg-surface-container-low/30">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-3">
          <span className="font-geist text-xs uppercase tracking-wider text-outline font-semibold block">
            High-Fidelity Canvas
          </span>
          <h2 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
            Native Fidelity — Content rendered exactly as it lives in the wild.
          </h2>
          <p className="font-inter text-sm md:text-base text-on-surface-variant mt-4 leading-relaxed">
            No more sterile generic text abstracts. Every service you save is rendered with original structural styling, rich media controllers, and specialized actionable triggers.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: YouTube Tech Talk */}
          <div className="bg-white rounded-[24px] border border-surface-container-high p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-2 font-code">
                  <YouTubeLogo size={16} className="shrink-0" />
                  <span>youtube.com/watch?v=k9Xq1</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-geist text-xs font-medium">
                  learn
                </span>
              </div>

              {/* Media Preview Mockup */}
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="aspect-video w-full rounded-xl bg-zinc-900 relative overflow-hidden flex flex-col justify-end p-4 shadow-xs cursor-pointer group"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                      isPlaying
                        ? "bg-rose-600/90 scale-105"
                        : "bg-white/20 group-hover:scale-110"
                    }`}
                  >
                    <span className="material-symbols-outlined text-white text-[28px]">
                      {isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </div>
                </div>

                {isPlaying && (
                  <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-code flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Streaming 1080p60</span>
                  </div>
                )}

                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-black/60 text-white font-code text-[11px]">
                      {isPlaying ? "12:15 / 42:18" : "42:18"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-600/90 text-white font-code text-[11px]">
                      AI Keyframe Marker
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium drop-shadow-sm font-geist">
                    Building Distributed State Machines with Rust & Raft
                  </p>
                </div>
              </div>

              {/* AI Key points */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high space-y-1.5 text-xs text-on-surface-variant">
                <div className={`flex items-start gap-2 p-1 rounded transition-colors ${isPlaying ? "bg-rose-50/70" : ""}`}>
                  <span className="text-rose-600 font-bold font-code">12:15</span>
                  <span className={isPlaying ? "text-rose-900 font-medium" : ""}>
                    Consensus log replication under partitions. {isPlaying && "◀ Currently playing"}
                  </span>
                </div>
                <div className="flex items-start gap-2 p-1">
                  <span className="text-primary font-bold font-code">28:40</span>
                  <span>Benchmarking against Hazelcast and Etcd.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
              <span className="text-xs font-code text-outline">Action: Export Transcript</span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all font-geist cursor-pointer flex items-center gap-1.5 ${
                  isPlaying
                    ? "bg-rose-100 text-rose-800 border border-rose-300 font-semibold"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
                <span>{isPlaying ? "Pause at 12:15" : "Resume at 12:15"}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Twitter / Reddit Thread */}
          <div className="bg-white rounded-[24px] border border-surface-container-high p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-2 font-code">
                  <XLogo size={16} className="shrink-0" />
                  <span>x.com/karpathy/status/17492</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-geist text-xs font-medium">
                  learn
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-primary font-geist">
                    AK
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-on-surface font-geist">
                      Andrej Karpathy
                    </div>
                    <div className="text-xs text-outline font-code">@karpathy</div>
                  </div>
                </div>

                <p className="text-sm text-on-surface leading-relaxed font-inter">
                  The hottest new programming language is English. LLMs are changing the compile target from ASTs directly to executing runtime environments...
                </p>

                <div className="flex items-center gap-4 text-xs text-outline font-code">
                  <span>💬 4.2k Replies</span>
                  <span>🔁 12.8k Reposts</span>
                  <span>❤️ 68k Likes</span>
                </div>
              </div>

              {/* Sentiment Module */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container-high text-xs text-on-surface-variant flex items-center justify-between">
                <span>Sentiment Analysis: Constructive / Visionary</span>
                <span className="text-primary font-medium">9 Replies by Researchers</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
              <span className="text-xs font-code text-outline">Action: Unroll Thread</span>
              <button
                onClick={() => setSyncedNotion(!syncedNotion)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all font-geist cursor-pointer flex items-center gap-1.5 ${
                  syncedNotion
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {syncedNotion ? "check_circle" : "sync"}
                </span>
                <span>{syncedNotion ? "Synced to Notion ✓" : "Save Citations to Notion"}</span>
              </button>
            </div>
          </div>

          {/* Card 3: GitHub Repo */}
          <div className="bg-white rounded-[24px] border border-surface-container-high p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-2 font-code">
                  <GitHubLogo size={16} className="shrink-0" />
                  <span>github.com/astral-sh/uv</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-geist text-xs font-medium">
                  track
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitHubLogo size={20} className="shrink-0" />
                    <span className="font-semibold text-sm text-on-surface font-geist">
                      astral-sh / uv
                    </span>
                  </div>
                  <span className="font-code text-xs px-2 py-0.5 bg-surface-container-high rounded text-on-surface font-medium">
                    ★ 34.2k
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed font-inter">
                  An extremely fast Python package and project manager, written in Rust. 10-100x faster than pip.
                </p>

                {/* Commit activity cadence bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-code text-outline">
                    <span>Commit cadence</span>
                    <span className="text-emerald-600 font-medium">+14 commits this week</span>
                  </div>
                  <div className="flex gap-1 h-3">
                    <div className="bg-emerald-200 flex-1 rounded-sm" />
                    <div className="bg-emerald-400 flex-1 rounded-sm" />
                    <div className="bg-emerald-600 flex-1 rounded-sm" />
                    <div className="bg-emerald-500 flex-1 rounded-sm" />
                    <div className="bg-emerald-700 flex-1 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
              <span className="text-xs font-code text-outline">Action: Release Tracker</span>
              <button
                onClick={() => setOutreachQueued(!outreachQueued)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all font-geist cursor-pointer flex items-center gap-1.5 ${
                  outreachQueued
                    ? "bg-blue-100 text-blue-800 border border-blue-300 font-semibold"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {outreachQueued ? "task_alt" : "send"}
                </span>
                <span>{outreachQueued ? "Queued in Outreach ✓" : "Queue 1-Click Outreach"}</span>
              </button>
            </div>
          </div>

          {/* Card 4: E-Commerce Deal */}
          <div className="bg-white rounded-[24px] border border-surface-container-high p-6 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-colors">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5 font-code">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>teenage.engineering/store/op-xy</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-geist text-xs font-medium">
                  buy
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-on-surface font-geist">
                    Teenage Engineering OP-XY Synthesizer
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200">
                    -15% Detected
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-geist text-xl font-bold text-on-surface">$1,999.00</span>
                  <span className="text-xs text-outline line-through">$2,299.00</span>
                </div>

                {/* Price History Bar */}
                <div className="p-2.5 bg-surface-container rounded-lg text-xs font-code space-y-1">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>90-Day Low Detected</span>
                    <span className="text-emerald-600 font-semibold">Active Window</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="w-2/3 bg-emerald-500 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-surface-container-high flex items-center justify-between">
              <span className="text-xs font-code text-outline">Action: Auto-Checkout Watch</span>
              <button
                onClick={() => setPriceAlertSet(!priceAlertSet)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-all font-geist cursor-pointer flex items-center gap-1.5 ${
                  priceAlertSet
                    ? "bg-amber-100 text-amber-900 border border-amber-300 font-semibold"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {priceAlertSet ? "notifications_active" : "notification_add"}
                </span>
                <span>{priceAlertSet ? "Alert Active (-15%) ✓" : "Set Price Drop Alert"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
