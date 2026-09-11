import React from 'react';

export interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

// ─── Destination Brand Icons (Iconify Official SVGs) ───

export const GoogleSheetsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#188038" d="M442.2 128L314.2 0v128z" />
    <path fill="#34A853" d="M314.2 128V0H104.7C85.4 0 69.8 15.6 69.8 34.9v442.2c0 19.3 15.6 34.9 34.9 34.9h302.5c19.3 0 34.9-15.6 34.9-34.9V128z" />
    <path fill="#FFFFFF" d="M139.6 197.8v168.7h232.7V197.8zm101.9 139.7h-72.7v-40.7h72.7zm0-69.9h-72.7v-40.7h72.7zm101.8 69.9h-72.7v-40.7h72.7zm0-69.9h-72.7v-40.7h72.7z" />
  </svg>
);

export const StitchSheetsIcon: React.FC<IconProps> = (props) => <GoogleSheetsIcon {...props} />;

export const NotionIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 256 268" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFFFFF" d="M16.092 11.538L164.09.608c18.179-1.56 22.85-.508 34.28 7.801l47.243 33.282C253.406 47.414 256 48.975 256 55.207v182.527c0 11.439-4.155 18.205-18.696 19.24L65.44 267.378c-10.913.517-16.11-1.043-21.825-8.327L8.826 213.814C2.586 205.487 0 199.254 0 191.97V29.726c0-9.352 4.155-17.153 16.092-18.188" />
    <path d="M164.09.608L16.092 11.538C4.155 12.573 0 20.374 0 29.726v162.245c0 7.284 2.585 13.516 8.826 21.843l34.789 45.237c5.715 7.284 10.912 8.844 21.825 8.327l171.864-10.404c14.532-1.035 18.696-7.801 18.696-19.24V55.207c0-5.911-2.336-7.614-9.21-12.66l-1.185-.856L198.37 8.409C186.94.1 182.27-.952 164.09.608M69.327 52.22c-14.033.945-17.216 1.159-25.186-5.323L23.876 30.778c-2.06-2.086-1.026-4.69 4.163-5.207l142.274-10.395c11.947-1.043 18.17 3.12 22.842 6.758l24.401 17.68c1.043.525 3.638 3.637.517 3.637L71.146 52.095zm-16.36 183.954V81.222c0-6.767 2.077-9.887 8.3-10.413L230.02 60.93c5.724-.517 8.31 3.12 8.31 9.879v153.917c0 6.767-1.044 12.49-10.387 13.008l-161.487 9.361c-9.343.517-13.489-2.594-13.489-10.921M212.377 89.53c1.034 4.681 0 9.362-4.681 9.897l-7.783 1.542v114.404c-6.758 3.637-12.981 5.715-18.18 5.715c-8.308 0-10.386-2.604-16.609-10.396l-50.898-80.079v77.476l16.1 3.646s0 9.362-12.989 9.362l-35.814 2.077c-1.043-2.086 0-7.284 3.63-8.318l9.351-2.595V109.823l-12.98-1.052c-1.044-4.68 1.55-11.439 8.826-11.965l38.426-2.585l52.958 81.113v-71.76l-13.498-1.552c-1.043-5.733 3.111-9.896 8.3-10.404z" fill="#000000" />
  </svg>
);

export const AirtableIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 256 215" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="#FFBF00" d="M114.259 2.701L18.86 42.176c-5.305 2.195-5.25 9.73.089 11.847l95.797 37.989a35.54 35.54 0 0 0 26.208 0l95.799-37.99c5.337-2.115 5.393-9.65.086-11.846L141.442 2.7a35.55 35.55 0 0 0-27.183 0" />
    <path fill="#26B5F8" d="M136.35 112.757v94.902c0 4.514 4.55 7.605 8.746 5.942l106.748-41.435a6.39 6.39 0 0 0 4.035-5.941V71.322c0-4.514-4.551-7.604-8.747-5.941l-106.748 41.434a6.39 6.39 0 0 0-4.035 5.942" />
    <path fill="#ED3049" d="m111.423 117.654l-31.68 15.296l-3.217 1.555L9.65 166.548C5.411 168.593 0 165.504 0 160.795V71.72c0-1.704.874-3.175 2.046-4.283a7.3 7.3 0 0 1 1.618-1.213c1.598-.959 3.878-1.215 5.816-.448l101.41 40.18c5.155 2.045 5.56 9.268.533 11.697" />
    <path fill="#000000" fillOpacity=".22" d="m111.423 117.654l-31.68 15.296L2.045 67.438a7.3 7.3 0 0 1 1.618-1.213c1.598-.959 3.878-1.215 5.816-.448l101.41 40.18c5.155 2.045 5.56 9.268.533 11.697" />
  </svg>
);

export const StitchAirtableIcon: React.FC<IconProps> = (props) => <AirtableIcon {...props} />;

export const SpotifyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    <path d="M16.5 16.2c-.2.3-.5.4-.8.2-2.2-1.3-4.9-1.6-8.2-.9-.3.1-.7-.1-.8-.4-.1-.3.1-.7.4-.8 3.5-.8 6.5-.4 9 1.1.4.2.5.6.4.8zm1.2-2.7c-.2.4-.7.5-1.1.2-2.5-1.5-6.3-2-9.3-1-.4.1-.9-.1-1-.5-.1-.4.1-.9.5-1 3.4-1 7.6-.5 10.6 1.3.4.2.5.7.3 1zm.1-2.8c-3-1.8-8-2-10.9-1.1-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 3.3-1 8.8-.8 12.3 1.3.4.3.6.8.3 1.2-.2.5-.8.6-1.2.3z" fill="#000000" />
  </svg>
);

export const StitchSpotifyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.563.387-.857.207-2.35-1.435-5.308-1.76-8.793-.963-.335.077-.67-.133-.746-.468-.077-.334.132-.67.467-.746 3.808-.87 7.076-.496 9.722 1.115.294.18.386.562.207.855zm1.226-2.723c-.226.367-.706.482-1.072.256-2.687-1.652-6.785-2.131-9.965-1.166-.413.127-.848-.106-.973-.519-.126-.413.107-.849.52-9.74 3.632-1.102 8.147-.568 11.234 1.33.366.225.48.706.256 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71c-.493.15-1.016-.128-1.166-.62-.149-.494.13-1.017.622-1.168 3.532-1.073 9.404-.866 13.115 1.337.445.264.59.838.327 1.282-.264.444-.838.59-1.282.327z" />
  </svg>
);

export const YouTubeMusicIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="11" fill="#FF0000" />
    <circle cx="12" cy="12" r="6" stroke="#FFFFFF" strokeWidth="1.8" />
    <polygon points="10.5,9.5 15,12 10.5,14.5" fill="#FFFFFF" />
  </svg>
);

export const StitchYouTubeMusicIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm-2-3l5 3-5 3V8z" />
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
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 21q-2.075 0-3.537-1.463T2 16q0-1.825 1.138-3.187T6 11.1v2.075q-.875.3-1.437 1.075T4 16q0 1.25.875 2.125T7 19t2.125-.875T10 16v-1h5.875q.2-.225.488-.363T17 14.5q.625 0 1.063.438T18.5 16t-.437 1.063T17 17.5q-.35 0-.638-.137T15.876 17H11.9q-.35 1.725-1.713 2.863T7 21m10 0q-1.4 0-2.537-.687T12.675 18.5h2.675q.35.25.775.375T17 19q1.25 0 2.125-.875T20 16t-.875-2.125T17 13q-.5 0-.925.138t-.8.412l-3.05-5.075q-.525-.1-.875-.5T11 7q0-.625.438-1.062T12.5 5.5t1.063.438T14 7v.213q0 .087-.05.212l2.175 3.65q.2-.05.425-.062T17 11q2.075 0 3.538 1.463T22 16t-1.463 3.538T17 21M7 17.5q-.625 0-1.062-.437T5.5 16q0-.55.35-.95t.85-.525l2.35-3.9q-.725-.675-1.138-1.612T7.5 7q0-2.075 1.463-3.537T12.5 2t3.538 1.463T17.5 7h-2q0-1.25-.875-2.125T12.5 4t-2.125.875T9.5 7q0 1.075.65 1.888t1.65 1.037L8.425 15.55q.05.125.063.225T8.5 16q0 .625-.437 1.063T7 17.5" />
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
