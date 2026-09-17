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

export const SubstackIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" fill="#FF6719" />
  </svg>
);

export const ArxivIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#B31B1B" />
    <path d="M6 18L18 6M6 6l4.5 4.5M13.5 13.5L18 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const YCombinatorIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FF6600" />
    <path d="M7 6l4.5 8v5h2v-5l4.5-8h-2.2L12.5 12.5 9.2 6H7z" fill="#FFFFFF" />
  </svg>
);

export const MediumIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
  </svg>
);

export const StripeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#635BFF" />
    <path d="M13.976 9.15c0-.996-.81-1.38-2.146-1.38-1.91 0-4.327.585-6.222 1.62l-.65-4.04C7.03 4.415 9.774 4 12.19 4c4.618 0 7.828 2.227 7.828 6.463 0 6.29-8.665 5.286-8.665 8.006 0 1.173 1.026 1.554 2.473 1.554 2.188 0 4.966-.82 7.026-2.02l.654 4.04c-2.316 1.056-5.32 1.557-7.994 1.557C8.71 23.6 5.5 21.433 5.5 17.14c0-6.198 8.476-5.228 8.476-7.99z" fill="#FFFFFF" />
  </svg>
);

export const VercelIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L24 22H0L12 1Z" />
  </svg>
);

export const FigmaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 24c2.209 0 4-1.791 4-4v-4H8c-2.209 0-4 1.791-4 4s1.791 4 4 4z" fill="#0ACF83" />
    <path d="M4 12c0-2.209 1.791-4 4-4h4v8H8c-2.209 0-4-1.791-4-4z" fill="#A259FF" />
    <path d="M4 4c0-2.209 1.791-4 4-4h4v8H8C5.791 8 4 6.209 4 4z" fill="#F24E1E" />
    <path d="M12 0h4c2.209 0 4 1.791 4 4s-1.791 4-4 4h-4V0z" fill="#FF7262" />
    <path d="M20 12c0 2.209-1.791 4-4 4s-4-1.791-4-4 1.791-4 4-4 4 1.791 4 4z" fill="#1ABCFE" />
  </svg>
);

export const DockerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 3h3v3h-3V3zm-4 4h3v3H9V7zm4 0h3v3h-3V7zm4 0h3v3h-3V7zM5 11h3v3H5v-3zm4 0h3v3H9v-3zm4 0h3v3h-3v-3zm4 0h3v3h-3v-3z" fill="#2496ED" />
    <path d="M22.9 11.5c-.3-.2-1.3-.4-2.5.3-.4.2-.8.6-1.1.9-.3-.1-.8-.2-1.3-.2-.5 0-3.3.1-4.8 1.5-1.2-1.2-3.1-1-3.1-1-.8-.1-2.1.2-3.1 1.2-1.2.9-1.8 2.2-2.1 3.2-.8.3-2.1.9-2.9 2.4-.4.7-.6 1.5-.6 2.2 0 1.2.7 2 1.8 2H18c3.9 0 5.7-2.6 6-5.6.3-2.5-.5-5.5-1.1-6.9z" fill="#2496ED" />
  </svg>
);

export const ReactIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="2" fill="#61DAFB" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.2" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.2" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.2" transform="rotate(120 12 12)" />
  </svg>
);

export const PythonIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.91 2c-5.04 0-4.72 2.18-4.72 2.18l.01 2.26h4.78v.68H5.25S2 6.75 2 11.83c0 5.08 2.84 4.9 2.84 4.9h1.7v-2.38s-.09-2.84 2.79-2.84h4.78s2.69.04 2.69-2.6V4.6S16.95 2 11.91 2zm-2.58 1.45c.48 0 .86.39.86.87 0 .48-.38.87-.86.87a.87.87 0 0 1-.87-.87c0-.48.39-.87.87-.87z" fill="#387EB8" />
    <path d="M12.09 22c5.04 0 4.72-2.18 4.72-2.18l-.01-2.26h-4.78v-.68h6.73s3.25.37 3.25-4.71c0-5.08-2.84-4.9-2.84-4.9h-1.7v2.38s.09 2.84-2.79 2.84h-4.78s-2.69-.04-2.69 2.6v4.31S7.05 22 12.09 22zm2.58-1.45c-.48 0-.86-.39-.86-.87 0-.48.38-.87.86-.87.48 0 .87.39.87.87 0 .48-.39.87-.87.87z" fill="#FFE052" />
  </svg>
);

export const OpenAIIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.28 10.1a5.6 5.6 0 0 0-.48-4.66 5.75 5.75 0 0 0-4.88-2.9 5.86 5.86 0 0 0-1.7.25A5.63 5.63 0 0 0 10.9.5a5.75 5.75 0 0 0-5.5 3.98 5.76 5.76 0 0 0-4.04 2.94 5.67 5.67 0 0 0 .68 6.55 5.6 5.6 0 0 0 .48 4.66 5.75 5.75 0 0 0 4.88 2.9c.57 0 1.14-.08 1.7-.25a5.63 5.63 0 0 0 4.32 2.29 5.75 5.75 0 0 0 5.5-3.98 5.76 5.76 0 0 0 4.04-2.94 5.67 5.67 0 0 0-.68-6.55zM12 14.73a2.73 2.73 0 1 1 2.73-2.73 2.73 2.73 0 0 1-2.73 2.73zm-6.22-4.07a4.2 4.2 0 0 1 2.45-2.28l1.77 1.02a2.82 2.82 0 0 0-.5 1.54 2.7 2.7 0 0 0 .07.57l-1.95 1.13a4.23 4.23 0 0 1-1.84-1.98zm1.09 5.86a4.2 4.2 0 0 1-.6-3.3l1.78 1.03a2.8 2.8 0 0 0 1.08 1.12c.3.17.65.26 1 .26v2.05a4.24 4.24 0 0 1-3.26-1.16zm5.83 3.44a4.23 4.23 0 0 1-3.08-1.34v-2.06c.36.21.78.33 1.2.33a2.75 2.75 0 0 0 1.4-.38l1.77 1.02a4.2 4.2 0 0 1-1.29 2.43zm4.56-2.58a4.22 4.22 0 0 1-2.45 2.28l-1.77-1.02a2.82 2.82 0 0 0 .5-1.54 2.7 2.7 0 0 0-.07-.57l1.95-1.13a4.23 4.23 0 0 1 1.84 1.98zm-1.09-5.86a4.2 4.2 0 0 1 .6 3.3l-1.78-1.03a2.8 2.8 0 0 0-1.08-1.12 2.65 2.65 0 0 0-1-.26V6.49a4.24 4.24 0 0 1 3.26 1.16zm-5.83-3.44a4.23 4.23 0 0 1 3.08 1.34v2.06a2.72 2.72 0 0 0-2.6 0L9.06 8.94a4.2 4.2 0 0 1 1.29-2.43z" />
  </svg>
);


export const GoogleIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export const DiscordIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333-.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" fill="#5865F2"/>
  </svg>
);

export const WikipediaIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.09 2C6.52 2 2 6.52 2 12.09s4.52 10.09 10.09 10.09 10.09-4.52 10.09-10.09S17.66 2 12.09 2zm4.33 14.53l-1.35-3.32-1.37 3.32h-1.4l-1.74-4.83-1.64 4.83H7.5l2.42-6.57h1.44l1.63 4.41 1.48-4.41h1.44l2.49 6.57h-1.98z"/>
  </svg>
);

export const AnthropicIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="5" fill="#D97706" />
    <path d="M14.2 6.5l4.8 11.5h-2.5l-1-2.7h-4.8l-1 2.7H7.2l4.8-11.5h2.2zm-.8 2.5l-1.7 4.5h3.4l-1.7-4.5z" fill="#FFFFFF" />
  </svg>
);

export const HuggingFaceIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', style }) => (
  <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10.5" fill="#FFD21E" />
    <circle cx="8.5" cy="10" r="1.5" fill="#181818" />
    <circle cx="15.5" cy="10" r="1.5" fill="#181818" />
    <path d="M8 14.5c1.2 1.8 6.8 1.8 8 0" stroke="#181818" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// ─── Unified Dynamic Brand Icon Helper ───

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
  if (normalized.includes('google')) {
    return <GoogleIcon className={className} style={style} />;
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
  if (normalized.includes('twitter') || normalized === 'x' || normalized === 'x_twitter' || normalized === 'x.com') {
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
  if (normalized.includes('substack')) {
    return <SubstackIcon className={className} style={style} />;
  }
  if (normalized.includes('arxiv')) {
    return <ArxivIcon className={className} style={style} />;
  }
  if (normalized.includes('ycombinator') || normalized.includes('hacker news') || normalized === 'yc' || normalized.includes('news.ycombinator')) {
    return <YCombinatorIcon className={className} style={style} />;
  }
  if (normalized.includes('medium')) {
    return <MediumIcon className={className} style={style} />;
  }
  if (normalized.includes('stripe')) {
    return <StripeIcon className={className} style={style} />;
  }
  if (normalized.includes('vercel')) {
    return <VercelIcon className={className} style={style} />;
  }
  if (normalized.includes('figma')) {
    return <FigmaIcon className={className} style={style} />;
  }
  if (normalized.includes('docker')) {
    return <DockerIcon className={className} style={style} />;
  }
  if (normalized.includes('react')) {
    return <ReactIcon className={className} style={style} />;
  }
  if (normalized.includes('python')) {
    return <PythonIcon className={className} style={style} />;
  }
  if (normalized.includes('openai') || normalized.includes('chatgpt')) {
    return <OpenAIIcon className={className} style={style} />;
  }
  if (normalized.includes('anthropic') || normalized.includes('claude')) {
    return <AnthropicIcon className={className} style={style} />;
  }
  if (normalized.includes('huggingface') || normalized.includes('hf.co')) {
    return <HuggingFaceIcon className={className} style={style} />;
  }
  if (normalized.includes('discord')) {
    return <DiscordIcon className={className} style={style} />;
  }
  if (normalized.includes('wikipedia')) {
    return <WikipediaIcon className={className} style={style} />;
  }

  return <SaveVaultIcon className={className} style={style} />;
};

// ─── Real Website Favicon & Iconify Component with Auto Fallback ───

export const WebsiteIcon: React.FC<{
  name?: string;
  domain?: string;
  url?: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ name = '', domain = '', url = '', className = 'w-5 h-5', style }) => {
  const [useFallbackCdn, setUseFallbackCdn] = React.useState(false);
  const [imgFailed, setImgFailed] = React.useState(false);

  // Extract clean domain
  let d = (domain || name || '').toLowerCase().trim();
  if (url && (!d || d === 'vault' || !d.includes('.'))) {
    try {
      d = new URL(url).hostname.toLowerCase();
    } catch {}
  }
  d = d.replace(/^https?:\/\//, '').split('/')[0].split(':')[0].trim();
  if (d.startsWith('www.')) d = d.slice(4);

  // Check known vectors in BrandIcon first
  const knownTokens = [
    'github', 'arxiv', 'twitter', 'x.com', 'spotify', 'youtube', 'notion',
    'airtable', 'google', 'sheet', 'linkedin', 'reddit', 'substack', 'ycombinator',
    'yc', 'medium', 'stripe', 'vercel', 'figma', 'docker', 'react', 'python',
    'openai', 'chatgpt', 'anthropic', 'claude', 'huggingface', 'slack', 'linear',
    'coda', 'supabase', 'postgres', 'snowflake', 'hubspot', 'salesforce', 'discord',
    'wikipedia'
  ];

  const matchedToken = knownTokens.find((t) => d.includes(t) || name.toLowerCase().includes(t));
  if (matchedToken) {
    return <BrandIcon name={matchedToken} className={className} style={style} />;
  }

  // If real domain with a dot and not failed, load authentic 64px Google favicon or DuckDuckGo fallback
  if (d && d !== 'vault' && d.includes('.') && !imgFailed) {
    const src = useFallbackCdn
      ? `https://icons.duckduckgo.com/ip3/${d}.ico`
      : `https://www.google.com/s2/favicons?domain=${d}&sz=64`;

    return (
      <img
        src={src}
        alt={d}
        className={`${className} object-contain rounded shrink-0`}
        onError={() => {
          if (!useFallbackCdn) {
            setUseFallbackCdn(true);
          } else {
            setImgFailed(true);
          }
        }}
        loading="lazy"
        style={style}
      />
    );
  }

  return <BrandIcon name={d || name} className={className} style={style} />;
};

