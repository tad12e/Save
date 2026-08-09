// ────────────────────────────────────────────────────────────────
// OLD CONTENT SCRIPT — DISABLED
// ────────────────────────────────────────────────────────────────
// This file previously contained the draggable/resizable panel widget.
// It has been replaced by:
//   - floatingButton.content.tsx  (28px floating icon on all pages)
//   - feedDetector.content.ts     (per-post micro icons on social feeds)
//
// To restore the old behavior, rename content.old.tsx back to content.tsx
// and remove or rename floatingButton.content.tsx and feedDetector.content.ts.
//
// The original 1200-line source has been moved to content.old.tsx.
// ────────────────────────────────────────────────────────────────

import { defineContentScript } from 'wxt/utils/define-content-script';

// No-op content script — WXT will register it but it does nothing.
export default defineContentScript({
  matches: ['*://this-should-never-match.example.com/*'],
  main() {
    // Intentionally empty — this file is disabled.
  },
});