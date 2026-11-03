"use client";

import React from "react";
import { APP_ROUTES } from "../lib/routes";

export default function CTASection() {
  return (
    <section
      id="cta"
      className="py-24 md:py-32 bg-gradient-to-b from-surface via-[#F5F9FE] to-[#E8F2FD] text-center relative overflow-hidden"
    >
      {/* Soft Ambient Warm Glow */}
      <div className="absolute inset-0 flex items-center justify-center -z-10 pointer-events-none">
        <div className="w-[500px] h-[250px] bg-gradient-to-tr from-blue-100/30 via-sky-100/20 to-indigo-100/20 blur-3xl rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <span className="font-geist text-xs uppercase tracking-widest text-outline font-semibold block">
          Ready for Clarity
        </span>

        <h2 className="font-geist text-3xl sm:text-5xl md:text-6xl text-on-surface font-semibold tracking-[-0.035em] leading-[1.1]">
          Turn passive bookmarks into active intelligence.
        </h2>

        <p className="font-inter text-sm sm:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
          Stop saving links into dead browser folders. Experience how intent-based capture and real-time syncing modernize your daily information ingestion.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <a
            href={APP_ROUTES.signUp}
            className="h-11 px-7 rounded-full bg-primary text-white font-geist text-xs font-semibold inline-flex items-center gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98] shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Get Started Free</span>
          </a>
          <a
            href={APP_ROUTES.signIn}
            className="h-11 px-7 rounded-full bg-white/90 backdrop-blur-sm border border-zinc-200 text-on-surface font-geist text-xs font-semibold inline-flex items-center gap-2 hover:bg-white transition-all active:scale-[0.98] shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px]">desktop_windows</span>
            <span>Open Web Vault</span>
          </a>
        </div>

        {/* 3 Platforms Quick Badge Strip */}
        <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-code text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Chrome &amp; Safari Extension</span>
          </span>
          <span className="text-zinc-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Web App: app.save.io</span>
          </span>
          <span className="text-zinc-300">•</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span>iOS &amp; Android Flutter App</span>
          </span>
        </div>
      </div>
    </section>
  );
}