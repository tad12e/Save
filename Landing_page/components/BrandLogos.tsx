import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

// 1. Reddit (Official Snoo orange circle & face)
export function RedditLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="#FF4500" />
      {/* Snoo antenna */}
      <path
        d="M17.8 7.3a1.1 1.1 0 1 0-1.8.8l-1.9.4.8 3.5a7.8 7.8 0 0 1 1.8-.4 1.1 1.1 0 1 0 1.1-1.3l-.2-.5 1.5-.3a1.1 1.1 0 0 0-.2-.2z"
        fill="#FFFFFF"
      />
      {/* Snoo head */}
      <ellipse cx="12" cy="14.5" rx="5.4" ry="3.8" fill="#FFFFFF" />
      {/* Left ear */}
      <circle cx="6.6" cy="13.6" r="1.5" fill="#FFFFFF" />
      {/* Right ear */}
      <circle cx="17.4" cy="13.6" r="1.5" fill="#FFFFFF" />
      {/* Left eye */}
      <circle cx="9.8" cy="14.3" r="1.1" fill="#FF4500" />
      {/* Right eye */}
      <circle cx="14.2" cy="14.3" r="1.1" fill="#FF4500" />
      {/* Smile */}
      <path
        d="M9.8 16.3c.7.6 1.4.9 2.2.9s1.5-.3 2.2-.9"
        stroke="#FF4500"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 2. Google Sheets (Official Sheets Green Table)
export function GoogleSheetsLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4" fill="#0F9D58" />
      {/* White table grid */}
      <rect x="5.5" y="6" width="13" height="12" rx="1.5" fill="#FFFFFF" />
      <rect x="7" y="8" width="4.5" height="3" fill="#0F9D58" />
      <rect x="12.5" y="8" width="4.5" height="3" fill="#0F9D58" />
      <rect x="7" y="12" width="4.5" height="4" fill="#0F9D58" />
      <rect x="12.5" y="12" width="4.5" height="4" fill="#0F9D58" />
    </svg>
  );
}

// 3. Notion (Official Notion "N" icon)
export function NotionLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4.5" fill="#000000" />
      <path
        d="M6.2 6.5C6.7 6.9 6.9 7 7.7 7.1L16 7.8C16.8 7.9 17.1 7.6 17.5 7.1L18.4 6C18.6 5.8 18.8 6 18.7 6.3L17.7 18.2C17.6 19 17.1 19.5 16.2 19.4L7.5 18.6C6.7 18.5 6.6 18.1 6.6 17.4L6.8 7.2C6.8 6.6 6.5 6.4 5.9 5.9L5.3 5.4C5.1 5.3 5.3 5 5.5 5.1L7 6C7.3 6.2 7.4 6.3 7.7 6.4L16.2 7.1C16.5 7.1 16.6 7 16.8 6.7L17.3 6"
        fill="#FFFFFF"
        opacity="0.1"
      />
      <path
        d="M7 6.8c.4.3.9.4 1.4.4l8.3.6c.5 0 .8-.2 1.1-.6l.7-.8c.2-.2.4 0 .3.3l-1 12c-.1.7-.5 1.1-1.3 1L8 18.9c-.7-.1-.9-.5-.9-1.1l.2-9.7c0-.5-.3-.7-.8-1.1l-.5-.4c-.2-.1 0-.4.2-.3l1.8.5z"
        fill="#FFFFFF"
      />
      <path
        d="M8.8 8.6l7.8.6c.2 0 .4.2.4.5l-.8 9.2c0 .3-.3.5-.6.5l-7.7-.6c-.3 0-.5-.3-.5-.6l.9-9.1c0-.3.2-.5.5-.5z"
        fill="#000000"
      />
      <path
        d="M10.1 10.1h1.5v6.5h-1.5zM14.5 10.4h1.4v6.5h-1.4z"
        fill="#FFFFFF"
      />
      <path
        d="M10.2 10.2l4.8 5.4h.8v-.6l-4.7-5.4h-.9z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 4. Airtable (Official Airtable colored triad icon)
export function AirtableLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M11.4 3.2L3.6 7.4c-.6.3-.6 1.2 0 1.5l7.8 4.2c.4.2.9.2 1.3 0l7.8-4.2c.6-.3.6-1.2 0-1.5l-7.8-4.2a1.5 1.5 0 0 0-1.3 0z"
        fill="#FCB400"
      />
      <path
        d="M12.7 13.9v7.9c0 .6.6 1 1.1.7l7.2-4.1c.4-.2.7-.7.7-1.2V9.3c0-.6-.6-1-1.1-.7l-7.2 4.1c-.4.3-.7.7-.7 1.2z"
        fill="#18BFFF"
      />
      <path
        d="M11.3 14l-7.2-4.1c-.5-.3-1.1.1-1.1.7v7.9c0 .5.3 1 .7 1.2l7.2 4.1c.5.3 1.1-.1 1.1-.7v-7.9c0-.5-.3-1-.7-1.2z"
        fill="#F82B60"
      />
    </svg>
  );
}

// 5. Spotify (Official Spotify green & 3 black soundwaves)
export function SpotifyLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="12" fill="#1ED760" />
      <path
        d="M16.8 17.1c-.2 0-.4-.1-.5-.2-2.3-1.4-5.2-1.7-8.6-1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 3.7-.8 7-.5 9.6 1.1.3.2.4.6.2.9-.1.3-.3.5-.4.5zm1.3-2.8c-.2 0-.5-.1-.6-.2-2.7-1.7-6.9-2.2-10.1-1.2-.4.1-.9-.1-1-.5s.1-.9.5-1c3.7-1.1 8.3-.6 11.4 1.4.4.2.5.7.3 1.1-.1.3-.3.4-.5.4zm.1-3C15 9.3 9.7 9.1 6.6 10.1c-.5.2-1.1-.1-1.2-.6-.2-.5.1-1.1.6-1.2 3.6-1.1 9.4-.9 13 1.2.5.3.6.9.3 1.4-.2.3-.5.4-.7.4z"
        fill="#000000"
      />
    </svg>
  );
}

// 6. YouTube (Official YouTube Red Button with White Triangle)
export function YouTubeLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="5" fill="#FF0000" />
      <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="#FFFFFF" />
    </svg>
  );
}

// 7. GitHub (Official Octocat silhouette)
export function GitHubLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        fill="#181717"
      />
    </svg>
  );
}

// 8. X / Twitter (Official X mathematical double-struck glyph)
export function XLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4.5" fill="#000000" />
      <path
        d="M17.1 5.5H19.2L14.6 10.7L20 17.9H15.8L12.5 13.5L8.7 17.9H6.6L11.5 12.3L6.4 5.5H10.7L13.7 9.5L17.1 5.5ZM16.3 16.6H17.5L10.1 6.8H8.8L16.3 16.6Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 9. Raycast (Official Angular Monogram)
export function RaycastLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="5" fill="#FF6363" />
      <path
        d="M16.5 8L12 12.5L14.5 15L19 10.5L16.5 8Z"
        fill="#FFFFFF"
      />
      <path
        d="M7.5 16L12 11.5L9.5 9L5 13.5L7.5 16Z"
        fill="#FFFFFF"
      />
      <circle cx="12" cy="12" r="1.8" fill="#FFFFFF" />
    </svg>
  );
}

// 10. Claude / Anthropic (Official Asterisk / Burst Logo)
export function ClaudeLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="5" fill="#CC785C" />
      <path
        d="M12 4.5V19.5M4.5 12H19.5M6.7 6.7L17.3 17.3M17.3 6.7L6.7 17.3"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 11. Slack (Official 4-color Hash logo)
export function SlackLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 10a2 2 0 1 1-2-2h2v2zm1 0a2 2 0 1 1 2 2H7v-2zm3-4a2 2 0 1 1 2-2v2h-2zm0 1a2 2 0 1 1-2 2V7h2zm4 3a2 2 0 1 1 2 2h-2v-2zm-1 0a2 2 0 1 1-2-2h2v2zm-3 4a2 2 0 1 1-2 2v-2h2zm0-1a2 2 0 1 1 2-2v2h-2z"
        fill="#E01E5A"
      />
      <path d="M5.5 10.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zm0 1.5h3.6v3.6a1.8 1.8 0 1 1-3.6 0v-3.6z" fill="#36C5F0" />
      <path d="M10.5 5.5a1.8 1.8 0 1 1 3.6 0 1.8 1.8 0 0 1-3.6 0zm1.5 0v3.6H8.4a1.8 1.8 0 1 1 0-3.6h3.6z" fill="#2EB67D" />
      <path d="M18.5 10.5a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zm0-1.5h-3.6V5.4a1.8 1.8 0 1 1 3.6 0V9z" fill="#ECB22E" />
      <path d="M13.5 18.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0zm-1.5 0v-3.6h3.6a1.8 1.8 0 1 1 0 3.6H12z" fill="#E01E5A" />
    </svg>
  );
}

// 12. Stripe (Official Stripe Purple "S")
export function StripeLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4.5" fill="#635BFF" />
      <path
        d="M13.9 10.4c0-.7-.6-1.1-1.6-1.1-1.3 0-2.4.4-3.3.9l-.6-1.9c1-.5 2.4-.8 3.9-.8 2.6 0 4.2 1.3 4.2 3.5 0 3.4-4.7 2.9-4.7 4.3 0 .8.7 1.1 1.7 1.1 1.4 0 2.8-.5 3.7-1l.6 1.9c-1.1.6-2.7 1-4.3 1-2.6 0-4.4-1.3-4.4-3.5 0-3.6 4.8-3 4.8-4.4z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 13. Google Chrome (Official 4-color Chrome circle)
export function ChromeLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" fill="#FFFFFF" />
      <path d="M12 2A10 10 0 0 0 3.3 7.5L8.5 16.5A5 5 0 0 1 7 12a5 5 0 0 1 5-5h8.6A10 10 0 0 0 12 2z" fill="#EA4335" />
      <path d="M20.6 7A10 10 0 0 1 17 21.2l-5.2-9a5 5 0 0 1 2.5-4.3 5 5 0 0 1 4.7-.2L20.6 7z" fill="#FBBC05" />
      <path d="M17 21.2A10 10 0 0 1 3.3 7.5L8.5 16.5a5 5 0 0 0 4.3 2.5 5 5 0 0 0 4.2-2.3L17 21.2z" fill="#34A853" />
      <circle cx="12" cy="12" r="4.2" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="3.4" fill="#4285F4" />
    </svg>
  );
}

// 14. Safari (Official Apple Safari Compass)
export function SafariLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="11" fill="#007AFF" />
      <circle cx="12" cy="12" r="9.5" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.6" />
      {/* Compass Needle */}
      <polygon points="12,4 14.5,12 12,12" fill="#FF3B30" />
      <polygon points="12,20 9.5,12 12,12" fill="#FFFFFF" />
      <polygon points="12,4 9.5,12 12,12" fill="#FF3B30" opacity="0.8" />
      <polygon points="12,20 14.5,12 12,12" fill="#FFFFFF" opacity="0.8" />
      <circle cx="12" cy="12" r="1" fill="#FFFFFF" />
    </svg>
  );
}

// 15. Figma (Official 5-color Figma logo)
export function FigmaLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Top Left: Red */}
      <path d="M8 2h4v4H8a2 2 0 1 1 0-4z" fill="#F24E1E" />
      {/* Top Right: Orange */}
      <path d="M12 2h4a2 2 0 1 1 0 4h-4V2z" fill="#FF7262" />
      {/* Middle Left: Violet */}
      <path d="M8 6h4v4H8a2 2 0 1 1 0-4z" fill="#A259FF" />
      {/* Middle Right: Cyan */}
      <circle cx="14" cy="8" r="2" fill="#1ABCFE" />
      {/* Bottom: Green */}
      <path d="M8 10h4v2a2 2 0 1 1-4 0v-2z" fill="#0ACF83" />
    </svg>
  );
}

// 16. Substack (Official Orange Substack logo)
export function SubstackLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4.5" fill="#FF6719" />
      {/* Top bar */}
      <rect x="5.5" y="5.5" width="13" height="2" rx="0.5" fill="#FFFFFF" />
      {/* Middle bar */}
      <rect x="5.5" y="9.5" width="13" height="2" rx="0.5" fill="#FFFFFF" />
      {/* Bottom Bookmark ribbon */}
      <path
        d="M5.5 13.5v5.5l6.5-3.5 6.5 3.5v-5.5H5.5z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 17. Zoom (Official Zoom Blue Camera)
export function ZoomLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="5" fill="#2D8CFF" />
      <rect x="5.5" y="8" width="8.5" height="8" rx="1.5" fill="#FFFFFF" />
      <path d="M15 10.2L18.2 8.3C18.4 8.2 18.7 8.3 18.7 8.6V15.4C18.7 15.7 18.4 15.8 18.2 15.7L15 13.8V10.2Z" fill="#FFFFFF" />
    </svg>
  );
}

// 18. arXiv (Official Maroon Academic Logo)
export function ArxivLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4.5" fill="#B31B1B" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="#FFFFFF"
        fontFamily="sans-serif"
        fontWeight="bold"
        fontSize="13"
      >
        arXiv
      </text>
    </svg>
  );
}

export const ArXivLogo = ArxivLogo;

// 19. Linear (Official Linear Purple Spiral Logo)
export function LinearLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="5" fill="#5E6AD2" />
      <path
        d="M5.5 12a6.5 6.5 0 0 1 11.1-4.6l-1.4 1.4A4.5 4.5 0 0 0 7.5 12h-2zm13 0a6.5 6.5 0 0 1-11.1 4.6l1.4-1.4A4.5 4.5 0 0 0 16.5 12h2z"
        fill="#FFFFFF"
      />
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
    </svg>
  );
}

// 20. Salesforce (Official Salesforce Blue Cloud)
export function SalesforceLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="4.5" fill="#00A1E0" />
      <path
        d="M17.5 10.5a3.5 3.5 0 0 0-3.3-2.3c-.6 0-1.2.2-1.7.5a4.5 4.5 0 0 0-4.3-1.2A4.2 4.2 0 0 0 4.6 11a3.5 3.5 0 0 0 .9 6.9h12a3.5 3.5 0 0 0 0-7.4z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

// 21. Apple Logo (Official Silhouette)
export function AppleLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.73 1.4-.59.68-1.11 1.77-.97 2.83 1.04.08 2.1-.51 2.74-1.29z" />
    </svg>
  );
}

// 22. Android Logo (Official Robot Glyph)
export function AndroidLogo({ className = "", size = 20 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71a.495.495 0 0 0-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15a.495.495 0 0 0-.71 0c-.2.2-.2.51 0 .71l1.31 1.31C6.97 4.26 6 5.76 6 7.5h12c0-1.74-.97-3.24-2.47-4.34zM10 5.5c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75zm4 0c-.41 0-.75-.34-.75-.75s.34-.75.75-.75.75.34.75.75-.34.75-.75.75z" />
    </svg>
  );
}

