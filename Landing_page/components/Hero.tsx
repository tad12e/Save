"use client";

import React, { useState, useEffect, useRef } from "react";
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

export type PhaseId = 1 | 2 | 3;

interface PreviewFormat {
  id: string;
  pillLabel: string;
  url: string;
  domain: string;
  intent: string;
  intentColor: string;
  intentBg: string;
  deadline: string;
  deadlineIcon: string;
  title: string;
  brandLogo: React.ReactNode;
  brandName: string;
  tags: string[];
  ctaLabel: string;
  ctaIcon: string;
  summary: string;
  pageSnippet: {
    category: string;
    subheading: string;
    metrics: string;
  };
}

const previewFormats: Record<string, PreviewFormat> = {
  jobs: {
    id: "jobs",
    pillLabel: "Job Postings",
    url: "https://greenhouse.io/v/linear-systems-design",
    domain: "greenhouse.io",
    intent: "apply",
    intentColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    intentBg: "from-emerald-400/20 via-teal-400/10 to-indigo-400/20",
    deadline: "Deadline: 38h left",
    deadlineIcon: "schedule",
    brandLogo: <LinearLogo size={18} />,
    brandName: "Linear",
    title: "Staff Product Designer — Systems & Workflows",
    tags: ["$185k–$225k", "San Francisco / Remote", "Full-time", "Design Systems"],
    ctaLabel: "Add to Calendar & Apply",
    ctaIcon: "calendar_month",
    summary: "Senior design opening requiring deep Figma tokens and workflow state experience. Auto-synced to your Jobs Tracker.",
    pageSnippet: {
      category: "Linear Careers · Product Design",
      subheading: "Help us build the tool that powers the next generation of software creators.",
      metrics: "Competitive equity · Comprehensive healthcare · 401(k) matching",
    },
  },
  papers: {
    id: "papers",
    pillLabel: "Research Papers",
    url: "https://arxiv.org/abs/2408.12948",
    domain: "arxiv.org",
    intent: "learn",
    intentColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
    intentBg: "from-indigo-400/20 via-purple-400/10 to-sky-400/20",
    deadline: "arXiv cs.AI: 2408.12948",
    deadlineIcon: "auto_stories",
    brandLogo: <ArxivLogo size={18} />,
    brandName: "arXiv cs.AI",
    title: "Scaling Laws for Frontier Neural Action Planners",
    tags: ["14 Pages PDF", "DeepMind / MIT", "8 Citations Extracted", "LaTeX Cached"],
    ctaLabel: "Save to Notion & Read",
    ctaIcon: "menu_book",
    summary: "Extracts all 4 mathematical equations, abstract, and authors into structured Markdown blocks for Obsidian & Notion.",
    pageSnippet: {
      category: "Computer Science · Artificial Intelligence",
      subheading: "Empirical verification of cross-entropy decay as function of planning horizon depth.",
      metrics: "Authors: Alex R., Wei T., Sarah K. · Published August 2026",
    },
  },
  videos: {
    id: "videos",
    pillLabel: "YouTube Talks",
    url: "https://youtube.com/watch?v=k9Xq1_rust_agents",
    domain: "youtube.com",
    intent: "watch",
    intentColor: "bg-rose-50 text-rose-800 border-rose-200",
    intentBg: "from-rose-400/20 via-pink-400/10 to-amber-400/20",
    deadline: "Timestamp: 12:15 / 42:18",
    deadlineIcon: "play_circle",
    brandLogo: <YouTubeLogo size={18} />,
    brandName: "YouTube",
    title: "Building Production Multi-Agent Systems with Rust & Raft",
    tags: ["1080p60", "AI Keyframe: 12:15", "Full Transcript Cached", "Raft Consensus"],
    ctaLabel: "Resume at Key Chapter",
    ctaIcon: "play_arrow",
    summary: "Video timeline unrolled with automatic chapter extraction and timestamp bookmarking at partition log replication.",
    pageSnippet: {
      category: "Systems Engineering Keynote · SF Tech 2026",
      subheading: "Distributed consensus, zero-copy serialization, and fault-tolerant agent mesh topologies.",
      metrics: "24.8k views · 98% like ratio · High-signal tech lecture",
    },
  },
  threads: {
    id: "threads",
    pillLabel: "Twitter Threads",
    url: "https://x.com/karpathy/status/174920194",
    domain: "x.com",
    intent: "reference",
    intentColor: "bg-sky-50 text-sky-800 border-sky-200",
    intentBg: "from-sky-400/20 via-cyan-400/10 to-indigo-400/20",
    deadline: "12-Post Unrolled Thread",
    deadlineIcon: "chat",
    brandLogo: <XLogo size={16} />,
    brandName: "X / Twitter",
    title: "The Hottest New Programming Language is English: Compiler Targets",
    tags: ["High Signal", "68k Likes", "Code Snippets Included", "98% Positive"],
    ctaLabel: "Save Unrolled Thread",
    ctaIcon: "bookmark",
    summary: "Unrolls entire multi-author conversation into clean Markdown without ads, sidebars, or login paywalls.",
    pageSnippet: {
      category: "AI Research & Systems Architecture",
      subheading: "Why prompting is programming, and how compilers are evolving into probabilistic synthesizers.",
      metrics: "68,410 Likes · 9,230 Reposts · 12 unrolled nested posts",
    },
  },
  deals: {
    id: "deals",
    pillLabel: "SaaS Deals",
    url: "https://linear.app/pricing/checkout?promo=SAVE40",
    domain: "linear.app",
    intent: "buy",
    intentColor: "bg-amber-50 text-amber-800 border-amber-200",
    intentBg: "from-amber-400/20 via-orange-400/10 to-rose-400/20",
    deadline: "Ends in 4 days (40% OFF)",
    deadlineIcon: "local_offer",
    brandLogo: <StripeLogo size={18} />,
    brandName: "Stripe Checkout",
    title: "Linear Annual Enterprise Plan — Early Renewal Discount",
    tags: ["Save $720/yr", "40% Active Discount", "Stripe Verified", "Invoice Sync"],
    ctaLabel: "Set Price Drop Alert",
    ctaIcon: "notifications_active",
    summary: "Monitors checkout links and pricing plans; pushes a notification before renewal or discount windows close.",
    pageSnippet: {
      category: "Enterprise Billing & Licensing",
      subheading: "Secure payment gateway with automatic tax receipt capture and expense categorizing.",
      metrics: "Includes unlimited issue tracker seats, cycles, and SLA support",
    },
  },
};

const PHASES = [
  {
    id: 1 as PhaseId,
    num: "01",
    label: "ONE-CLICK CAPTURE",
    sublabel: "Alt + S Instant Capture",
    badge: "140ms Native DOM Grab",
  },
  {
    id: 2 as PhaseId,
    num: "02",
    label: "AI INTENT ENGINE",
    sublabel: "Action Intent Classification",
    badge: "Action-Driven Categorization",
  },
  {
    id: 3 as PhaseId,
    num: "03",
    label: "BI-DIRECTIONAL SYNC",
    sublabel: "Notion & Sheets Live Stream",
    badge: "Zero-Latency Two-Way Push",
  },
];

export default function Hero() {
  const [activeKey, setActiveKey] = useState<string>("jobs");
  const [currentPhase, setCurrentPhase] = useState<PhaseId>(1);
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [syncDestination, setSyncDestination] = useState<"notion" | "sheets">("notion");
  const [actionTriggered, setActionTriggered] = useState<boolean>(false);
  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);

  const current = previewFormats[activeKey] || previewFormats.jobs;
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Linear-style Auto-advancing Timer (5000ms per phase)
  useEffect(() => {
    if (!isPlaying || isHovered) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const totalDuration = 5000;
    const stepPct = (stepMs / totalDuration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentPhase((p) => (p === 3 ? 1 : ((p + 1) as PhaseId)));
          return 0;
        }
        return prev + stepPct;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying, isHovered, currentPhase]);

  const handlePhaseSelect = (phase: PhaseId) => {
    setCurrentPhase(phase);
    setProgress(0);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleCtaClick = () => {
    setActionTriggered(true);
    setTimeout(() => {
      setActionTriggered(false);
    }, 2400);
  };

  return (
    <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 border-b border-surface-container-high overflow-hidden">
      {/* Soft Ambient Dynamic Aurora Glow */}
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[380px] bg-gradient-to-tr ${current.intentBg} blur-3xl rounded-full pointer-events-none -z-10 transition-all duration-700`}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Structural Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest border border-surface-container-high mb-8 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-geist text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">
            Cognitive Bookmark Architecture
          </span>
        </div>

        {/* Display Headline Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end mb-12">
          <div className="lg:col-span-8">
            <h1 className="font-geist text-4xl sm:text-6xl lg:text-7xl font-semibold text-on-surface leading-[1.06] tracking-[-0.04em]">
              Capture with purpose.
              <br />
              <span className="text-outline">Act with precision.</span>
            </h1>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-end space-y-6">
            <p className="font-inter text-sm md:text-base text-on-surface-variant leading-relaxed">
              Traditional bookmark managers sort by media format. Yazem organizes by action intent—automatically routing to Notion and Google Sheets while rendering clips as they appear in their native apps.
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

        {/* ============================================================ */}
        {/* LINEAR-STYLE INTERACTIVE SHOWCASE CONTAINER                  */}
        {/* ============================================================ */}
        <div
          id="vault-showcase"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative rounded-[28px] bg-white border border-surface-container-high shadow-[0_24px_60px_-16px_rgba(17,17,17,0.08)] overflow-hidden transition-all duration-300"
        >
          {/* ============================================================ */}
          {/* TOP BAR: Minimalist Window Header with Clean URL & Walkthrough */}
          {/* ============================================================ */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-surface-container-high bg-surface-container-lowest">
            {/* 3 Window Dots */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 hover:bg-red-400 transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 hover:bg-amber-400 transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 hover:bg-emerald-400 transition-colors" />
            </div>

            {/* Clean Centered URL Field */}
            <div className="max-w-md w-full mx-4 px-3.5 py-1.5 rounded-full bg-surface-container-low border border-surface-container-high flex items-center gap-2 text-xs font-code text-on-surface-variant truncate">
              <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0">
                lock
              </span>
              <span className="truncate">{current.url}</span>
            </div>

            {/* Right Controls: Linear Live Status & Video Walkthrough Toggle */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setShowVideoModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 text-[11px] font-geist font-medium transition-all shadow-xs cursor-pointer active:scale-95"
                title="Watch interactive product walkthrough"
              >
                <span className="material-symbols-outlined text-[15px] text-amber-400">play_circle</span>
                <span>Watch Demo</span>
              </button>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-code text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden md:inline">Zero-Loss</span>
                <span>Live</span>
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MAIN STAGE: Dynamic Content Rendering by Phase               */}
          {/* ============================================================ */}
          <div className="relative p-6 sm:p-10 md:p-12 min-h-[440px] flex items-center justify-center bg-radial from-white via-zinc-50/50 to-zinc-100/30">
            {/* Soft Ambient Radial Aurora Blur */}
            <div
              className={`absolute w-[500px] sm:w-[600px] h-[300px] rounded-full bg-gradient-to-tr ${current.intentBg} blur-3xl pointer-events-none -z-0 transition-all duration-700`}
            />

            {/* ========================================================== */}
            {/* PHASE 1: ONE-CLICK CAPTURE (Alt + S / Extension HUD)       */}
            {/* ========================================================== */}
            {currentPhase === 1 && (
              <div className="relative z-10 w-full max-w-3xl space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {/* Simulated Webpage Surface */}
                <div className="relative rounded-2xl bg-white border border-zinc-200/90 p-6 sm:p-8 shadow-[0_12px_36px_-8px_rgba(17,17,17,0.06)] space-y-4">
                  {/* Webpage Breadcrumbs & Meta */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-zinc-50 border border-zinc-200 shrink-0">
                        {current.brandLogo}
                      </div>
                      <span className="font-geist text-xs font-semibold text-zinc-900">
                        {current.brandName}
                      </span>
                      <span className="text-zinc-300">/</span>
                      <span className="font-code text-xs text-outline">{current.domain}</span>
                    </div>
                    <span className="text-[11px] font-code text-zinc-400">
                      HTTP 200 · Native View
                    </span>
                  </div>

                  {/* Headline & Body Snippet */}
                  <div className="space-y-2">
                    <span className="text-xs font-geist uppercase tracking-wider text-primary font-semibold">
                      {current.pageSnippet.category}
                    </span>
                    <h2 className="font-geist text-xl sm:text-2xl font-bold text-zinc-900 leading-snug">
                      {current.title}
                    </h2>
                    <p className="font-inter text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {current.pageSnippet.subheading}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs font-code text-zinc-500 border-t border-zinc-50">
                    <span>{current.pageSnippet.metrics}</span>
                    <span className="text-emerald-600 font-medium">Ready for capture</span>
                  </div>
                </div>

                {/* Floating Elements: Shortcut Badge & Extension HUD */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  {/* Floating Keyboard Shortcut Indicator */}
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-zinc-900 text-white font-code text-xs shadow-lg border border-zinc-800">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-100 text-[11px] font-bold shadow-xs">
                        Alt
                      </kbd>
                      <span className="text-zinc-400">+</span>
                      <kbd className="px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-100 text-[11px] font-bold shadow-xs">
                        S
                      </kbd>
                    </span>
                    <span className="text-zinc-300">Shortcut Pressed</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>

                  {/* Floating Yazem Extension Pill */}
                  <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white border border-zinc-300 text-zinc-900 font-geist text-xs shadow-md">
                    <div className="w-5 h-5 rounded bg-primary text-white flex items-center justify-center text-[10px] font-bold tracking-tighter">
                      Y.
                    </div>
                    <span className="font-semibold">Yazem Extension</span>
                    <span className="h-3 w-[1px] bg-zinc-200" />
                    <span className="text-emerald-700 font-code text-[11px] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Captured in 140ms
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* PHASE 2: AI ACTION INTENT ENGINE                           */}
            {/* ========================================================== */}
            {currentPhase === 2 && (
              <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-white border border-zinc-200/90 p-6 sm:p-8 shadow-[0_16px_40px_-8px_rgba(17,17,17,0.08)] space-y-5 animate-in fade-in zoom-in-95 duration-300">
                {/* Meta Row with AI Intent Badge */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-surface-container-low border border-zinc-200 shrink-0">
                      {current.brandLogo}
                    </div>
                    <span className="font-geist text-xs font-semibold text-zinc-900">
                      {current.brandName}
                    </span>
                    <span className="text-zinc-300">/</span>
                    <span className="font-code text-xs text-outline">{current.domain}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full font-geist text-[11px] font-semibold uppercase tracking-wider border shadow-xs ${current.intentColor}`}
                    >
                      Intent: {current.intent}
                    </span>
                    <span className="text-on-surface-variant font-code text-xs flex items-center gap-1 bg-zinc-50 px-2.5 py-1 rounded-full border border-zinc-200">
                      <span className="material-symbols-outlined text-[14px] text-zinc-500">
                        {current.deadlineIcon}
                      </span>
                      <span>{current.deadline}</span>
                    </span>
                  </div>
                </div>

                {/* Title & AI Summary */}
                <div className="space-y-2">
                  <h3 className="font-geist text-xl sm:text-2xl font-semibold text-on-surface leading-snug">
                    {current.title}
                  </h3>
                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
                    <p className="font-inter text-xs sm:text-sm text-zinc-700 leading-relaxed flex items-start gap-2">
                      <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0 mt-0.5">
                        auto_awesome
                      </span>
                      <span>{current.summary}</span>
                    </p>
                  </div>
                </div>

                {/* Extracted Structured Tags */}
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

                {/* Action Trigger Button */}
                <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
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
                    <span>{actionTriggered ? "Action Scheduled!" : current.ctaLabel}</span>
                  </button>

                  <span className="text-xs font-code text-zinc-400">
                    Auto-categorized by Gemini 1.5
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================== */}
            {/* PHASE 3: BI-DIRECTIONAL AUTO-SYNC (Notion & Google Sheets) */}
            {/* ========================================================== */}
            {currentPhase === 3 && (
              <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white border border-zinc-200/90 p-6 sm:p-8 shadow-[0_16px_40px_-8px_rgba(17,17,17,0.08)] space-y-5 animate-in fade-in zoom-in-95 duration-300">
                {/* Destination Selector Tabs */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-geist font-medium text-zinc-500">
                      Live Destination:
                    </span>
                    <div className="inline-flex p-1 rounded-xl bg-zinc-100 border border-zinc-200">
                      <button
                        onClick={() => setSyncDestination("notion")}
                        className={`px-3 py-1 rounded-lg text-xs font-geist font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          syncDestination === "notion"
                            ? "bg-white text-zinc-900 shadow-xs font-semibold"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        <NotionLogo size={14} />
                        <span>Notion Database</span>
                      </button>
                      <button
                        onClick={() => setSyncDestination("sheets")}
                        className={`px-3 py-1 rounded-lg text-xs font-geist font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          syncDestination === "sheets"
                            ? "bg-white text-zinc-900 shadow-xs font-semibold"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        <GoogleSheetsLogo size={14} />
                        <span>Google Sheets</span>
                      </button>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-code text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>2-Way Sync Active · 24ms</span>
                  </span>
                </div>

                {/* NOTION VIEW MOCKUP */}
                {syncDestination === "notion" && (
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 font-geist text-xs">
                    <div className="grid grid-cols-12 gap-2 text-zinc-400 font-medium pb-2 border-b border-zinc-200 uppercase tracking-wider text-[10px]">
                      <span className="col-span-5">Title</span>
                      <span className="col-span-2">Intent</span>
                      <span className="col-span-3">Tags / Deadline</span>
                      <span className="col-span-2 text-right">Sync Status</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-center py-2 text-zinc-800">
                      <span className="col-span-5 font-semibold truncate flex items-center gap-1.5">
                        <span className="text-zinc-400">📄</span>
                        <span>{current.title}</span>
                      </span>
                      <span className="col-span-2">
                        <span className="px-2 py-0.5 rounded-full bg-zinc-200/80 text-[10px] font-semibold uppercase">
                          {current.intent}
                        </span>
                      </span>
                      <span className="col-span-3 text-zinc-500 truncate font-code">
                        {current.tags[0]} · {current.deadline}
                      </span>
                      <span className="col-span-2 text-right text-emerald-600 font-code font-semibold flex items-center justify-end gap-1">
                        <span className="material-symbols-outlined text-[14px]">sync</span>
                        <span>Synced</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* GOOGLE SHEETS VIEW MOCKUP */}
                {syncDestination === "sheets" && (
                  <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-4 font-code text-xs overflow-x-auto">
                    <div className="grid grid-cols-12 gap-2 bg-emerald-50 text-emerald-900 font-semibold p-2 rounded-lg text-[11px] border border-emerald-200/70">
                      <span className="col-span-1 text-center">#</span>
                      <span className="col-span-4">Clip Title (Col A)</span>
                      <span className="col-span-2">Domain (Col B)</span>
                      <span className="col-span-2">Intent (Col C)</span>
                      <span className="col-span-3">Status (Col D)</span>
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-center p-2 text-zinc-800 border-b border-zinc-100">
                      <span className="col-span-1 text-center text-zinc-400">01</span>
                      <span className="col-span-4 font-medium truncate font-geist">
                        {current.title}
                      </span>
                      <span className="col-span-2 text-zinc-500 truncate">{current.domain}</span>
                      <span className="col-span-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-100 text-[10px] font-medium uppercase">
                          {current.intent}
                        </span>
                      </span>
                      <span className="col-span-3 text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Connected (Live)</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* Bottom Bi-directional info */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 font-geist gap-2">
                  <div className="flex items-center gap-2">
                    <NotionLogo size={14} />
                    <GoogleSheetsLogo size={14} />
                    <span>Edits made in Notion or Sheets reflect in Yazem Vault instantly.</span>
                  </div>
                  <a
                    href={APP_ROUTES.signUp}
                    className="text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>Connect your workspace</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* LINEAR-STYLE SEGMENTED CHAPTER SCRUBBER BAR                  */}
          {/* ============================================================ */}
          <div className="px-5 sm:px-7 py-4 border-t border-surface-container-high bg-surface-container-lowest flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Play/Pause Button & Micro Info */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-full bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-800 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-90"
                title={isPlaying ? "Pause timeline demo" : "Resume timeline demo"}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isPlaying ? "pause" : "play_arrow"}
                </span>
              </button>
              <div className="text-left">
                <span className="block font-geist text-xs font-semibold text-zinc-900">
                  Interactive Demo
                </span>
                <span className="block font-code text-[11px] text-zinc-400">
                  {isHovered ? "Paused on hover" : isPlaying ? "Auto-cycling" : "Paused"}
                </span>
              </div>
            </div>

            {/* 3 Segmented Progress Columns */}
            <div className="w-full max-w-2xl grid grid-cols-3 gap-3 sm:gap-4">
              {PHASES.map((p) => {
                const isActive = currentPhase === p.id;
                const isPassed = currentPhase > p.id;
                const fillWidth = isActive ? `${progress}%` : isPassed ? "100%" : "0%";

                return (
                  <button
                    key={p.id}
                    onClick={() => handlePhaseSelect(p.id)}
                    className="group text-left cursor-pointer transition-all space-y-1.5 focus:outline-hidden"
                  >
                    {/* Linear Top Progress Bar */}
                    <div className="h-1 w-full bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-75 ease-linear rounded-full"
                        style={{ width: fillWidth }}
                      />
                    </div>

                    {/* Step Labels */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-code text-[11px] font-bold tracking-wider ${
                          isActive
                            ? "text-primary font-bold"
                            : "text-zinc-400 group-hover:text-zinc-600"
                        }`}
                      >
                        {p.num}
                      </span>
                      <span className="hidden sm:inline font-geist text-[10px] uppercase tracking-wider text-zinc-400">
                        {p.id === 1 ? "140ms" : p.id === 2 ? "Gemini" : "2-Way"}
                      </span>
                    </div>

                    <span
                      className={`block font-geist text-xs font-semibold truncate ${
                        isActive
                          ? "text-zinc-900"
                          : "text-zinc-500 group-hover:text-zinc-700"
                      }`}
                    >
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* FORMAT SELECTOR PILL STRIP (Jobs, Papers, YouTube, Threads) */}
          {/* ============================================================ */}
          <div className="px-6 py-3 border-t border-zinc-100 bg-white flex flex-wrap items-center justify-center gap-2">
            <span className="font-geist text-[11px] uppercase tracking-wider text-outline font-medium mr-2">
              Sample Formats:
            </span>
            {Object.keys(previewFormats).map((key) => {
              const item = previewFormats[key];
              const isActive = activeKey === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className={`px-3.5 py-1 rounded-full text-xs font-geist font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary text-white shadow-xs font-semibold scale-105"
                      : "bg-surface-container-lowest border border-zinc-200 text-on-surface-variant hover:text-primary hover:border-zinc-300"
                  }`}
                >
                  <span>{item.pillLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* OPTIONAL WALKTHROUGH VIDEO LIGHTBOX MODAL                    */}
      {/* ============================================================ */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl overflow-hidden space-y-4 p-6 text-white">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center text-xs font-bold tracking-tighter">
                  Y.
                </div>
                <span className="font-geist text-sm font-semibold">
                  Yazem — 60-Second Product Walkthrough
                </span>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Video Canvas Container */}
            <div className="relative aspect-video rounded-xl bg-black border border-zinc-800 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 text-primary flex items-center justify-center mb-4 animate-pulse">
                <span className="material-symbols-outlined text-[32px]">play_arrow</span>
              </div>
              <h4 className="font-geist text-lg font-semibold text-zinc-100 mb-1">
                Yazem Action-Oriented Knowledge Vault
              </h4>
              <p className="font-inter text-xs text-zinc-400 max-w-md">
                1-Click Save with Browser Extension · AI Action Intent Extraction · Bi-Directional
                Live Sync to Notion & Google Sheets.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <a
                  href={APP_ROUTES.signUp}
                  className="px-5 py-2.5 rounded-full bg-primary text-white font-geist text-xs font-semibold hover:bg-neutral-800 transition-all"
                >
                  Try Yazem Free
                </a>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="px-4 py-2.5 rounded-full bg-zinc-800 text-zinc-300 font-geist text-xs hover:bg-zinc-700 transition-all"
                >
                  Back to Interactive Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
