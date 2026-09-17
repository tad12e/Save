import React from 'react';

export interface ActionIconProps {
  className?: string;
  style?: React.CSSProperties;
  filled?: boolean;
}

// ❤️ Like / Heart Icon (Iconify Ph:heart / Ph:heart-fill)
export const HeartActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
  filled = false,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill={filled ? '#EF4444' : 'currentColor'}
    xmlns="http://www.w3.org/2000/svg"
  >
    {filled ? (
      <path d="M240 98a57.63 57.63 0 0 1-17 41L133.56 228.4a16 16 0 0 1-22.12 0L22 139a57.6 57.6 0 0 1 81.46-81.43L128 82.1l24.54-24.53A57.62 57.62 0 0 1 240 98Z" />
    ) : (
      <path
        d="M178 40c-20.65 0-38.73 8.88-50 23.89C116.73 48.88 98.65 40 78 40a62 62 0 0 0-62 62c0 70 104 118 112 121.6a16 16 0 0 0 12 0c8-3.6 112-51.6 112-121.6a62 62 0 0 0-62-62Zm-50 167.75C113.62 201 32 159 32 102a46 46 0 0 1 46-46c19.45 0 35.78 10.36 42.6 27a8 8 0 0 0 14.8 0C142.22 66.36 158.55 56 178 56a46 46 0 0 1 46 46c0 57-81.62 99-96 105.75Z"
        fill="currentColor"
      />
    )}
  </svg>
);

// ✅ Reviewed / Mastered Icon (Iconify Ph:checks-bold / Ph:check-circle)
export const CheckActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
  filled = false,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    {filled ? (
      <path
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm45.66 85.66l-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32Z"
        fill="#3FE769"
      />
    ) : (
      <path d="m244.24 77.92l-104 128a12 12 0 0 1-18.06.66l-48-52a12 12 0 1 1 17.64-16.32l38.4 41.6 95.3-117.28a12 12 0 1 1 18.72 15.34Zm-91.82 24.32a12 12 0 0 0-16.74 2.18L86.87 165l-20.9-22.64a12 12 0 1 0-17.64 16.32l29.89 32.39a12 12 0 0 0 18.06-.66l58.14-71.55a12 12 0 0 0-2-16.62Z" />
    )}
  </svg>
);

// 🔖 Watchlist / Bookmark Icon (Iconify Ph:bookmark-simple-bold)
export const WatchlistActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
  filled = false,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill={filled ? '#F59E0B' : 'currentColor'}
    xmlns="http://www.w3.org/2000/svg"
  >
    {filled ? (
      <path d="M192 32H64a16 16 0 0 0-16 16v168a8 8 0 0 0 12.8 6.4L128 171.2l67.2 51.2a8 8 0 0 0 12.8-6.4V48a16 16 0 0 0-16-16Z" />
    ) : (
      <path d="M192 24H64a20 20 0 0 0-20 20v184a12 12 0 0 0 19.2 9.6L128 188.8l64.8 48.8A12 12 0 0 0 212 228V44a20 20 0 0 0-20-20Zm-4 179.76l-54.8-41.28a12 12 0 0 0-14.4 0L64 203.76V48h124Z" />
    )}
  </svg>
);

// 💤 Snooze 24h Icon (Iconify Ph:moon-stars-bold)
export const SnoozeActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M235.54 150.21a104.84 104.84 0 0 1-37 52.91A104 104 0 0 1 32 120a103 103 0 0 1 20.88-62.09a104.84 104.84 0 0 1 52.91-37a8 8 0 0 1 10 9.87a88.06 88.06 0 0 0 110 110a8 8 0 0 1 9.75 9.43ZM144 80a8 8 0 0 0 8-8V56a8 8 0 0 0-16 0v16a8 8 0 0 0 8 8Zm48 16a8 8 0 0 0 8-8V72a8 8 0 0 0-16 0v16a8 8 0 0 0 8 8Z" />
  </svg>
);

// 🗑️ Archive Icon (Iconify Ph:archive-box-bold)
export const ArchiveActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M224 48H32a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16v96a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16v-96a16 16 0 0 0 16-16V64a16 16 0 0 0-16-16Zm-16 160H48v-96h160ZM224 96H32V64h192v32Zm-64 48a8 8 0 0 1-8 8h-48a8 8 0 0 1 0-16h48a8 8 0 0 1 8 8Z" />
  </svg>
);

// 📝 Note Icon (Iconify Ph:note-pencil-bold)
export const NoteActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m227.32 73.37l-44.69-44.68a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h44.69a15.86 15.86 0 0 0 11.31-4.69l123.32-123.31a16 16 0 0 0 0-22.63ZM92.69 208H48v-44.69l88-88L180.69 120ZM192 108.69L147.31 64l24-24L216 84.69Z" />
  </svg>
);

// 🔗 Share / Link Icon (Iconify Ph:share-network-bold)
export const ShareActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M192 160a39.91 39.91 0 0 0-30.8 14.43L101.4 144.5a40.54 40.54 0 0 0 0-33l59.8-29.93A40 40 0 1 0 152 56a39.46 39.46 0 0 0 1.4 10.43l-59.8 29.93a40 40 0 1 0 0 63.28l59.8 29.93A39.46 39.46 0 0 0 152 200a40 40 0 1 0 40-40Zm0-128a24 24 0 1 1-24 24a24 24 0 0 1 24-24ZM64 152a24 24 0 1 1 24-24a24 24 0 0 1-24 24Zm128 72a24 24 0 1 1 24-24a24 24 0 0 1-24 24Z" />
  </svg>
);

// ➡️ Export / Send to Destination Icon (Iconify Ph:paper-plane-tilt-bold)
export const ExportActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m227.32 28.68a16 16 0 0 0-15.66-4.08l-184 56a16 16 0 0 0-2.3 29.83l77.45 38.73l38.73 77.45a16 16 0 0 0 14.32 8.86h.63a16 16 0 0 0 14.88-11.16l56-184a16 16 0 0 0-4.05-15.63Zm-78.47 165.65l-29.42-58.83a8 8 0 0 0-3.58-3.58l-58.83-29.42l161-49Z" />
  </svg>
);

// ✕ Close Icon (Iconify Ph:x-bold)
export const CloseActionIcon: React.FC<ActionIconProps> = ({
  className = 'w-5 h-5',
  style,
}) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 256 256"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M208.49 191.51a12 12 0 0 1-17 17L128 145l-63.51 63.49a12 12 0 0 1-17-17L111 128L47.51 64.49a12 12 0 0 1 17-17L128 111l63.51-63.52a12 12 0 0 1 17 17L145 128Z" />
  </svg>
);
