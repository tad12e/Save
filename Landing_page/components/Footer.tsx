"use client";

import React, { useState } from "react";
import Link from "next/link";
import { APP_ROUTES } from "../lib/routes";
import {
  EdgeLogo,
  ChromeLogo,
  AppleLogo,
  AndroidLogo,
  PrivacyChoicesIcon,
  GitHubLogo,
  XLogo,
} from "./BrandLogos";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubscribed(true);
  };

  return (
    <footer className="w-full bg-gradient-to-b from-[#E8F2FD] via-[#85B8F6] via-35% to-[#1E64D8] pt-12 sm:pt-16 pb-10 relative overflow-hidden text-blue-950">
      {/* Decorative ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-white/30 blur-3xl rounded-full pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[300px] bg-blue-400/20 blur-3xl rounded-full pointer-events-none -z-0" />

      {/* ------------------------------------------------------------ */}
      {/* TOP SECTION: MISSION & NEWSLETTER (LEFT) + 4 LINK COLS (RIGHT)*/}
      {/* ------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-10">
          {/* LEFT COLUMN: Mission & Email Dispatch */}
          <div className="lg:col-span-5 space-y-6">
            <p className="font-geist text-sm sm:text-[15px] text-blue-950 leading-relaxed max-w-md font-medium">
              The cognitive bookmark architecture for engineers, researchers, and creators. Organize by why you saved it, extract temporal deadlines, and sync seamlessly to Notion, Sheets, and AI tools.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <h4 className="font-geist text-xs font-bold uppercase tracking-wider text-blue-950">
                  The Save Dispatch
                </h4>
                <p className="font-inter text-xs text-blue-900/80 mt-0.5 font-medium">
                  Product updates, archetype templates, and new integrations, once a month.
                </p>
              </div>

              {subscribed ? (
                <div className="p-3 rounded-full bg-white/90 border border-white text-xs font-geist font-semibold text-blue-950 inline-flex items-center gap-2 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>You&apos;re subscribed to the Save Dispatch!</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex items-center bg-white border border-white/80 rounded-full p-1.5 shadow-sm max-w-sm focus-within:ring-2 focus-within:ring-blue-300 transition-all"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="flex-1 bg-transparent px-3.5 py-1 text-xs text-zinc-900 placeholder:text-zinc-400 font-inter focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe to newsletter"
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      arrow_forward
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* RIGHT COLUMNS: 4 Navigation Columns matching Offerpost layout */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4 font-geist text-xs">
            {/* Column 1: Core Platform */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-blue-950/70 uppercase tracking-wider block">
                Platform
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={APP_ROUTES.signIn}
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Web Vault
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Pricing</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/90 text-blue-900 shadow-2xs">
                      $2.60
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#download"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Extension</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/80 text-blue-900 shadow-2xs">
                      Alt+S
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#mobile"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Mobile Apps
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Ecosystem & Browsers */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-blue-950/70 uppercase tracking-wider block">
                Ecosystem
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://microsoftedge.microsoft.com/addons"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-950 font-semibold hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <EdgeLogo size={13} />
                    <span>Microsoft Edge</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/90 text-blue-900 shadow-2xs">
                      MV3
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#download"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <ChromeLogo size={13} />
                    <span>Chrome Store</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#mobile"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <AppleLogo size={12} className="text-blue-950" />
                    <span>iOS Flutter</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#mobile"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <AndroidLogo size={12} className="text-blue-950" />
                    <span>Android</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Integrations & Updates */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-blue-950/70 uppercase tracking-wider block">
                Integrations
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#sync-mcp"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Claude MCP</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-900 shadow-2xs">
                      live
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#stack"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Notion Sync
                  </a>
                </li>
                <li>
                  <a
                    href="#stack"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Google Sheets
                  </a>
                </li>
                <li>
                  <div className="inline-flex items-center gap-1.5 text-blue-950 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Status 99.9%</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Compliance & Legal */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-blue-950/70 uppercase tracking-wider block">
                Legal
              </span>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/terms"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Privacy Statement
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PrivacyChoicesIcon size={20} />
                    <span>Privacy Choices</span>
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:support@yazem.tech"
                    className="text-blue-950 font-medium hover:text-white transition-colors inline-block"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* GIANT WATERMARK BRAND NAME: "Save" (OVER DEEPER BLUE BASE)   */}
      {/* ------------------------------------------------------------ */}
      <div className="w-full overflow-hidden select-none pointer-events-none mt-6 sm:mt-10 mb-2">
        <h2 className="font-geist font-black tracking-tighter text-[23vw] leading-[0.75] text-center text-white/[0.22] uppercase w-full block whitespace-nowrap drop-shadow-xs">
          Save
        </h2>
      </div>

      {/* ------------------------------------------------------------ */}
      {/* BOTTOM METADATA & COPYRIGHT STRIP (WHITE & LIGHT BLUE)       */}
      {/* ------------------------------------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 border-t border-white/20 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-blue-100 font-inter font-medium">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-white font-semibold">© 2026 Save Technologies Inc.</span>
            <span className="hidden sm:inline text-blue-200/60">•</span>
            <span>A cognitive bookmark &amp; knowledge vault architecture.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-blue-200/90">
              Microsoft Edge &amp; company logos belong to their respective owners.
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/tad12e/Save"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title="GitHub"
              >
                <GitHubLogo size={14} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-md text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                title="X / Twitter"
              >
                <XLogo size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* PRIVACY CHOICES MODAL DIALOG                                 */}
      {/* ============================================================ */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4 text-zinc-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <PrivacyChoicesIcon size={26} />
                <h4 className="font-geist font-semibold text-zinc-900 text-sm">
                  Your Privacy Choices &amp; Opt-Out
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
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
                  <p className="text-xs font-semibold text-zinc-900 font-geist">Essential Cookies &amp; Storage</p>
                  <p className="text-[11px] text-zinc-500">Required for authentication and knowledge vault sync.</p>
                </div>
                <input type="checkbox" checked disabled className="rounded text-primary" />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200 cursor-pointer">
                <div>
                  <p className="text-xs font-semibold text-zinc-900 font-geist">Telemetry &amp; Diagnostics</p>
                  <p className="text-[11px] text-zinc-500">Anonymous crash reports to improve extension stability.</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-primary" />
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors cursor-pointer"
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