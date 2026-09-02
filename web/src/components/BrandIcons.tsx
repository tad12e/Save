import React from 'react';

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// ─── Destination Brand Icons (Iconify Official SVGs) ───

export const GoogleSheetsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" fill="#0F9D58" />
    <path d="M14 2v6h6L14 2z" fill="#87CEAC" />
    <rect x="7" y="11" width="10" height="8" rx="0.75" fill="#FFFFFF" />
    <path d="M7 13.5h10M7 16h10M10.5 11v8" stroke="#0F9D58" strokeWidth="1.1" strokeLinecap="round" />
  </svg>
);

export const NotionIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4.16 3.28c.44.38 1.1.38 1.87.38h11.94c.77 0 1.43 0 1.87-.38.46-.4.65-1.04.65-2.06H3.51c0 1.02.18 1.66.65 2.06zm-1.85 4.54v13.31c0 1 .81 1.82 1.81 1.82h15.76c1 0 1.82-.81 1.82-1.82V7.82H2.31zm6.81 3.52h2.25l3.75 5.9v-5.9h2.15v8.03h-2.25L11.26 13.47v5.9H9.12v-8.03z" fill="currentColor" />
  </svg>
);

export const AirtableIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.36 2.52a.85.85 0 0 1 .78 0l9.36 4.68a.85.85 0 0 1 0 1.52l-9.36 4.68a.85.85 0 0 1-.78 0L2 8.72a.85.85 0 0 1 0-1.52l9.36-4.68z" fill="#18BFFF" />
    <path d="M11.5 13.85v7.65a.5.5 0 0 1-.72.45L2.28 17.7a.5.5 0 0 1-.28-.45v-7.65l9.5 4.25z" fill="#F82B60" />
    <path d="M12.5 13.85l9.5-4.25v7.65a.5.5 0 0 1-.28.45l-8.5 4.25a.5.5 0 0 1-.72-.45v-7.65z" fill="#FCB400" />
  </svg>
);

export const SpotifyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    <path d="M16.5 16.2c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.2-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.5-.8 6.5-.4 9 1.1.4.2.5.6.4.8zm1.2-2.7c-.2.4-.7.5-1.1.2-2.5-1.5-6.3-2-9.3-1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-1 7.6-.5 10.6 1.3.4.2.5.7.3 1zm.1-2.8c-3-1.8-8-2-10.9-1.1-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.3-1 8.8-.8 12.3 1.3.4.3.6.8.3 1.2-.2.5-.8.6-1.2.3z" fill="#000000" />
  </svg>
);

export const YouTubeMusicIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#FF0000" />
    <circle cx="12" cy="12" r="6" stroke="#FFFFFF" strokeWidth="1.8" />
    <polygon points="10.5,9.5 15,12 10.5,14.5" fill="#FFFFFF" />
  </svg>
);

export const PostgreSQLIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.02 2C7.38 2 5.2 4.43 4.67 6.4c-.7 2.6.48 5.62 1.34 7.24.2.37.28.8.18 1.22l-.74 3.06c-.15.63.4 1.2 1 .98l2.94-1.07c.36-.13.75-.12 1.1.05.97.47 2.23.82 3.63.82 5.52 0 8.86-3.88 8.86-8.35C22.98 5.8 18.42 2 12.02 2z" fill="#336791" />
    <path d="M14.5 9.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5z" fill="#FFFFFF" />
  </svg>
);

export const SnowflakeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="#29B5E8" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 6l-2-2m4 0l-2 2m0 12l-2 2m4 0l-2-2M6 12l-2-2m0 4l2-2m12 0l2-2m0 4l-2-2" stroke="#29B5E8" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const HubSpotIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.5 7.5a2.5 2.5 0 0 0-2.3 1.52L10.5 6.7V4.5a2 2 0 1 0-2 0v2.2L4.8 9.02a2.5 2.5 0 1 0 1.25 1.73l3.45-2.07v6.64a2.5 2.5 0 1 0 2 0V11.2l4.2 2.52a2.5 2.5 0 1 0 1.8-6.22z" fill="#FF7A59" />
  </svg>
);

export const LinearIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 18.5L18.5 3.5M3 11.5L11.5 3M12.5 21L21 12.5" stroke="#5E6AD2" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const SlackIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 10.5A2.5 2.5 0 0 1 8 8h2.5v2.5a2.5 2.5 0 1 1-5 0z" fill="#E01E5A" />
    <path d="M3 13a2.5 2.5 0 0 1 2.5-2.5H8v5A2.5 2.5 0 0 1 3 13z" fill="#E01E5A" />
    <path d="M10.5 5.5A2.5 2.5 0 0 1 13 8v2.5h-2.5a2.5 2.5 0 1 1 0-5z" fill="#36C5F0" />
    <path d="M13 3a2.5 2.5 0 0 1 2.5 2.5V8h-5A2.5 2.5 0 0 1 13 3z" fill="#36C5F0" />
    <path d="M18.5 13.5A2.5 2.5 0 0 1 16 16h-2.5v-2.5a2.5 2.5 0 1 1 5 0z" fill="#2EB67D" />
    <path d="M21 11a2.5 2.5 0 0 1-2.5 2.5H16v-5A2.5 2.5 0 0 1 21 11z" fill="#2EB67D" />
    <path d="M13.5 18.5A2.5 2.5 0 0 1 11 16v-2.5h2.5a2.5 2.5 0 1 1 0 5z" fill="#ECB22E" />
    <path d="M11 21a2.5 2.5 0 0 1-2.5-2.5V16h5a2.5 2.5 0 0 1 0 5z" fill="#ECB22E" />
  </svg>
);

export const SupabaseIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 2L3 14.5h8.5L10.5 22 21 9.5h-8.5L13.5 2z" fill="#3ECF8E" />
  </svg>
);

export const SalesforceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 7.5a4.5 4.5 0 0 1 8.2-1.5A5.5 5.5 0 0 1 22 11.5a5 5 0 0 1-5 5H7a5 5 0 0 1-4.9-4 4.5 4.5 0 0 1 7.4-5z" fill="#00A1E0" />
  </svg>
);

export const CodaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" fill="#F45A47" />
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" fill="#FFFFFF" />
  </svg>
);

export const SaveVaultIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" fill="#7c3aed" stroke="#c084fc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WebhookIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c0-2.21 1.79-4 4-4h1" />
    <path d="M6 13V7a4 4 0 0 1 7.5-2" />
    <circle cx="18" cy="17" r="3" fill="#6366f1" stroke="#818cf8" />
    <circle cx="6" cy="17" r="3" fill="#6366f1" stroke="#818cf8" />
    <circle cx="14" cy="5" r="3" fill="#6366f1" stroke="#818cf8" />
  </svg>
);

// ─── Social / Source Platform Icons (Iconify Official SVGs) ───

export const XTwitterIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const LinkedInIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2" />
    <path d="M7.05 19H4.15V9.45h2.9V19zM5.6 8.15a1.68 1.68 0 1 1 0-3.36 1.68 1.68 0 0 1 0 3.36zm14.4 10.85h-2.9v-4.7c0-1.12-.02-2.56-1.56-2.56-1.56 0-1.8 1.22-1.8 2.48V19h-2.9V9.45h2.78v1.3h.04c.39-.74 1.34-1.52 2.76-1.52 2.95 0 3.5 1.94 3.5 4.47V19z" fill="#FFFFFF" />
  </svg>
);

export const TikTokIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.34 0 .67.06.98.17v-3.52a6.38 6.38 0 0 0-.98-.08 6.34 6.34 0 0 0-6.34 6.31 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.05a8.28 8.28 0 0 0 5.11 1.77V7.37a4.85 4.85 0 0 1-1.35-.68z" fill="#FFFFFF" />
  </svg>
);

export const InstagramIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="6" fill="url(#ig-grad-web)" />
    <defs>
      <radialGradient id="ig-grad-web" cx="20%" cy="100%" r="120%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="10%" stopColor="#fdf497" />
        <stop offset="50%" stopColor="#fd5949" />
        <stop offset="70%" stopColor="#d6249f" />
        <stop offset="100%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect x="5" y="5" width="14" height="14" rx="4" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.5" stroke="#FFFFFF" strokeWidth="1.8" />
    <circle cx="15.8" cy="8.2" r="0.9" fill="#FFFFFF" />
  </svg>
);

export const YouTubeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#FF0000" />
    <polygon points="10,7.5 16,12 10,16.5" fill="#FFFFFF" />
  </svg>
);

export const RedditIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#FF4500" />
    <circle cx="9" cy="12" r="1.5" fill="#FFFFFF" />
    <circle cx="15" cy="12" r="1.5" fill="#FFFFFF" />
    <path d="M9 15c.9 1 2.1 1.3 3 1.3s2.1-.3 3-1.3" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const GitHubIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

// ─── Unified Dynamic Icon Helper ───

export const BrandIcon: React.FC<{ name: string; className?: string; style?: React.CSSProperties }> = ({
  name,
  className = 'w-5 h-5',
  style,
}) => {
  const normalized = (name || '').toLowerCase().trim();

  // Exact service & catalog ID matching
  if (normalized.includes('gsheet') || normalized.includes('google_sheet') || normalized.includes('google sheets') || normalized === 'sheets') {
    return <GoogleSheetsIcon className={className} style={style} />;
  }
  if (normalized.includes('notion')) {
    return <NotionIcon className={className} style={style} />;
  }
  if (normalized.includes('airtable')) {
    return <AirtableIcon className={className} style={style} />;
  }
  if (normalized.includes('spotify')) {
    return <SpotifyIcon className={className} style={style} />;
  }
  if (normalized.includes('youtube_music') || normalized.includes('youtube music')) {
    return <YouTubeMusicIcon className={className} style={style} />;
  }
  if (normalized.includes('postgres') || normalized.includes('pgsql')) {
    return <PostgreSQLIcon className={className} style={style} />;
  }
  if (normalized.includes('snowflake')) {
    return <SnowflakeIcon className={className} style={style} />;
  }
  if (normalized.includes('hubspot')) {
    return <HubSpotIcon className={className} style={style} />;
  }
  if (normalized.includes('salesforce')) {
    return <SalesforceIcon className={className} style={style} />;
  }
  if (normalized.includes('linear')) {
    return <LinearIcon className={className} style={style} />;
  }
  if (normalized.includes('slack')) {
    return <SlackIcon className={className} style={style} />;
  }
  if (normalized.includes('supabase')) {
    return <SupabaseIcon className={className} style={style} />;
  }
  if (normalized.includes('coda')) {
    return <CodaIcon className={className} style={style} />;
  }
  if (normalized.includes('webhook') || normalized.includes('zapier') || normalized.includes('make')) {
    return <WebhookIcon className={className} style={style} />;
  }
  if (normalized.includes('twitter') || normalized === 'x' || normalized === 'x_twitter') {
    return <XTwitterIcon className={className} style={style} />;
  }
  if (normalized.includes('linkedin')) {
    return <LinkedInIcon className={className} style={style} />;
  }
  if (normalized.includes('tiktok')) {
    return <TikTokIcon className={className} style={style} />;
  }
  if (normalized.includes('instagram')) {
    return <InstagramIcon className={className} style={style} />;
  }
  if (normalized.includes('youtube')) {
    return <YouTubeIcon className={className} style={style} />;
  }
  if (normalized.includes('reddit')) {
    return <RedditIcon className={className} style={style} />;
  }
  if (normalized.includes('github')) {
    return <GitHubIcon className={className} style={style} />;
  }

  return <SaveVaultIcon className={className} style={style} />;
};
