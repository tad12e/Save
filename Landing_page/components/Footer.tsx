"use client";

import React from "react";
import { APP_ROUTES } from "../lib/routes";
import {
  ChromeLogo,
  SafariLogo,
  AppleLogo,
  AndroidLogo,
  XLogo,
  GitHubLogo,
  NotionLogo,
  GoogleSheetsLogo,
  AirtableLogo,
  ClaudeLogo,
} from "./BrandLogos";

export default function Footer() {
  return (
    <footer className="bg-surface-container-lowest border-t border-surface-container-high pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* ============================================================ */}
        {/* TOP PLATFORM AVAILABILITY RIBBON                            */}
        {/* ============================================================ */}
        <div className="mb-16 p-6 sm:p-8 rounded-[24px] bg-white border border-surface-container-high shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-outline font-geist font-semibold block mb-1">
                Every Surface Supported
              </span>
              <h3 className="font-geist text-xl sm:text-2xl font-semibold text-on-surface">
                Get Save on your favorite platform
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-code text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Cloud Sync across all devices</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            {/* Platform 1: Browser Extension */}
            <a
              href="#download"
              className="p-4 rounded-2xl bg-surface-container-low border border-zinc-200/80 hover:border-zinc-400 hover:bg-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                  <ChromeLogo size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 font-geist group-hover:text-primary transition-colors">
                    Browser Extension
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-inter">Chrome, Safari, Arc & Edge</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </a>

            {/* Platform 2: Web App */}
            <a
              href={APP_ROUTES.signIn}
              className="p-4 rounded-2xl bg-surface-container-low border border-zinc-200/80 hover:border-zinc-400 hover:bg-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold font-geist shadow-2xs">
                  S.
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 font-geist group-hover:text-primary transition-colors">
                    Web Vault
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-inter">app.save.io • Desktop</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-primary transition-colors">
                north_east
              </span>
            </a>

            {/* Platform 3: Mobile Apps */}
            <a
              href="#mobile"
              className="p-4 rounded-2xl bg-surface-container-low border border-zinc-200/80 hover:border-zinc-400 hover:bg-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-1 p-1 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                  <AppleLogo size={16} className="text-zinc-900 ml-1" />
                  <AndroidLogo size={16} className="text-emerald-600 mr-1" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 font-geist group-hover:text-primary transition-colors">
                    Mobile App
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-inter">iOS & Android Flutter</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </a>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN DIRECTORY SITEMAP                                      */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-surface-container-high">
          {/* Col 1: Brand & Mission */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center text-xs font-bold font-geist shadow-xs">
                S.
              </div>
              <span className="font-geist text-lg font-semibold tracking-tight text-on-surface">
                Save
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-geist uppercase tracking-wider font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                v2.4 Live
              </span>
            </div>

            <p className="font-inter text-xs text-on-surface-variant max-w-sm leading-relaxed">
              The AI action-oriented knowledge vault. Save organizes content by objective instead of format, extracting temporal deadlines and syncing 2-way with Notion, Sheets, and AI assistants.
            </p>

            <div className="pt-2 flex items-center gap-2 text-xs font-code text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          {/* Col 2: Platforms */}
          <div className="space-y-3 font-geist text-xs">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface block">
              Platforms
            </span>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                <a href="#download" className="hover:text-primary transition-colors">
                  Chrome Extension
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-primary transition-colors">
                  Safari & Arc Clipper
                </a>
              </li>
              <li>
                <a href={APP_ROUTES.signIn} className="hover:text-primary transition-colors">
                  Web Vault (app.save.io)
                </a>
              </li>
              <li>
                <a href="#mobile" className="hover:text-primary transition-colors">
                  iOS Mobile App
                </a>
              </li>
              <li>
                <a href="#mobile" className="hover:text-primary transition-colors">
                  Android Flutter Client
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-emerald-700 font-semibold hover:text-emerald-800 transition-colors">
                  Pricing ($2.60/mo)
                </a>
              </li>
              <li>
                <a href="#sync-mcp" className="hover:text-primary transition-colors">
                  Model Context Protocol (MCP)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Integrations */}
          <div className="space-y-3 font-geist text-xs">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface block">
              Integrations
            </span>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                <a href="#stack" className="hover:text-primary transition-colors">
                  Notion Databases
                </a>
              </li>
              <li>
                <a href="#stack" className="hover:text-primary transition-colors">
                  Google Sheets v4
                </a>
              </li>
              <li>
                <a href="#stack" className="hover:text-primary transition-colors">
                  Airtable Relational Base
                </a>
              </li>
              <li>
                <a href="#stack" className="hover:text-primary transition-colors">
                  Spotify Audio Queue
                </a>
              </li>
              <li>
                <a href="#stack" className="hover:text-primary transition-colors">
                  Slack BlockKit Alerts
                </a>
              </li>
              <li>
                <a href="#sync-mcp" className="hover:text-primary transition-colors">
                  Claude & Cursor AI Tools
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Intents & Features */}
          <div className="space-y-3 font-geist text-xs">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface block">
              Action Intents
            </span>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                <span className="hover:text-primary cursor-default">apply (Deadlines & Jobs)</span>
              </li>
              <li>
                <span className="hover:text-primary cursor-default">learn (Papers & Guides)</span>
              </li>
              <li>
                <span className="hover:text-primary cursor-default">buy (Hardware & SaaS)</span>
              </li>
              <li>
                <span className="hover:text-primary cursor-default">watch (Video Keyframes)</span>
              </li>
              <li>
                <span className="hover:text-primary cursor-default">hire (Candidate Profiles)</span>
              </li>
              <li>
                <span className="hover:text-primary cursor-default">track (Market Intel)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SUB-FOOTER                                                   */}
        {/* ============================================================ */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-inter text-on-surface-variant">
          <p>© 2026 Save Technologies Inc. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Security Overview
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
              title="GitHub"
            >
              <GitHubLogo size={16} />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
              title="X / Twitter"
            >
              <XLogo size={14} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
