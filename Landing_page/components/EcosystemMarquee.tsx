"use client";

import React from "react";
import {
  NotionLogo,
  GoogleSheetsLogo,
  AirtableLogo,
  SpotifyLogo,
  YouTubeLogo,
  RedditLogo,
  GitHubLogo,
  RaycastLogo,
  LinearLogo,
  ClaudeLogo,
} from "./BrandLogos";

const integrations = [
  { name: "Claude MCP", Logo: ClaudeLogo },
  { name: "Notion", Logo: NotionLogo },
  { name: "Google Sheets", Logo: GoogleSheetsLogo },
  { name: "Airtable", Logo: AirtableLogo },
  { name: "Spotify", Logo: SpotifyLogo },
  { name: "YouTube", Logo: YouTubeLogo },
  { name: "Reddit", Logo: RedditLogo },
  { name: "GitHub", Logo: GitHubLogo },
  { name: "Raycast", Logo: RaycastLogo },
  { name: "Linear", Logo: LinearLogo },
];

export default function EcosystemMarquee() {
  return (
    <section className="py-12 border-b border-surface-container-high bg-surface-container-lowest overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-8">
        <p className="font-geist text-[11px] uppercase tracking-widest text-outline font-semibold">
          BI-DIRECTIONAL SYNC & UNIVERSAL CAPTURE ACROSS YOUR WORKSPACE
        </p>
      </div>

      {/* Infinite scrolling marquee track */}
      <div className="relative w-full flex overflow-x-hidden">
        <div className="flex items-center gap-6 md:gap-8 whitespace-nowrap animate-marquee pause-on-hover">
          {[...integrations, ...integrations].map((item, index) => {
            const Logo = item.Logo;
            return (
              <div
                key={index}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-surface-container-low/70 border border-surface-container-high transition-transform hover:scale-105 shadow-2xs cursor-default"
              >
                <Logo size={20} className="shrink-0" />
                <span className="font-geist text-xs md:text-sm font-semibold tracking-tight text-on-surface">
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
