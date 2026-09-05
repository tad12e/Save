// UI-only Stitch pages — Dashboard, Connections, Analytics.
// Props-driven, no fetching, no store. Mount them wherever needed
// (e.g. preview route) without touching existing pages.
export { StitchDashboard } from './StitchDashboard';
export type { StitchDeadline, StitchIntentSlice } from './StitchDashboard';
export { StitchConnections } from './StitchConnections';
export { StitchAnalytics } from './StitchAnalytics';
export { StitchCard, StitchSectionLabel } from './StitchCard';
export {
  stitchCanvas,
  stitchCard,
  stitchInner,
  stitchHeading,
  stitchSecondary,
  stitchMuted,
  stitchPrimaryButton,
  stitchMintBadge,
  stitchMetaChip,
  stitchGreenData,
  isStitchDark,
} from './stitchTheme';
export type { StitchTheme } from './stitchTheme';
