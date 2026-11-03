"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  MicrosoftLogo,
  EdgeLogo,
  PrivacyChoicesIcon,
} from "./BrandLogos";

export default function Footer() {
  const [selectedLanguage, setSelectedLanguage] = useState("English (United States)");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const languages = [
    "English (United States)",
    "English (United Kingdom)",
    "Español (España)",
    "Français (France)",
    "Deutsch (Deutschland)",
    "日本語 (日本)",
    "中文 (简体)",
  ];

  return (
    <footer className="bg-surface-container-lowest border-t border-surface-container-high pt-16 pb-10 text-on-surface">
      <div className="max-w-7xl mx-auto px-6">
        {/* ============================================================ */}
        {/* TOP PLATFORM AVAILABILITY RIBBON (MICROSOFT & CROSS-PLATFORM) */}
        {/* ============================================================ */}
        <div className="mb-16 p-6 sm:p-8 rounded-[24px] bg-white border border-surface-container-high shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-wider text-outline font-geist font-semibold">
                  Multi-Surface Ecosystem
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Microsoft Edge Verified
                </span>
              </div>
              <h3 className="font-geist text-xl sm:text-2xl font-semibold text-on-surface">
                Get Save on Microsoft Edge and across all surfaces
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-code text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Cloud Sync across all devices</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* Surface 1: Microsoft Edge Add-on */}
            <a
              href="https://microsoftedge.microsoft.com/addons"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-2xl bg-surface-container-low border border-blue-200/70 hover:border-blue-500 hover:bg-white transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white border border-blue-100 shadow-2xs group-hover:scale-105 transition-transform">
                  <EdgeLogo size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-zinc-900 font-geist group-hover:text-primary transition-colors">
                      Microsoft Edge
                    </h4>
                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                      Add-on
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-inter">Manifest V3 • Edge Store</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-blue-600 group-hover:translate-x-0.5 transition-transform">
                north_east
              </span>
            </a>

            {/* Surface 2: Chrome Web Store */}
            <a
              href="#download"
              className="p-4 rounded-2xl bg-surface-container-low border border-zinc-200/80 hover:border-zinc-400 hover:bg-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white border border-zinc-200 shadow-2xs group-hover:scale-105 transition-transform">
                  <ChromeLogo size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 font-geist group-hover:text-primary transition-colors">
                    Chrome Extension
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-inter">Chrome, Arc, Brave</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-[16px] text-zinc-400 group-hover:text-primary transition-colors">
                arrow_forward
              </span>
            </a>

            {/* Surface 3: Web Vault */}
            <a
              href={APP_ROUTES.signIn}
              className="p-4 rounded-2xl bg-surface-container-low border border-zinc-200/80 hover:border-zinc-400 hover:bg-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center text-xs font-bold font-geist shadow-2xs group-hover:scale-105 transition-transform">
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

            {/* Surface 4: Mobile Apps */}
            <a
              href="#mobile"
              className="p-4 rounded-2xl bg-surface-container-low border border-zinc-200/80 hover:border-zinc-400 hover:bg-white transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center -space-x-1 p-1.5 rounded-xl bg-white border border-zinc-200 shadow-2xs group-hover:scale-105 transition-transform">
                  <AppleLogo size={16} className="text-zinc-900 ml-0.5" />
                  <AndroidLogo size={16} className="text-emerald-600 mr-0.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 font-geist group-hover:text-primary transition-colors">
                    Mobile Client
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
        {/* MAIN DIRECTORY SITEMAP (MICROSOFT PARTNER PORTAL SPEC)        */}
        {/* ============================================================ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-surface-container-high">
          {/* Col 1: Brand, Mission & Microsoft Partner Badge */}
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

            {/* Microsoft Edge Add-ons Partner Verification Badge */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-zinc-200/80 max-w-sm space-y-2">
              <div className="flex items-center gap-2">
                <MicrosoftLogo size={16} />
                <span className="text-[11px] font-semibold text-zinc-900 font-geist">
                  Microsoft Partner Center Registered
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-inter leading-normal">
                Compliant with Microsoft Edge Add-ons Store Developer Standards, Manifest V3 security sandboxing, and strict privacy controls.
              </p>
            </div>

            <div className="pt-1 flex items-center gap-2 text-xs font-code text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational (99.99%)</span>
            </div>
          </div>

          {/* Col 2: Platforms & Extensions */}
          <div className="space-y-3 font-geist text-xs">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface block">
              Platforms
            </span>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                <a
                  href="https://microsoftedge.microsoft.com/addons"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors font-medium"
                >
                  <EdgeLogo size={13} />
                  <span>Microsoft Edge Add-on</span>
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-primary transition-colors">
                  Chrome Web Store
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-primary transition-colors">
                  Safari & Arc Web Clipper
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
            </ul>
          </div>

          {/* Col 3: Archetypes & Integrations */}
          <div className="space-y-3 font-geist text-xs">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface block">
              Archetypes & Sync
            </span>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                <span className="text-zinc-700 font-medium">Amazon & Commerce Cards</span>
              </li>
              <li>
                <span className="text-zinc-700 font-medium">ArXiv Research Papers</span>
              </li>
              <li>
                <span className="text-zinc-700 font-medium">Job Postings & ATS</span>
              </li>
              <li>
                <a href="#stack" className="hover:text-primary transition-colors">
                  Notion Databases 2-Way
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
                <a href="#sync-mcp" className="hover:text-primary transition-colors">
                  Claude & Cursor MCP Tools
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Developers & Compliance */}
          <div className="space-y-3 font-geist text-xs">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-on-surface block">
              Developer & Legal
            </span>
            <ul className="space-y-2 text-on-surface-variant">
              <li>
                <a
                  href="https://partner.microsoft.com/dashboard/microsoftedge"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Edge Partner Dashboard
                </a>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors font-medium text-zinc-900">
                  Privacy Statement
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors font-medium text-zinc-900">
                  Terms of Use
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowPrivacyModal(true)}
                  className="hover:text-primary transition-colors flex items-center gap-1.5 text-left"
                >
                  <PrivacyChoicesIcon size={22} />
                  <span>Your Privacy Choices</span>
                </button>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Consumer Health Privacy
                </Link>
              </li>
              <li>
                <a href="mailto:support@yazem.tech" className="hover:text-primary transition-colors">
                  Contact Support / Help
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MICROSOFT CORPORATE STYLE SUB-FOOTER BOTTOM BAR              */}
        {/* (Matching partner.microsoft.com / Microsoft Edge standards)  */}
        {/* ============================================================ */}
        <div className="pt-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 text-xs font-inter text-zinc-600">
          {/* Left: Language / Region Selector with Globe */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-zinc-100 border border-zinc-200/70 text-zinc-700 transition-colors"
              aria-label="Select Region and Language"
            >
              <span className="material-symbols-outlined text-[16px] text-zinc-500">
                language
              </span>
              <span className="font-geist text-[11px]">{selectedLanguage}</span>
              <span className="material-symbols-outlined text-[14px] text-zinc-400">
                expand_more
              </span>
            </button>

            {isLangOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl bg-white border border-zinc-200 shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-[11px] font-geist hover:bg-zinc-50 transition-colors flex items-center justify-between ${
                      selectedLanguage === lang ? "text-primary font-semibold bg-zinc-50" : "text-zinc-700"
                    }`}
                  >
                    <span>{lang}</span>
                    {selectedLanguage === lang && (
                      <span className="material-symbols-outlined text-[14px] text-primary">
                        check
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Official Microsoft-Style Legal Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
            <a
              href="mailto:support@yazem.tech"
              className="hover:text-primary transition-colors"
            >
              Contact Support
            </a>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacy & cookies
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Terms of use
            </Link>
            <a
              href="#trademarks"
              className="hover:text-primary transition-colors"
            >
              Trademarks
            </a>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
            >
              <PrivacyChoicesIcon size={22} />
              <span>Your Privacy Choices</span>
            </button>
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Consumer Health Privacy
            </Link>
          </div>

          {/* Right: Copyright & Social Icons */}
          <div className="flex items-center gap-4 text-[11px] text-zinc-500">
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/tad12e/Save"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                title="GitHub"
              >
                <GitHubLogo size={15} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors"
                title="X / Twitter"
              >
                <XLogo size={13} />
              </a>
            </div>
            <span>© 2026 Save Technologies Inc.</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TRADEMARK DISCLAIMER                                         */}
        {/* ============================================================ */}
        <div id="trademarks" className="mt-6 pt-4 border-t border-zinc-100 text-[10px] text-zinc-400 font-inter leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p>
            Microsoft, Microsoft Edge, Windows, and the Microsoft logo are registered trademarks of Microsoft Corporation. Google Chrome is a trademark of Google LLC. Apple and Safari are trademarks of Apple Inc. Save Technologies is an independent developer partner.
          </p>
          <div className="flex items-center gap-1.5 text-zinc-400 shrink-0">
            <MicrosoftLogo size={12} />
            <span>Edge Add-ons Partner</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PRIVACY CHOICES MODAL DIALOG                                 */}
      {/* ============================================================ */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <PrivacyChoicesIcon size={26} />
                <h4 className="font-geist font-semibold text-zinc-900 text-sm">
                  Your Privacy Choices & Opt-Out
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="text-xs text-zinc-600 font-inter leading-relaxed">
              Under California (CCPA/CPRA), GDPR, and Microsoft Partner developer privacy frameworks, you have the right to control your personal data.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 font-geist">Essential Cookies & Storage</p>
                  <p className="text-[11px] text-zinc-500">Required for authentication and knowledge vault sync.</p>
                </div>
                <input type="checkbox" checked disabled className="rounded text-primary" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 font-geist">Telemetry & Diagnostics</p>
                  <p className="text-[11px] text-zinc-500">Anonymous crash reports to improve extension stability.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-primary" />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}