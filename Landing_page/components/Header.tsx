"use client";

import React, { useEffect, useState } from "react";
import { APP_ROUTES } from "../lib/routes";

export default function Header() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md border-b border-surface-container-high transition-all">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand & Version Pill */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded bg-primary text-white flex items-center justify-center text-xs font-bold tracking-tighter shadow-sm transition-transform group-hover:scale-105">
              Y.
            </div>
            <span className="font-geist text-lg font-semibold tracking-tight text-on-surface">
              Yazem
            </span>
          </a>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-geist uppercase tracking-wider font-semibold bg-surface-container border border-surface-container-high text-on-surface-variant">
            v2.4 Live
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 font-geist text-xs font-medium">
          <a
            href="#intent"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Action Intents
          </a>
          <a
            href="#stack"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Connected Stack
          </a>
          <a
            href="#previews"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Native Fidelity
          </a>
          <a
            href="#platforms"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Platforms
          </a>
          <a
            href="#sync-mcp"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Sync & MCP
          </a>
          <a
            href="#pricing"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Pricing
          </a>
          <a
            href="#cta"
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            Extension
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <a
            href={APP_ROUTES.signIn}
            className="hidden sm:inline-block font-geist text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
          >
            Sign In
          </a>
          <a
            href={APP_ROUTES.signUp}
            className="inline-flex items-center justify-center h-9 px-5 rounded-full bg-primary text-white font-geist text-xs font-medium tracking-tight hover:bg-neutral-800 transition-all duration-150 active:scale-[0.98] shadow-sm"
          >
            Get Yazem Free
          </a>
        </div>
      </div>
      {/* Hairline Scroll Progress Indicator */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 transition-all duration-75" style={{ width: `${scrollProgress}%` }} />
    </header>
  );
}

