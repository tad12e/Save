"use client";

import React from "react";
import {
  YouTubeLogo,
  SpotifyLogo,
  ChromeLogo,
  SafariLogo,
  RedditLogo,
  GitHubLogo,
  XLogo,
  SubstackLogo,
  FigmaLogo,
  ZoomLogo,
  ArxivLogo,
  LinearLogo,
  NotionLogo,
} from "./BrandLogos";

const appsRow1 = [
  { name: "YouTube", Logo: YouTubeLogo },
  { name: "Spotify", Logo: SpotifyLogo },
  { name: "Chrome", Logo: ChromeLogo },
  { name: "Safari", Logo: SafariLogo },
  { name: "Reddit", Logo: RedditLogo },
  { name: "GitHub", Logo: GitHubLogo },
  { name: "X / Twitter", Logo: XLogo },
];

const appsRow2 = [
  { name: "Notion Docs", Logo: NotionLogo },
  { name: "Substack", Logo: SubstackLogo },
  { name: "Figma", Logo: FigmaLogo },
  { name: "Zoom Records", Logo: ZoomLogo },
  { name: "arXiv Papers", Logo: ArxivLogo },
  { name: "Linear", Logo: LinearLogo },
];

export default function SaveAnythingMarquee() {
  return (
    <section className="py-24 border-b border-surface-container-high bg-surface-container-low/40">
      <div className="max-w-7xl mx-auto px-6">
        {/* Architectural Showcase Container (Pure Light Mode) */}
        <div className="p-8 md:p-14 rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm text-center relative overflow-hidden">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-amber-100/40 via-rose-100/30 to-indigo-100/30 blur-3xl rounded-full pointer-events-none -z-10" />

          {/* Micro-badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-low border border-surface-container-high mb-6 shadow-2xs">
            <span className="material-symbols-outlined text-[16px] text-amber-600">extension</span>
            <span className="font-geist text-[11px] uppercase tracking-wider text-on-surface font-semibold">
              UNIVERSAL 1-CLICK BROWSER CAPTURE & MOBILE SHARE SHEET
            </span>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-4 max-w-3xl mx-auto mb-10">
            <h2 className="font-geist text-3xl sm:text-5xl font-semibold text-on-surface tracking-[-0.035em] leading-tight">
              Save anything from anywhere.
            </h2>
            <p className="font-inter text-sm md:text-base text-on-surface-variant leading-relaxed">
              Websites, research papers, YouTube videos, X threads, code repos, and e-commerce deals. Save ingests any format from any source with zero fidelity loss.
            </p>
          </div>

          {/* Apps Passing Horizontally: Row 1 (Moving Left) */}
          <div className="relative w-full flex overflow-x-hidden mb-4">
            <div className="flex items-center gap-4 whitespace-nowrap animate-marquee pause-on-hover">
              {[...appsRow1, ...appsRow1, ...appsRow1].map((app, i) => {
                const Logo = app.Logo;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-container-low border border-zinc-200 shadow-xs transition-transform hover:scale-105 hover:border-zinc-300 cursor-default"
                  >
                    <Logo size={22} className="shrink-0" />
                    <span className="text-xs font-semibold text-zinc-900 font-geist">{app.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Apps Passing Horizontally: Row 2 (Moving Left Offset) */}
          <div className="relative w-full flex overflow-x-hidden mb-10">
            <div className="flex items-center gap-4 whitespace-nowrap animate-marquee-fast pause-on-hover">
              {[...appsRow2, ...appsRow2, ...appsRow2].map((app, i) => {
                const Logo = app.Logo;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-surface-container-low border border-zinc-200 shadow-xs transition-transform hover:scale-105 hover:border-zinc-300 cursor-default"
                  >
                    <Logo size={22} className="shrink-0" />
                    <span className="text-xs font-semibold text-zinc-900 font-geist">{app.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Parser Pills */}
          <div className="pt-6 border-t border-zinc-100 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-outline font-geist font-medium mr-2">
              Specialized Parsers:
            </span>
            {[
              { label: "Video Transcripts", icon: "smart_display" },
              { label: "Pricing & Buy Triggers", icon: "sell" },
              { label: "Code Repos", icon: "code" },
              { label: "Academic PDFs", icon: "description" },
              { label: "Job Listings", icon: "work" },
            ].map((parser) => (
              <span
                key={parser.label}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface-container-low border border-zinc-200 text-zinc-800 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[14px] text-zinc-600">
                  {parser.icon}
                </span>
                <span>{parser.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
