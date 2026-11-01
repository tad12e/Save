"use client";

import React from "react";
import { NotionLogo, GoogleSheetsLogo, ClaudeLogo } from "./BrandLogos";

export default function BidirectionalSyncMCP() {
  return (
    <section id="sync-mcp" className="py-24 border-b border-surface-container-high bg-surface">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-16 space-y-3">
          <span className="font-geist text-xs uppercase tracking-wider text-outline font-semibold block">
            Bi-Directional Schema Pipelines
          </span>
          <h2 className="font-geist text-3xl sm:text-4xl lg:text-5xl font-semibold text-on-surface tracking-tight">
            From clip to structured database in sub-100ms.
          </h2>
          <p className="font-inter text-sm md:text-base text-on-surface-variant mt-4 leading-relaxed">
            Save does not imprison your knowledge in a proprietary silo. It maps incoming bookmarks straight into your team’s existing Notion, Google Sheets, and Airtable tables.
          </p>
        </div>

        {/* 2-Column Workflow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Visual Data Pipeline Flow (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-[24px] border border-surface-container-high p-6 md:p-8 space-y-5 shadow-xs">
            <h3 className="font-geist text-lg font-semibold text-on-surface">
              Live Relational Schema Dispatch
            </h3>

            <div className="space-y-4">
              {/* Step 1: Input */}
              <div className="flex items-center gap-4 p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-code text-xs font-bold">
                  01
                </div>
                <div className="flex-grow">
                  <div className="text-xs font-semibold text-on-surface font-geist">
                    Browser Extension Event
                  </div>
                  <div className="text-xs text-outline font-code">
                    POST /v1/vault/clip {"{\"url\": \"arxiv.org/abs/2401.001\"}"}
                  </div>
                </div>
                <span className="text-xs font-code text-emerald-600 font-semibold">Captured</span>
              </div>

              {/* Connecting Indicator */}
              <div className="flex justify-center -my-1 text-outline-variant">
                <span className="material-symbols-outlined text-[18px]">south</span>
              </div>

              {/* Step 2: Intent Classification */}
              <div className="flex items-center gap-4 p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high">
                <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-code text-xs font-bold">
                  02
                </div>
                <div className="flex-grow">
                  <div className="text-xs font-semibold text-on-surface font-geist">
                    Heuristic & Semantic Classification
                  </div>
                  <div className="text-xs text-outline font-code">
                    Intent: &quot;learn&quot; | Category: &quot;AI Research&quot;
                  </div>
                </div>
                <span className="text-xs font-code text-emerald-600 font-semibold">32ms</span>
              </div>

              {/* Connecting Indicator */}
              <div className="flex justify-center -my-1 text-outline-variant">
                <span className="material-symbols-outlined text-[18px]">call_split</span>
              </div>

              {/* Step 3: Bi-directional Target Dispatch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-on-surface font-geist">
                    <span className="flex items-center gap-2">
                      <NotionLogo size={18} className="shrink-0" />
                      <span>Notion Database</span>
                    </span>
                    <span className="text-emerald-600 font-code font-semibold">Synced</span>
                  </div>
                  <p className="text-[11px] text-outline font-code">
                    Appends to &quot;Research Vault&quot; with summary block
                  </p>
                </div>

                <div className="p-3.5 bg-surface-container-low rounded-xl border border-surface-container-high space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-on-surface font-geist">
                    <span className="flex items-center gap-2">
                      <GoogleSheetsLogo size={18} className="shrink-0" />
                      <span>Google Sheets Table</span>
                    </span>
                    <span className="text-emerald-600 font-code font-semibold">Synced</span>
                  </div>
                  <p className="text-[11px] text-outline font-code">
                    Row: [Date, Title, ArXiv ID, Action_Status]
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Model Context Protocol (MCP) Highlight Card */}
          <div className="lg:col-span-5 bg-white text-on-surface rounded-[24px] border border-surface-container-high p-6 md:p-8 space-y-6 shadow-xs">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-code text-indigo-700 shadow-2xs">
              <ClaudeLogo size={16} className="shrink-0" />
              <span>Model Context Protocol (MCP) Active</span>
            </div>

            <div>
              <h3 className="font-geist text-xl font-semibold text-on-surface mb-2">
                Claude Desktop & Cursor Ready
              </h3>
              <p className="font-inter text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Connect Claude Desktop, Cursor, and custom agent swarms straight to your Save vault. Natural language queries can instantly interrogate, organize, and write to your bookmarks.
              </p>
            </div>

            {/* Light Terminal Code Viewport */}
            <div className="bg-surface-container-low p-4 rounded-xl border border-zinc-200 font-code text-xs space-y-1.5 shadow-2xs overflow-x-auto">
              <div className="text-zinc-500">// ~/.config/claude/claude_desktop_config.json</div>
              <div className="text-zinc-900 font-semibold">&#123;</div>
              <div className="text-zinc-700 pl-4">&quot;mcpServers&quot;: &#123;</div>
              <div className="text-zinc-700 pl-8">&quot;save-vault&quot;: &#123;</div>
              <div className="text-indigo-600 font-medium pl-12">&quot;command&quot;: &quot;npx&quot;,</div>
              <div className="text-indigo-600 font-medium pl-12">&quot;args&quot;: [&quot;-y&quot;, &quot;@save/mcp-server&quot;]</div>
              <div className="text-zinc-700 pl-8">&#125;</div>
              <div className="text-zinc-700 pl-4">&#125;</div>
              <div className="text-zinc-900 font-semibold">&#125;</div>
            </div>

            <div className="pt-2 text-xs text-on-surface-variant font-inter">
              Prompt example:{" "}
              <span className="text-on-surface italic font-medium">
                &quot;Find all research papers I saved last Tuesday with &apos;attention&apos; in the title and summarize their benchmark scores.&quot;
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
