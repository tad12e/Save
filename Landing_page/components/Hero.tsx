"use client";

import React, { useState } from "react";
import { APP_ROUTES } from "../lib/routes";
import {
  NotionLogo,
  GoogleSheetsLogo,
  YouTubeLogo,
  XLogo,
  ArxivLogo,
  LinearLogo,
  StripeLogo,
} from "./BrandLogos";

interface PreviewFormat {
  id: string;
  pillLabel: string;
  url: string;
  domain: string;
  intent: string;
  intentColor: string;
  deadline: string;
  deadlineIcon: string;
  title: string;
  brandLogo: React.ReactNode;
  brandName: string;
  tags: string[];
  ctaLabel: string;
  ctaIcon: string;
  summary: string;
}

const previewFormats: Record<string, PreviewFormat> = {
  jobs: {
    id: "jobs",
    pillLabel: "Job Postings",
    url: "https://greenhouse.io/v/linear-systems-design",
    domain: "greenhouse.io",
    intent: "apply",
    intentColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    deadline: "Deadline: 38h left",
    deadlineIcon: "schedule",
    brandLogo: <LinearLogo size={18} />,
    brandName: "Linear",
    title: "Staff Product Designer — Systems & Workflows",
    tags: ["$185k–$225k", "San Francisco / Remote", "Full-time", "Design Systems"],
    ctaLabel: "Add to Calendar & Apply",
    ctaIcon: "calendar_month",
    summary: "Senior design opening requiring deep Figma tokens and workflow state experience. Auto-synced to your Jobs Tracker.",
  },
  papers: {
    id: "papers",
    pillLabel: "Research Papers",
    url: "https://arxiv.org/abs/2408.12948",
    domain: "arxiv.org",
    intent: "learn",
    intentColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    deadline: "arXiv cs.AI: 2408.12948",
    deadlineIcon: "auto_stories",
    brandLogo: <ArxivLogo size={18} />,
    brandName: "arXiv cs.AI",
    title: "Scaling Laws for Frontier Neural Action Planners",
    tags: ["14 Pages PDF", "DeepMind / MIT", "8 Citations Extracted", "LaTeX Cached"],
    ctaLabel: "Save to Notion & Read",
    ctaIcon: "menu_book",
    summary: "Extracts all 4 mathematical equations, abstract, and authors into structured Markdown blocks for Obsidian & Notion.",
  },
  videos: {
    id: "videos",
    pillLabel: "YouTube Talks",
    url: "https://youtube.com/watch?v=k9Xq1_rust_agents",
    domain: "youtube.com",
    intent: "watch",
    intentColor: "bg-rose-50 text-rose-800 border-rose-200",
    deadline: "Timestamp: 12:15 / 42:18",
    deadlineIcon: "play_circle",
    brandLogo: <YouTubeLogo size={18} />,
    brandName: "YouTube",
    title: "Building Production Multi-Agent Systems with Rust & Raft",
    tags: ["1080p60", "AI Keyframe: 12:15", "Full Transcript Cached", "Raft Consensus"],
    ctaLabel: "Resume at Key Chapter",
    ctaIcon: "play_arrow",
    summary: "Video timeline unrolled with automatic chapter extraction and timestamp bookmarking at partition log replication.",
  },
  threads: {
    id: "threads",
    pillLabel: "Twitter Threads",
    url: "https://x.com/karpathy/status/174920194",
    domain: "x.com",
    intent: "reference",
    intentColor: "bg-sky-50 text-sky-800 border-sky-200",
    deadline: "12-Post Unrolled Thread",
    deadlineIcon: "chat",
    brandLogo: <XLogo size={16} />,
    brandName: "X / Twitter",
    title: "The Hottest New Programming Language is English: Compiler Targets",
    tags: ["High Signal", "68k Likes", "Code Snippets Included", "98% Positive"],
    ctaLabel: "Save Unrolled Thread",
    ctaIcon: "bookmark",
    summary: "Unrolls entire multi-author conversation into clean Markdown without ads, sidebars, or login paywalls.",
  },
  deals: {
    id: "deals",
    pillLabel: "SaaS Deals",
    url: "https://linear.app/pricing/checkout?promo=SAVE40",
    domain: "linear.app",
    intent: "buy",
    intentColor: "bg-amber-50 text-amber-800 border-amber-200",
    deadline: "Ends in 4 days (40% OFF)",
    deadlineIcon: "local_offer",
    brandLogo: <StripeLogo size={18} />,
    brandName: "Stripe Checkout",
    title: "Linear Annual Enterprise Plan — Early Renewal Discount",
    tags: ["Save $720/yr", "40% Active Discount", "Stripe Verified", "Invoice Sync"],
    ctaLabel: "Set Price Drop Alert",
    ctaIcon: "notifications_active",
    summary: "Monitors checkout links and pricing plans; pushes a notification before renewal or discount windows close.",
  },
};

export default function Hero() {
  const [activeKey, setActiveKey] = useState<string>("jobs");
  const [actionTriggered, setActionTriggered] = useState(false);

  const current = previewFormats[activeKey] || previewFormats.jobs;

  const handleCtaClick = () => {
    setActionTriggered(true);
    setTimeout(() => {
      setActionTriggered(false);
    }, 2400);
  };

  return (
    <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 border-b border-surface-container-high overflow-hidden">
      {/* Soft Ambient Warm Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[360px] bg-gradient-to-tr from-rose-200/40 via-purple-200/30 to-emerald-200/30 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        {/* Structural Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest border border-surface-container-high mb-8 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-geist text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
            Cognitive Bookmark Architecture
          </span>
        </div>

        {/* Display Headline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-14">
          <div className="lg:col-span-8">
            <h1 className="font-geist text-4xl sm:text-6xl lg:text-7xl font-semibold text-on-surface leading-[1.06] tracking-[-0.04em]">
              Capture with purpose.
              <br />
              <span className="text-outline">Act with precision.</span>
            </h1>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end space-y-6">
            <p className="font-inter text-sm md:text-base text-on-surface-variant leading-relaxed">
              Traditional bookmark managers sort by media format. Save organizes by action intent—automatically routing to Notion and Google Sheets while rendering clips as they appear in their native apps.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={APP_ROUTES.signUp}
                className="h-10 px-5 rounded-full bg-primary text-white font-geist text-xs font-medium inline-flex items-center gap-2 hover:bg-neutral-800 transition-all duration-150 active:scale-[0.98] shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Get Started Free</span>
              </a>
              <a
                href={APP_ROUTES.signIn}
                className="h-10 px-5 rounded-full bg-surface-container-lowest border border-surface-container-high text-on-surface font-geist text-xs font-medium inline-flex items-center gap-1.5 hover:bg-surface-container-low transition-colors"
              >
                <span>Launch Web Vault</span>
                <span className="material-symbols-outlined text-[16px]">north_east</span>
              </a>
            </div>
          </div>
        </div>

        {/* Pure Auralis Aesthetic Hero Card */}
        <div
          id="vault-showcase"
          className="relative rounded-[28px] bg-white border border-surface-container-high shadow-[0_20px_50px_-16px_rgba(17,17,17,0.06)] overflow-hidden"
        >
          {/* ============================================================ */}
          {/* TOP BAR: Minimalist Window Header with Clean URL Bar        */}
          {/* ============================================================ */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-surface-container-high bg-surface-container-lowest">
            {/* 3 Window Dots */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            </div>

            {/* Clean Centered URL Field */}
            <div className="max-w-md w-full mx-4 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high flex items-center gap-2 text-xs font-code text-on-surface-variant truncate">
              <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">
                lock
              </span>
              <span className="truncate">{current.url}</span>
            </div>

            {/* Clean Status Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-code text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero-Loss Capture</span>
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* CENTER: Spacious Canvas with Soft Diffused Ambient Aurora   */}
          {/* ============================================================ */}
          <div className="relative p-6 sm:p-10 md:p-14 flex items-center justify-center">
            {/* Soft Ambient Radial Aurora Blur */}
            <div className="absolute w-[440px] sm:w-[540px] h-[280px] rounded-full bg-gradient-to-tr from-indigo-200/50 via-purple-200/40 to-rose-200/50 blur-3xl pointer-events-none -z-0" />

            {/* Floating Clean White Captured Item Card */}
            <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white border border-zinc-200/90 p-6 sm:p-8 shadow-[0_12px_36px_-8px_rgba(17,17,17,0.08)] transition-all animate-in fade-in duration-200 space-y-5">
              {/* Card Meta Row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-surface-container-low border border-zinc-200 shrink-0">
                    {current.brandLogo}
                  </div>
                  <span className="font-geist text-xs font-semibold text-zinc-900">
                    {current.brandName}
                  </span>
                  <span className="text-zinc-300">/</span>
                  <span className="font-code text-xs text-outline">
                    {current.domain}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-geist text-[11px] font-semibold uppercase tracking-wider border ${current.intentColor}`}
                  >
                    {current.intent}
                  </span>
                  <span className="text-on-surface-variant font-code text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">
                      {current.deadlineIcon}
                    </span>
                    <span>{current.deadline}</span>
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className="font-geist text-xl sm:text-2xl font-semibold text-on-surface leading-snug">
                  {current.title}
                </h3>
                <p className="font-inter text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {current.summary}
                </p>
              </div>

              {/* Tag Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {current.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-surface-container-low border border-zinc-200 text-on-surface font-geist text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-4 border-t border-zinc-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  onClick={handleCtaClick}
                  className={`h-10 px-5 rounded-xl font-geist text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                    actionTriggered
                      ? "bg-emerald-600 text-white"
                      : "bg-primary text-white hover:bg-neutral-800 active:scale-[0.98]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">
                    {actionTriggered ? "check_circle" : current.ctaIcon}
                  </span>
                  <span>{actionTriggered ? "Action Executed!" : current.ctaLabel}</span>
                </button>

                <div className="flex items-center gap-2 text-xs text-on-surface-variant font-code">
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container-low border border-zinc-200">
                    <NotionLogo size={14} />
                    <GoogleSheetsLogo size={14} />
                    <span className="text-zinc-700 font-medium font-geist">Synced to Notion & Sheets</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* BOTTOM BAR: Exactly ONE Clean Format Pill Selector Strip   */}
          {/* ============================================================ */}
          <div className="px-6 py-4 border-t border-surface-container-high bg-surface-container-lowest/70 flex flex-wrap items-center justify-center gap-2">
            <span className="font-geist text-[11px] uppercase tracking-wider text-outline font-medium mr-2">
              Preview Formats:
            </span>
            {Object.keys(previewFormats).map((key) => {
              const item = previewFormats[key];
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-geist font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary text-white shadow-xs font-semibold scale-105"
                      : "bg-white border border-zinc-200 text-on-surface-variant hover:text-primary hover:border-zinc-300"
                  }`}
                >
                  <span>{item.pillLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
