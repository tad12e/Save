// Color tokens aligned with the mobile Green & White theme palette

export const APP_THEME = {
  primaryGreen: '#2D6A4F',      // Deep Forest Green
  primaryGreenLight: '#40916C', // Vibrant Forest Green
  primaryGreenMint: '#DCFCE7',  // Soft Mint Tint
  primaryGreenBg: '#F0FDF4',    // Light Green container fill
  emerald: '#10B981',           // Accent Emerald
  emeraldDark: '#059669',
  
  // Neutral Surfaces (Crisp White & Light Slate)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceCard: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  
  // Borders
  borderSubtle: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Accents
  amber: '#D97706',
  amberBg: '#FEF3C7',
  rose: '#E11D48',
  roseBg: '#FFE4E6',
  blue: '#2563EB',
  blueBg: '#DBEAFE',
  purple: '#7C3AED',
  purpleBg: '#EDE9FE',
};

// Stitch-exact light theme (Save Knowledge Vault Dashboard)
export const STITCH_LIGHT = {
  canvas: '#F8FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  primary: '#2D6A4F',
  primaryHover: '#245640',
  mintBg: '#DCFCE7',
  mintText: '#166534',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  statusOrange: '#EA580C',
  accentPurple: '#A855F7',
};

// Vercel Geist-exact dark theme (fully neutral, green data-only)
export const VERCEL_DARK = {
  canvas: '#000000',
  surface: '#0A0A0A',
  raised: '#111111',
  hairline: '#333333',
  borderSoft: '#262626',
  gridLine: '#1F1F1F',
  ink: '#EDEDED',
  body: '#A1A1A1',
  muted: '#878787',
  inverse: '#FFFFFF',
  onInverse: '#000000',
  greenData: '#00CA50',
  greenDataBright: '#00AC3A',
  greenFillSoft: '#002608',
  greenTextOnDark: '#D8FFE4',
};

export const CHART_COLORS = {
  primary: '#2D6A4F',
  secondary: '#40916C',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  blue: '#3B82F6',
  pink: '#EC4899',
  orange: '#F97316',
  teal: '#14B8A6',
  purple: '#8B5CF6',
};

export const TYPE_COLORS: Record<string, string> = {
  job: '#10B981',        // Emerald green
  article: '#3B82F6',    // Sky blue
  event: '#8B5CF6',      // Purple
  tool: '#F97316',       // Orange
  music: '#EC4899',      // Pink
  product: '#F59E0B',    // Amber
  research: '#14B8A6',   // Teal
  course: '#F43F5E',     // Rose
  other: '#64748B',      // Slate
};

export const HEATMAP_GREEN_SCALE = [
  '#E2E8F0', // 0 clips (empty slate)
  '#BBF7D0', // 1-2 clips (green-200)
  '#86EFAC', // 3-5 clips (green-300)
  '#22C55E', // 6-9 clips (green-500)
  '#15803D', // 10+ clips (green-700)
];
