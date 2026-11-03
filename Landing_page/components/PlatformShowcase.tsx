"use client";

import React from "react";
import { APP_ROUTES } from "../lib/routes";
import {
  ChromeLogo,
  SafariLogo,
  AppleLogo,
  AndroidLogo,
  NotionLogo,
  GoogleSheetsLogo,
} from "./BrandLogos";

export default function PlatformShowcase() {
  return (
    <section id="platforms" className="py-24 border-b border-surface-container-high bg-surface-container-low/30 relative overflow-hidden">
      {/* Soft Ambient Warm Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] bg-gradient-to-tr from-sky-100/50 via-purple-100/40 to-emerald-100/40 blur-3xl rounded-full pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-geist text-[11px] uppercase tracking-widest text-emerald-800 font-semibold">
              TRI-PLATFORM ECOSYSTEM
            </span>
          </div>

          <h2 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
            One synchronized vault.
            <br />
            Three native surfaces.
          </h2>

          <p className="font-inter text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
            Capture with 1-click in your desktop browser, review and search in the web vault, and save effortlessly on your phone with native iOS & Android share sheets.
          </p>
        </div>

        {/* 3-Card Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ============================================================ */}
          {/* CARD 1: BROWSER EXTENSION                                   */}
          {/* ============================================================ */}
          <div className="rounded-[28px] bg-white border border-surface-container-high p-7 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-all group">
            <div className="space-y-6">
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-surface-container-low border border-zinc-200">
                    <ChromeLogo size={20} />
                  </div>
                  <div className="p-1.5 rounded-xl bg-surface-container-low border border-zinc-200">
                    <SafariLogo size={20} />
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-code text-[11px] font-semibold">
                  v2.4 Live
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-outline font-geist font-semibold block mb-1">
                  Desktop Browser Extension
                </span>
                <h3 className="font-geist text-2xl font-semibold text-on-surface mb-2">
                  1-Click Universal Clipper
                </h3>
                <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                  Clip full articles, YouTube timestamps, research PDFs, and product deals without leaving your tab. Features zero-latency DOM extraction and automated intent detection.
                </p>
              </div>

              {/* Visual Mockup: Extension Popup */}
              <div className="rounded-2xl bg-surface-container-low/70 border border-zinc-200 p-4 font-code text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-zinc-900 font-geist font-bold">Yazem Extension</span>
                  </div>
                  <kbd className="px-2 py-0.5 rounded bg-white border border-zinc-300 text-[10px] text-zinc-600 shadow-2xs">
                    ⌘ + S
                  </kbd>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Detected Intent</span>
                    <span className="text-emerald-700 font-semibold uppercase">apply (99.8%)</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Deadline</span>
                    <span className="text-amber-700 font-medium">38h left (Synced)</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Target Route</span>
                    <span className="text-zinc-900 font-medium">Notion Jobs & Sheets</span>
                  </div>
                </div>
              </div>

              {/* Bullet Features */}
              <ul className="space-y-2 text-xs font-inter text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Keyboard shortcut <code>⌘ + S</code> or context-menu clip</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Instant 0ms heuristic classification</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Chrome, Safari, Arc, Firefox, and Edge</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-surface-container-high">
              <a
                href="#download"
                className="w-full h-10 rounded-xl bg-primary text-white font-geist text-xs font-medium inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-xs"
              >
                <ChromeLogo size={16} />
                <span>Add to Chrome (Free)</span>
              </a>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CARD 2: WEB VAULT (app.save.io)                              */}
          {/* ============================================================ */}
          <div className="rounded-[28px] bg-white border border-surface-container-high p-7 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-all group">
            <div className="space-y-6">
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold font-geist">
                    S.
                  </div>
                  <span className="font-geist text-xs font-semibold text-zinc-900">
                    app.save.io
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-code text-[11px] font-semibold">
                  Desktop Web
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-outline font-geist font-semibold block mb-1">
                  Desktop Command Center
                </span>
                <h3 className="font-geist text-2xl font-semibold text-on-surface mb-2">
                  The Knowledge Vault
                </h3>
                <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                  Your central intelligence headquarters. Execute semantic vector searches with Gemini embeddings, organize action queues, and manage bi-directional destination pipelines.
                </p>
              </div>

              {/* Visual Mockup: Web App Dashboard */}
              <div className="rounded-2xl bg-surface-container-low/70 border border-zinc-200 p-4 font-code text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <span className="text-zinc-500 text-[11px]">Vault Search & Filter</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Vector pgvector</span>
                </div>

                <div className="space-y-2">
                  <div className="p-2 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-800 font-medium truncate font-geist">
                      Staff Product Designer — Systems
                    </span>
                    <span className="text-emerald-700 font-semibold shrink-0">apply</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-zinc-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-800 font-medium truncate font-geist">
                      Scaling Laws for Neural Action Planners
                    </span>
                    <span className="text-indigo-700 font-semibold shrink-0">learn</span>
                  </div>
                </div>
              </div>

              {/* Bullet Features */}
              <ul className="space-y-2 text-xs font-inter text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Natural language semantic search (Gemini AI)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Distraction-free unrolled reader mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Bi-directional sync to Notion, Sheets & Airtable</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-surface-container-high">
              <a
                href={APP_ROUTES.signIn}
                className="w-full h-10 rounded-xl bg-surface-container-low border border-zinc-200 text-on-surface font-geist text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white hover:border-zinc-300 transition-colors shadow-2xs"
              >
                <span>Launch Web Vault</span>
                <span className="material-symbols-outlined text-[16px]">north_east</span>
              </a>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CARD 3: MOBILE APP (FLUTTER IOS & ANDROID)                   */}
          {/* ============================================================ */}
          <div className="rounded-[28px] bg-white border border-surface-container-high p-7 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-all group">
            <div className="space-y-6">
              {/* Card Header & Badges */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-surface-container-low border border-zinc-200">
                    <AppleLogo size={18} className="text-zinc-900" />
                  </div>
                  <div className="p-1.5 rounded-xl bg-surface-container-low border border-zinc-200">
                    <AndroidLogo size={18} className="text-emerald-600" />
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 font-code text-[11px] font-semibold">
                  Flutter Native
                </span>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-outline font-geist font-semibold block mb-1">
                  Mobile App (iOS & Android)
                </span>
                <h3 className="font-geist text-2xl font-semibold text-on-surface mb-2">
                  Native Share Sheet & Alerts
                </h3>
                <p className="font-inter text-xs text-on-surface-variant leading-relaxed">
                  Save on the go from any mobile app. Tap the native system Share Sheet in Twitter, Reddit, YouTube, or Safari to ingest links instantly with offline caching and urgent deadline notifications.
                </p>
              </div>

              {/* Visual Mockup: Phone Share Sheet */}
              <div className="rounded-2xl bg-surface-container-low/70 border border-zinc-200 p-4 font-code text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-purple-600">
                      ios_share
                    </span>
                    <span className="text-zinc-900 font-geist font-bold">System Share Sheet</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    1-Tap Clip
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-zinc-200/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-geist">
                    <span className="font-semibold text-zinc-900">Saved to Vault</span>
                    <span className="text-emerald-600 font-code font-bold">Synced ✓</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-inter truncate">
                    twitter.com/karpathy/status/17492
                  </p>
                </div>
              </div>

              {/* Bullet Features */}
              <ul className="space-y-2 text-xs font-inter text-on-surface-variant">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Native iOS & Android system share sheet</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Push notification alerts before deadlines expire</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check</span>
                  <span>Offline article reader & biometric vault lock</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t border-surface-container-high flex gap-2">
              <a
                href="#mobile"
                className="flex-1 h-10 rounded-xl bg-surface-container-low border border-zinc-200 text-on-surface font-geist text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white hover:border-zinc-300 transition-colors shadow-2xs"
              >
                <AppleLogo size={14} className="text-zinc-900" />
                <span>iOS</span>
              </a>
              <a
                href="#mobile"
                className="flex-1 h-10 rounded-xl bg-surface-container-low border border-zinc-200 text-on-surface font-geist text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white hover:border-zinc-300 transition-colors shadow-2xs"
              >
                <AndroidLogo size={14} className="text-emerald-600" />
                <span>Android</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

