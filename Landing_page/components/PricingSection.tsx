"use client";

import React, { useState } from "react";
import { APP_ROUTES } from "../lib/routes";

export default function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="pricing" className="py-24 md:py-32 border-b border-surface-container-high bg-surface relative overflow-hidden">
      {/* Soft Ambient Radial Warm Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-100/40 via-sky-100/30 to-purple-100/30 blur-3xl rounded-full pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-geist text-[11px] uppercase tracking-widest text-emerald-800 font-semibold">
              TRANSPARENT & ACCESSIBLE PRICING
            </span>
          </div>

          <h2 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
            Less than a cup of coffee.
            <br />
            <span className="text-outline">Powerful AI memory for life.</span>
          </h2>

          <p className="font-inter text-sm md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Other bookmark managers charge $10 to $12 per month. Save gives you full AI intent classification, bi-directional database sync, and mobile apps for just $2.60/month.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <div className="p-1 rounded-full bg-surface-container-low border border-zinc-200 inline-flex items-center gap-1 shadow-2xs">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 rounded-full text-xs font-geist font-medium transition-all cursor-pointer ${
                  billingCycle === "monthly"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 rounded-full text-xs font-geist font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>Annual Billing</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Save 15%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Tier Balanced Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {/* ============================================================ */}
          {/* TIER 1: FREE STARTER                                         */}
          {/* ============================================================ */}
          <div className="rounded-[28px] bg-white border border-surface-container-high p-8 sm:p-10 flex flex-col justify-between shadow-xs hover:border-zinc-300 transition-all">
            <div className="space-y-6">
              {/* Badge & Title */}
              <div>
                <span className="text-[11px] uppercase tracking-wider text-outline font-geist font-semibold block mb-1">
                  Starter Plan
                </span>
                <h3 className="font-geist text-2xl font-semibold text-on-surface">
                  Free Forever
                </h3>
                <p className="font-inter text-xs text-on-surface-variant mt-1.5">
                  Perfect for casual reading, occasional clips, and evaluating Save.
                </p>
              </div>

              {/* Price */}
              <div className="pt-2 pb-4 border-b border-zinc-100 flex items-baseline gap-2">
                <span className="font-geist text-4xl sm:text-5xl font-bold text-on-surface tracking-tight">
                  $0
                </span>
                <span className="text-xs font-inter text-zinc-500">/ forever free</span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 font-inter text-xs text-zinc-700">
                <span className="text-[10px] uppercase tracking-wider text-outline font-geist font-semibold block">
                  Included in Free:
                </span>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>Up to <strong>100 clips / month</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span><strong>0ms Heuristic Intent Classifier</strong> (7 action intents)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span><strong>Browser Extension</strong> (Chrome, Safari, Arc, Edge)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span><strong>Web Vault Access</strong> (app.save.io)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span><strong>1 Connected Destination</strong> (e.g. 1 Notion database)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <span>Standard full-text keyword search</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-zinc-100">
              <a
                href={APP_ROUTES.signUp}
                className="w-full h-11 rounded-xl bg-surface-container-low border border-zinc-200 text-on-surface font-geist text-xs font-semibold inline-flex items-center justify-center hover:bg-white hover:border-zinc-300 transition-all shadow-2xs active:scale-[0.98]"
              >
                Start Free — No Card Needed
              </a>
            </div>
          </div>

          {/* ============================================================ */}
          {/* TIER 2: PRO VAULT ($2.60 / MO)                               */}
          {/* ============================================================ */}
          <div className="rounded-[28px] bg-white border-2 border-primary/90 p-8 sm:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            {/* Top Highlight Banner */}
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-geist font-bold uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl shadow-xs">
              Most Popular
            </div>

            <div className="space-y-6">
              {/* Badge & Title */}
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-700 font-geist font-semibold block mb-1">
                  Full Power Unlocked
                </span>
                <h3 className="font-geist text-2xl font-semibold text-on-surface">
                  Save Pro
                </h3>
                <p className="font-inter text-xs text-on-surface-variant mt-1.5">
                  Complete AI intelligence, unlimited bi-directional sync, and mobile apps.
                </p>
              </div>

              {/* Price */}
              <div className="pt-2 pb-4 border-b border-zinc-100">
                <div className="flex items-baseline gap-2">
                  <span className="font-geist text-5xl sm:text-6xl font-bold text-on-surface tracking-tight">
                    {billingCycle === "monthly" ? "$2.60" : "$2.58"}
                  </span>
                  <span className="text-xs font-inter text-zinc-500">
                    / month {billingCycle === "annual" ? "(billed $31/yr)" : "(billed monthly)"}
                  </span>
                </div>
                <span className="mt-1.5 inline-block text-[11px] font-code text-emerald-700 font-medium">
                  ✓ Less than a cup of coffee per month
                </span>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 font-inter text-xs text-zinc-800">
                <span className="text-[10px] uppercase tracking-wider text-outline font-geist font-semibold block">
                  Everything in Free, plus:
                </span>
                <ul className="space-y-2.5">
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Unlimited clips & storage</strong> forever</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Gemini AI Deep Summaries</strong> (3-bullet contextual digests)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Automated Deadline Tracker</strong> with mobile push alerts (&lt;48h)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Unlimited 2-Way Sync</strong>: Notion, Sheets, Airtable & Spotify</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Semantic Vector Search</strong> with Gemini <code>pgvector</code></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Model Context Protocol (MCP)</strong> for Claude Desktop & Cursor</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0 mt-0.5">
                      verified
                    </span>
                    <span><strong>Native iOS & Android Apps</strong> with offline reader & Share Sheet</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-zinc-100">
              <a
                href={APP_ROUTES.upgradePro}
                className="w-full h-11 rounded-xl bg-primary text-white font-geist text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-md active:scale-[0.98]"
              >
                <span>Upgrade to Pro — $2.60/mo</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </a>
              <p className="text-[10px] text-center text-zinc-500 font-inter mt-2.5">
                14-day free trial • Cancel anytime with 1 click
              </p>
            </div>
          </div>
        </div>

        {/* Enterprise & Team Notice Ribbon */}
        <div className="max-w-4xl mx-auto mt-12 p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-inter text-on-surface-variant">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
            </span>
            <div>
              <strong className="text-zinc-900 font-geist">Need a shared vault for your team or agency?</strong>
              <p className="text-[11px] text-zinc-500">
                Shared hiring pipelines, competitor intel feeds, and Slack channel alerts.
              </p>
            </div>
          </div>
          <a
            href="mailto:team@save.io"
            className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 font-geist text-xs font-medium hover:border-zinc-300 transition-colors shrink-0 shadow-2xs"
          >
            Contact Team Sales
          </a>
        </div>
      </div>
    </section>
  );
}

