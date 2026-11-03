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
    <footer className="w-full bg-surface py-12 px-4 sm:px-6 lg:px-8">
      {/* ============================================================ */}
      {/* GIANT FADED-BLUE HERO FOOTER CARD (OFFERPOST ARCHITECTURE)   */}
      {/* ============================================================ */}
      <div className="max-w-7xl mx-auto rounded-[32px] sm:rounded-[44px] bg-gradient-to-b from-[#F3F7FE] via-[#EDF3FC] to-[#E5EFFB] border border-blue-200/70 shadow-sm p-8 sm:p-12 lg:p-16 relative overflow-hidden text-zinc-800">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-blue-200/30 blur-3xl rounded-full pointer-events-none -z-0" />

        {/* ------------------------------------------------------------ */}
        {/* TOP SECTION: MISSION & NEWSLETTER (LEFT) + 4 LINK COLS (RIGHT)*/}
        {/* ------------------------------------------------------------ */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-8">
          {/* LEFT COLUMN: Mission & Email Dispatch */}
          <div className="lg:col-span-5 space-y-6">
            <p className="font-geist text-sm sm:text-[15px] text-zinc-700 leading-relaxed max-w-md font-normal">
              The cognitive bookmark architecture for engineers, researchers, and creators. Organize by why you saved it, extract temporal deadlines, and sync seamlessly to Notion, Sheets, and AI tools.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <h4 className="font-geist text-xs font-semibold uppercase tracking-wider text-zinc-900">
                  The Save Dispatch
                </h4>
                <p className="font-inter text-xs text-zinc-500 mt-0.5">
                  Product updates, archetype templates, and new integrations, once a month.
                </p>
              </div>

              {subscribed ? (
                <div className="p-3 rounded-full bg-blue-100/80 border border-blue-300 text-xs font-geist font-medium text-blue-900 inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>You&apos;re subscribed to the Save Dispatch!</span>
                </div>
              ) : (
                <form
                  onSubmit={handleSubscribe}
                  className="flex items-center bg-white/90 backdrop-blur-sm border border-blue-200/80 rounded-full p-1.5 shadow-2xs max-w-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
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
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Platform
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href={APP_ROUTES.signIn}
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Web Vault
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Pricing</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      $2.60
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#download"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Extension</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-zinc-200/80 text-zinc-700">
                      Alt+S
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#mobile"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Mobile Apps
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 2: Ecosystem & Browsers */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Ecosystem
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="https://microsoftedge.microsoft.com/addons"
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 font-medium"
                  >
                    <EdgeLogo size={13} />
                    <span>Microsoft Edge</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-blue-100 text-blue-800">
                      MV3
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#download"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ChromeLogo size={13} />
                    <span>Chrome Store</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#mobile"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  >
                    <AppleLogo size={12} className="text-zinc-700" />
                    <span>iOS Flutter</span>
                  </a>
                </li>
                <li>
                  <a
                    href="#mobile"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1"
                  >
                    <AndroidLogo size={12} className="text-zinc-700" />
                    <span>Android</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Integrations & Updates */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Integrations
              </span>
              <ul className="space-y-2.5">
                <li>
                  <a
                    href="#sync-mcp"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Claude MCP</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                      live
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    href="#stack"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Notion Sync
                  </a>
                </li>
                <li>
                  <a
                    href="#stack"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Google Sheets
                  </a>
                </li>
                <li>
                  <div className="inline-flex items-center gap-1.5 text-zinc-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Status 99.9%</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Compliance & Legal */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Legal
              </span>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/terms"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Terms of Use
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Privacy Statement
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PrivacyChoicesIcon size={20} />
                    <span>Privacy Choices</span>
                  </button>
                </li>
                <li>
                  <a
                    href="mailto:support@yazem.tech"
                    className="text-zinc-700 hover:text-blue-600 transition-colors inline-block"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* GIANT WATERMARK BRAND NAME: "Save" (MATCHING OFFERPOST STYLE)*/}
        {/* ------------------------------------------------------------ */}
        <div className="relative z-0 w-full overflow-hidden select-none pointer-events-none my-0 sm:my-2">
          <h2 className="font-geist font-black tracking-tighter text-[20vw] sm:text-[22vw] lg:text-[23vw] leading-[0.78] text-center text-blue-900/[0.07] uppercase">
            Save
          </h2>
        </div>

        {/* ------------------------------------------------------------ */}
        {/* BOTTOM METADATA & COPYRIGHT STRIP                            */}
        {/* ------------------------------------------------------------ */}
        <div className="relative z-10 pt-6 border-t border-blue-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[11px] text-zinc-500 font-inter">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>© 2026 Save Technologies Inc.</span>
            <span className="hidden sm:inline text-zinc-400">•</span>
            <span>A cognitive bookmark &amp; knowledge vault architecture.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-400">
              Microsoft Edge &amp; company logos belong to their respective owners.
            </span>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/tad12e/Save"
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors"
                title="GitHub"
              >
                <GitHubLogo size={14} />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors"
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
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