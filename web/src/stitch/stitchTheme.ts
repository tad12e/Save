// Stitch-exact theme helpers for the UI-only pages under src/stitch/.
// Light = Save Knowledge Vault Stitch theme. Dark = Vercel Geist dark.
// These pages never fetch — all data arrives via props.

export type StitchTheme = 'light' | 'dark' | 'terminal';

type ThemeInput = StitchTheme | string;

export function isStitchDark(theme: ThemeInput = 'light'): boolean {
  return theme === 'dark' || theme === 'terminal';
}

export function stitchCanvas(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme)
    ? 'bg-[#000000] text-[#EDEDED]'
    : 'bg-[#F8FAFC] text-[#0F172A]';
}

export function stitchCard(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme)
    ? 'bg-[#0A0A0A] border-[#262626]'
    : 'bg-white border-[#E2E8F0]';
}

export function stitchInner(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme)
    ? 'bg-[#111111] border-[#262626]'
    : 'bg-[#F8FAFC] border-[#E2E8F0]';
}

export function stitchHeading(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme) ? 'text-[#EDEDED]' : 'text-[#0F172A]';
}

export function stitchSecondary(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme) ? 'text-[#A1A1A1]' : 'text-[#475569]';
}

export function stitchMuted(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme) ? 'text-[#878787]' : 'text-[#64748B]';
}

export function stitchPrimaryButton(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme)
    ? 'bg-[#EDEDED] hover:bg-white text-black'
    : 'bg-[#2D6A4F] hover:bg-[#245640] text-white';
}

// Mint opportunity badge — light only; dark uses neutral pill + green data text.
export function stitchMintBadge(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme)
    ? 'bg-[#111111] text-[#00CA50] border border-[#262626]'
    : 'bg-[#DCFCE7] text-[#166534]';
}

export function stitchMetaChip(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme)
    ? 'bg-[#111111] text-[#A1A1A1] border border-[#262626]'
    : 'bg-[#F1F5F9] text-[#475569]';
}

// Green reserved for data (graphs, values, status dots) — never chrome.
export function stitchGreenData(theme: ThemeInput = 'light'): string {
  return isStitchDark(theme) ? 'text-[#00CA50]' : 'text-[#166534]';
}
