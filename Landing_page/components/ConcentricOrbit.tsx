"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  NotionLogo,
  GoogleSheetsLogo,
  YouTubeLogo,
  XLogo,
  GitHubLogo,
  SpotifyLogo,
  StripeLogo,
  FigmaLogo,
  ArxivLogo,
  LinearLogo,
  RedditLogo,
  SlackLogo,
  SubstackLogo,
} from "./BrandLogos";

interface VortexCard {
  id: string;
  format: "articles" | "videos" | "papers" | "threads" | "code" | "deals" | "sync";
  title: string;
  source: string;
  formatBadge: string;
  formatBadgeColor: string;
  r: number;
  theta: number; // in degrees
  tilt: number; // in degrees
  size: number; // base size in px
  scale: number;
  image?: string;
  bgColor?: string;
  logo?: React.ReactNode;
  uiContent?: React.ReactNode;
}

// Wave 1: Inner Orbit (r: 110px - 145px)
const innerWaveCards: VortexCard[] = [
  {
    id: "inner-1",
    format: "articles",
    title: "Minimalist Bauhaus Architecture",
    source: "archdaily.com",
    formatBadge: "Article",
    formatBadgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    r: 112,
    theta: -30,
    tilt: -8,
    size: 54,
    scale: 0.8,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "inner-2",
    format: "sync",
    title: "Notion Product Roadmap",
    source: "notion.so",
    formatBadge: "Notion Doc",
    formatBadgeColor: "bg-zinc-100 text-zinc-800 border-zinc-300",
    r: 125,
    theta: 35,
    tilt: 6,
    size: 52,
    scale: 0.78,
    bgColor: "bg-zinc-100 border border-zinc-200",
    logo: <NotionLogo size={18} />,
  },
  {
    id: "inner-3",
    format: "articles",
    title: "Editorial Design Trends 2026",
    source: "vogue.com",
    formatBadge: "Article",
    formatBadgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    r: 135,
    theta: 110,
    tilt: -10,
    size: 50,
    scale: 0.76,
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "inner-4",
    format: "papers",
    title: "Transformer Attention Matrix",
    source: "arxiv.org",
    formatBadge: "arXiv PDF",
    formatBadgeColor: "bg-rose-50 text-rose-800 border-rose-200",
    r: 120,
    theta: 195,
    tilt: 7,
    size: 54,
    scale: 0.8,
    bgColor: "bg-rose-50 border border-rose-200",
    logo: <ArxivLogo size={16} />,
  },
  {
    id: "inner-5",
    format: "articles",
    title: "Botanical Research Archive",
    source: "nature.com",
    formatBadge: "Article",
    formatBadgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    r: 140,
    theta: 255,
    tilt: -9,
    size: 56,
    scale: 0.82,
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "inner-6",
    format: "videos",
    title: "Ambient Focus Soundscape",
    source: "spotify.com",
    formatBadge: "Audio",
    formatBadgeColor: "bg-emerald-950 text-emerald-300 border-emerald-700",
    r: 145,
    theta: 320,
    tilt: 11,
    size: 52,
    scale: 0.78,
    bgColor: "bg-emerald-950 text-emerald-400 border border-emerald-800",
    logo: <SpotifyLogo size={18} />,
  },
];

// Wave 2: Mid Orbit (r: 215px - 265px)
const midWaveCards: VortexCard[] = [
  {
    id: "mid-1",
    format: "articles",
    title: "Artisanal Culinary Sourdough Guide",
    source: "sourdough.journal",
    formatBadge: "Recipe",
    formatBadgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    r: 215,
    theta: -18,
    tilt: 6,
    size: 72,
    scale: 0.94,
    image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "mid-2",
    format: "deals",
    title: "Linear Staff Systems Designer",
    source: "greenhouse.io",
    formatBadge: "Job Opening",
    formatBadgeColor: "bg-purple-900 text-purple-200 border-purple-700",
    r: 235,
    theta: 28,
    tilt: -7,
    size: 76,
    scale: 0.98,
    bgColor: "bg-[#1E1F29] text-white border border-purple-500/30",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <LinearLogo size={20} />
        <span className="text-[10px] font-bold font-geist mt-1 leading-tight">Linear</span>
        <span className="text-[9px] text-purple-300 font-code font-semibold">Job • $190k</span>
      </div>
    ),
  },
  {
    id: "mid-3",
    format: "articles",
    title: "Minimal Studio Setup",
    source: "minimaldesk.co",
    formatBadge: "Workspace",
    formatBadgeColor: "bg-zinc-100 text-zinc-800 border-zinc-200",
    r: 220,
    theta: 75,
    tilt: 9,
    size: 70,
    scale: 0.92,
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "mid-4",
    format: "sync",
    title: "Google Sheets Financial Telemetry",
    source: "sheets.google.com",
    formatBadge: "Sheets Row",
    formatBadgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    r: 245,
    theta: 125,
    tilt: -6,
    size: 74,
    scale: 0.96,
    bgColor: "bg-emerald-50 border border-emerald-300",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <GoogleSheetsLogo size={22} />
        <span className="text-[10px] font-bold text-emerald-950 font-geist mt-1">Sheets v4</span>
        <span className="text-[9px] text-emerald-700 font-code font-medium">Row #1408</span>
      </div>
    ),
  },
  {
    id: "mid-5",
    format: "articles",
    title: "Substack: The Sovereign Developer",
    source: "substack.com",
    formatBadge: "Substack",
    formatBadgeColor: "bg-orange-50 text-orange-800 border-orange-200",
    r: 225,
    theta: 172,
    tilt: 8,
    size: 72,
    scale: 0.94,
    bgColor: "bg-white border border-orange-200",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <SubstackLogo size={20} />
        <span className="text-[10px] font-bold text-zinc-900 font-geist mt-1">Substack</span>
        <span className="text-[9px] text-orange-700 font-code font-semibold">14m Read</span>
      </div>
    ),
  },
  {
    id: "mid-6",
    format: "code",
    title: "GitHub Rust Engine (uv)",
    source: "github.com",
    formatBadge: "Repo Code",
    formatBadgeColor: "bg-zinc-900 text-zinc-100 border-zinc-700",
    r: 250,
    theta: 218,
    tilt: -11,
    size: 76,
    scale: 0.96,
    bgColor: "bg-zinc-900 text-white border border-zinc-700",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <GitHubLogo size={20} />
        <span className="text-[10px] font-bold font-geist mt-1 text-zinc-100">astral / uv</span>
        <span className="text-[9px] text-emerald-400 font-code">★ 34.2k</span>
      </div>
    ),
  },
  {
    id: "mid-7",
    format: "articles",
    title: "Brutalist Concrete Architecture",
    source: "archdaily.com",
    formatBadge: "Article",
    formatBadgeColor: "bg-zinc-100 text-zinc-800 border-zinc-200",
    r: 235,
    theta: 278,
    tilt: 5,
    size: 70,
    scale: 0.92,
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "mid-8",
    format: "sync",
    title: "Figma Variables & Color Tokens",
    source: "figma.com",
    formatBadge: "Figma Frame",
    formatBadgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    r: 265,
    theta: 332,
    tilt: -8,
    size: 76,
    scale: 0.98,
    bgColor: "bg-white border border-purple-200",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <FigmaLogo size={20} />
        <span className="text-[10px] font-bold text-zinc-900 font-geist mt-1">Design Tokens</span>
        <span className="text-[9px] text-purple-700 font-code font-semibold">16 Styles</span>
      </div>
    ),
  },
];

// Wave 3: Outer Orbit (r: 345px - 440px)
const outerWaveCards: VortexCard[] = [
  {
    id: "outer-1",
    format: "videos",
    title: "Raft Consensus in Rust",
    source: "youtube.com",
    formatBadge: "YouTube Video",
    formatBadgeColor: "bg-rose-600 text-white border-rose-500",
    r: 345,
    theta: -10,
    tilt: -5,
    size: 88,
    scale: 1.1,
    bgColor: "bg-zinc-950 text-white border border-zinc-800 shadow-md",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full relative overflow-hidden">
        <div className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center mb-1 shadow-sm">
          <span className="material-symbols-outlined text-white text-[20px]">play_arrow</span>
        </div>
        <span className="text-[10px] font-bold font-geist leading-tight">YouTube Tech Talk</span>
        <span className="text-[9px] text-rose-400 font-code">12:15 Marker</span>
      </div>
    ),
  },
  {
    id: "outer-2",
    format: "articles",
    title: "Citrus Still Life Color Palette",
    source: "art.archive",
    formatBadge: "Palette",
    formatBadgeColor: "bg-amber-50 text-amber-800 border-amber-200",
    r: 380,
    theta: 38,
    tilt: 9,
    size: 92,
    scale: 1.15,
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "outer-3",
    format: "threads",
    title: "Andrej Karpathy: Software 3.0",
    source: "x.com/karpathy",
    formatBadge: "X Thread",
    formatBadgeColor: "bg-black text-white border-zinc-700",
    r: 350,
    theta: 82,
    tilt: -7,
    size: 86,
    scale: 1.08,
    bgColor: "bg-black text-white border border-zinc-800 shadow-md",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <XLogo size={18} />
        <span className="text-[10px] font-bold font-geist mt-1">@karpathy</span>
        <span className="text-[9px] text-zinc-400 font-inter leading-tight line-clamp-2">
          English is the hottest language
        </span>
      </div>
    ),
  },
  {
    id: "outer-4",
    format: "deals",
    title: "Teenage Engineering OP-XY Deal",
    source: "teenage.engineering",
    formatBadge: "Hardware Deal",
    formatBadgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    r: 405,
    theta: 122,
    tilt: 6,
    size: 94,
    scale: 1.16,
    bgColor: "bg-zinc-100 border border-zinc-300 shadow-md",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <span className="text-xs font-bold font-geist text-zinc-950">OP-XY Synth</span>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1">
          -15% Active
        </span>
        <span className="text-[9px] text-zinc-500 font-code mt-0.5">$1,999</span>
      </div>
    ),
  },
  {
    id: "outer-5",
    format: "articles",
    title: "Shinjuku Tokyo Neon Architecture",
    source: "tokyo.photo",
    formatBadge: "Photo Clip",
    formatBadgeColor: "bg-indigo-900 text-indigo-100 border-indigo-700",
    r: 370,
    theta: 165,
    tilt: -12,
    size: 90,
    scale: 1.12,
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "outer-6",
    format: "deals",
    title: "Stripe Billing Enterprise Checkout",
    source: "stripe.com",
    formatBadge: "Stripe Checkout",
    formatBadgeColor: "bg-indigo-600 text-white border-indigo-500",
    r: 420,
    theta: 205,
    tilt: 9,
    size: 94,
    scale: 1.18,
    bgColor: "bg-[#635BFF] text-white border border-[#4B44E0] shadow-md",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <StripeLogo size={22} />
        <span className="text-[10px] font-bold font-geist mt-1">Stripe Checkout</span>
        <span className="text-[9px] text-indigo-100 font-code">P95: 14ms</span>
      </div>
    ),
  },
  {
    id: "outer-7",
    format: "articles",
    title: "Abstract Prismatic 3D Render",
    source: "3d.gallery",
    formatBadge: "3D Artwork",
    formatBadgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    r: 360,
    theta: 248,
    tilt: -6,
    size: 88,
    scale: 1.1,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "outer-8",
    format: "threads",
    title: "Reddit Systems Architecture Discussion",
    source: "reddit.com/r/rust",
    formatBadge: "Reddit Thread",
    formatBadgeColor: "bg-orange-600 text-white border-orange-500",
    r: 410,
    theta: 295,
    tilt: 7,
    size: 92,
    scale: 1.15,
    bgColor: "bg-[#FF4500] text-white border border-orange-600 shadow-md",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <RedditLogo size={22} />
        <span className="text-[10px] font-bold font-geist mt-1">r/rust</span>
        <span className="text-[9px] text-orange-100 font-inter">412 comments</span>
      </div>
    ),
  },
  {
    id: "outer-9",
    format: "sync",
    title: "Slack Decision Broadcast",
    source: "slack.com",
    formatBadge: "Slack Alert",
    formatBadgeColor: "bg-purple-50 text-purple-800 border-purple-200",
    r: 440,
    theta: 335,
    tilt: -8,
    size: 90,
    scale: 1.12,
    bgColor: "bg-white border border-purple-200 shadow-md",
    uiContent: (
      <div className="flex flex-col items-center justify-center p-2 text-center h-full">
        <SlackLogo size={20} />
        <span className="text-[10px] font-bold text-zinc-900 font-geist mt-1">Slack Alerts</span>
        <span className="text-[9px] text-purple-700 font-code">#knowledge-vault</span>
      </div>
    ),
  },
];

export default function ConcentricOrbit() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [hoveredCard, setHoveredCard] = useState<VortexCard | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [scrollStats, setScrollStats] = useState({
    progress: 0.5,
    scrollY: 0,
  });

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const totalTravel = windowHeight + rect.height;
            const currentTravel = windowHeight - rect.top;
            const progress = Math.max(0, Math.min(1, currentTravel / totalTravel));

            setScrollStats({
              progress,
              scrollY: window.scrollY,
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Compute scroll-based immersion metrics
  const centerProximity = Math.max(0, 1 - Math.abs(scrollStats.progress - 0.5) * 2);
  const spreadFactor = 0.94 + centerProximity * 0.10; // Expands by up to 10% when centered in viewport
  const innerScrollShift = (scrollStats.progress - 0.5) * -12;
  const midScrollShift = (scrollStats.progress - 0.5) * -28;
  const outerScrollShift = (scrollStats.progress - 0.5) * -52;

  // Check if a card matches the active filter
  const matchesFilter = (card: VortexCard) => {
    if (activeFilter === "all") return true;
    return card.format === activeFilter;
  };

  return (
    <section
      ref={sectionRef}
      id="stack"
      className="py-24 border-b border-surface-container-high bg-white overflow-hidden relative"
    >
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* ============================================================ */}
        {/* SECTION HEADER: Save Anything From Anywhere                 */}
        {/* ============================================================ */}
        <div className="max-w-3xl mx-auto mb-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-geist text-[11px] uppercase tracking-widest text-emerald-800 font-semibold">
              UNIVERSAL KNOWLEDGE INGESTION • 1-CLICK
            </span>
          </div>

          <h2 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
            Save anything from anywhere —
            <br />
            <span className="text-outline">from articles to YouTube videos & beyond</span>
          </h2>

          <p className="font-inter text-sm md:text-base text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Web articles, academic research PDFs, YouTube videos with transcripts, X threads, GitHub code repos, and e-commerce deals. Save ingests every format with zero fidelity loss and bi-directional sync to Notion & Google Sheets.
          </p>

          {/* Interactive Control Pill (Rotate/Pause) */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsRotating(!isRotating)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-code font-medium bg-surface-container-low border border-zinc-200 text-zinc-700 hover:bg-surface-container-high transition-colors cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[15px] text-emerald-600">
                {isRotating ? "pause_circle" : "play_circle"}
              </span>
              <span>{isRotating ? "Vortex Rotating (Click to Pause)" : "Vortex Paused (Click to Spin)"}</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* FORMAT FILTER STRIP                                         */}
        {/* ============================================================ */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {[
            { id: "all", label: "All Formats (24)" },
            { id: "articles", label: "📰 Web Articles & Substack" },
            { id: "videos", label: "▶️ YouTube Videos & Audio" },
            { id: "papers", label: "📄 Academic & arXiv PDFs" },
            { id: "threads", label: "🧵 X Threads & Social" },
            { id: "code", label: "💻 GitHub Code & Repos" },
            { id: "deals", label: "🏷️ Products & SaaS Deals" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setActiveFilter(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-geist font-medium transition-all cursor-pointer ${
                activeFilter === pill.id
                  ? "bg-primary text-white shadow-xs font-semibold scale-105"
                  : "bg-surface-container-low border border-zinc-200 text-on-surface-variant hover:text-primary hover:border-zinc-300"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* ============================================================ */}
        {/* FABRIC-STYLE ROTATING COSMIC VORTEX STAGE                   */}
        {/* ============================================================ */}
        <div
          className={`relative w-full max-w-5xl mx-auto h-[640px] sm:h-[740px] md:h-[820px] flex items-center justify-center select-none overflow-visible ${
            !isRotating || hoveredCard ? "vortex-frozen" : ""
          }`}
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="absolute w-[460px] h-[460px] rounded-full bg-gradient-to-tr from-sky-100/60 via-purple-100/40 to-emerald-100/50 blur-3xl pointer-events-none -z-0 transition-transform duration-300"
            style={{ transform: `scale(${1 + centerProximity * 0.15})` }}
          />

          {/* Responsive Scaling Wrapper */}
          <div className="relative w-full h-full flex items-center justify-center transform scale-[0.54] sm:scale-[0.74] md:scale-[0.88] lg:scale-100 transition-transform origin-center">
            {/* ============================================================ */}
            {/* CENTER FOLDER HUB (Save's friendly vault folder)             */}
            {/* ============================================================ */}
            <div
              className="relative z-30 flex flex-col items-center justify-center group cursor-pointer transition-transform duration-300"
              style={{ transform: `scale(${1 + centerProximity * 0.08})` }}
            >
              {/* Folder Icon Glow */}
              <div className="absolute -inset-3 bg-gradient-to-tr from-sky-400/40 via-indigo-400/30 to-purple-400/40 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />

              {/* Sky Blue Folder Squircle */}
              <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-[#38BDF8] to-[#0284C7] shadow-[0_12px_28px_-6px_rgba(2,132,199,0.4)] flex flex-col items-center justify-center text-white transition-transform duration-200 group-hover:scale-105 border border-sky-300/40">
                {/* Folder Top Tab Silhouette */}
                <div className="absolute -top-1.5 left-3 w-8 h-2 rounded-t-md bg-[#38BDF8]" />

                {/* Friendly Face / Logo */}
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div className="w-3.5 h-1.5 border-b-2 border-white rounded-full" />
                </div>
              </div>

              {/* Floating Name Badge */}
              <div className="mt-2.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-zinc-200/90 shadow-md text-xs font-geist font-bold text-zinc-900 flex items-center gap-1.5 transition-transform group-hover:scale-105">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Save</span>
              </div>
            </div>

            {/* ============================================================ */}
            {/* ROTATING WAVE 1: INNER RING (~50s Clockwise)                 */}
            {/* ============================================================ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-vortex-ring-1">
              {innerWaveCards.map((card) => {
                const angleRad = (card.theta * Math.PI) / 180;
                const dynamicR = card.r * spreadFactor;
                const x = Math.round(dynamicR * Math.cos(angleRad));
                const y = Math.round(dynamicR * Math.sin(angleRad));
                const isHovered = hoveredCard?.id === card.id;
                const isDimmed = !matchesFilter(card);

                return (
                  <div
                    key={card.id}
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px + ${innerScrollShift}px)`,
                    }}
                    className="pointer-events-auto"
                  >
                    {/* Counter-Rotation Wrapper to keep card upright */}
                    <div className="animate-vortex-upright-1">
                      <div
                        onMouseEnter={() => setHoveredCard(card)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          width: `${card.size}px`,
                          height: `${card.size}px`,
                          transform: `translate(-50%, -50%) rotate(${card.tilt}deg) scale(${
                            isHovered ? card.scale * 1.35 : card.scale
                          })`,
                          opacity: isDimmed ? 0.25 : 1,
                          zIndex: isHovered ? 50 : 10,
                        }}
                        className="transition-all duration-300 ease-out cursor-pointer group relative"
                      >
                        <div
                          className={`w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow ${
                            card.bgColor ? card.bgColor : "bg-zinc-100"
                          } border border-black/5 hover:border-black/20 flex items-center justify-center`}
                        >
                          {card.image ? (
                            <img
                              src={card.image}
                              alt={card.title}
                              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : card.uiContent ? (
                            card.uiContent
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                              {card.logo}
                            </div>
                          )}
                        </div>

                        {/* Floating Tooltip On Hover */}
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-md text-white text-[11px] font-geist font-medium whitespace-nowrap shadow-xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{card.title}</span>
                            <span className="text-zinc-400">·</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-code font-semibold border ${card.formatBadgeColor}`}>
                              {card.formatBadge}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ============================================================ */}
            {/* ROTATING WAVE 2: MID RING (~75s Counter-Clockwise)           */}
            {/* ============================================================ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-vortex-ring-2">
              {midWaveCards.map((card) => {
                const angleRad = (card.theta * Math.PI) / 180;
                const dynamicR = card.r * spreadFactor;
                const x = Math.round(dynamicR * Math.cos(angleRad));
                const y = Math.round(dynamicR * Math.sin(angleRad));
                const isHovered = hoveredCard?.id === card.id;
                const isDimmed = !matchesFilter(card);

                return (
                  <div
                    key={card.id}
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px + ${midScrollShift}px)`,
                    }}
                    className="pointer-events-auto"
                  >
                    {/* Counter-Rotation Wrapper */}
                    <div className="animate-vortex-upright-2">
                      <div
                        onMouseEnter={() => setHoveredCard(card)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          width: `${card.size}px`,
                          height: `${card.size}px`,
                          transform: `translate(-50%, -50%) rotate(${card.tilt}deg) scale(${
                            isHovered ? card.scale * 1.35 : card.scale
                          })`,
                          opacity: isDimmed ? 0.25 : 1,
                          zIndex: isHovered ? 50 : 10,
                        }}
                        className="transition-all duration-300 ease-out cursor-pointer group relative"
                      >
                        <div
                          className={`w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow ${
                            card.bgColor ? card.bgColor : "bg-zinc-100"
                          } border border-black/5 hover:border-black/20 flex items-center justify-center`}
                        >
                          {card.image ? (
                            <img
                              src={card.image}
                              alt={card.title}
                              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : card.uiContent ? (
                            card.uiContent
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                              {card.logo}
                            </div>
                          )}
                        </div>

                        {/* Floating Tooltip On Hover */}
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-md text-white text-[11px] font-geist font-medium whitespace-nowrap shadow-xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{card.title}</span>
                            <span className="text-zinc-400">·</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-code font-semibold border ${card.formatBadgeColor}`}>
                              {card.formatBadge}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ============================================================ */}
            {/* ROTATING WAVE 3: OUTER RING (~105s Clockwise)                */}
            {/* ============================================================ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-vortex-ring-3">
              {outerWaveCards.map((card) => {
                const angleRad = (card.theta * Math.PI) / 180;
                const dynamicR = card.r * spreadFactor;
                const x = Math.round(dynamicR * Math.cos(angleRad));
                const y = Math.round(dynamicR * Math.sin(angleRad));
                const isHovered = hoveredCard?.id === card.id;
                const isDimmed = !matchesFilter(card);

                return (
                  <div
                    key={card.id}
                    style={{
                      position: "absolute",
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px + ${outerScrollShift}px)`,
                    }}
                    className="pointer-events-auto"
                  >
                    {/* Counter-Rotation Wrapper */}
                    <div className="animate-vortex-upright-3">
                      <div
                        onMouseEnter={() => setHoveredCard(card)}
                        onMouseLeave={() => setHoveredCard(null)}
                        style={{
                          width: `${card.size}px`,
                          height: `${card.size}px`,
                          transform: `translate(-50%, -50%) rotate(${card.tilt}deg) scale(${
                            isHovered ? card.scale * 1.35 : card.scale
                          })`,
                          opacity: isDimmed ? 0.25 : 1,
                          zIndex: isHovered ? 50 : 10,
                        }}
                        className="transition-all duration-300 ease-out cursor-pointer group relative"
                      >
                        <div
                          className={`w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow ${
                            card.bgColor ? card.bgColor : "bg-zinc-100"
                          } border border-black/5 hover:border-black/20 flex items-center justify-center`}
                        >
                          {card.image ? (
                            <img
                              src={card.image}
                              alt={card.title}
                              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : card.uiContent ? (
                            card.uiContent
                          ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                              {card.logo}
                            </div>
                          )}
                        </div>

                        {/* Floating Tooltip On Hover */}
                        {isHovered && (
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-zinc-900/95 backdrop-blur-md text-white text-[11px] font-geist font-medium whitespace-nowrap shadow-xl pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5">
                            <span className="truncate max-w-[170px]">{card.title}</span>
                            <span className="text-zinc-400">·</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-code font-semibold border ${card.formatBadgeColor}`}>
                              {card.formatBadge}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* BOTTOM INSPECTOR BAR                                         */}
        {/* ============================================================ */}
        <div className="max-w-xl mx-auto -mt-4 sm:-mt-8 p-4 rounded-2xl bg-surface-container-low border border-zinc-200 text-xs font-inter text-on-surface-variant flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-2 truncate">
            <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">
              auto_awesome
            </span>
            <span className="truncate">
              {hoveredCard ? (
                <>
                  <strong className="text-zinc-900 font-geist">{hoveredCard.title}</strong>
                  <span className="text-outline mx-1.5">|</span>
                  <span className="font-code text-emerald-700">{hoveredCard.source}</span>
                </>
              ) : (
                "Scroll through to feel depth • Hover any card to inspect"
              )}
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-white border border-zinc-200 text-[10px] font-code text-zinc-700 font-semibold shrink-0">
            24 Formats Synced
          </span>
        </div>
      </div>
    </section>
  );
}
