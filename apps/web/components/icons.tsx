import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, className, ...props }: Props) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    ...props,
  };
}

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <path
        d="M24 4.5l16 6.4v12.3c0 9.7-6.5 16.7-16 20.3-9.5-3.6-16-10.6-16-20.3V10.9L24 4.5z"
        stroke="currentColor"
        strokeWidth="1.9"
        opacity="0.9"
      />
      <circle cx="24" cy="23.5" r="7.2" stroke="currentColor" strokeWidth="1.9" />
      <path d="M29.4 28.9l5.1 5.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="24" cy="23.5" r="2" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export const IconLink = (p: Props) => (
  <svg {...base(p)}>
    <path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1.5 1.5" />
    <path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1.5-1.5" />
  </svg>
);

export const IconMessage = (p: Props) => (
  <svg {...base(p)}>
    <path d="M20 15a3 3 0 01-3 3H8l-4 3V6a3 3 0 013-3h10a3 3 0 013 3z" />
    <path d="M8 9h8M8 12.5h5" />
  </svg>
);

export const IconSearch = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const IconArrow = (p: Props) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconCheck = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const IconX = (p: Props) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconAlert = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 4l9 16H3L12 4z" />
    <path d="M12 10v4M12 17.2v.1" />
  </svg>
);

export const IconChevron = (p: Props) => (
  <svg {...base(p)}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconExternal = (p: Props) => (
  <svg {...base(p)}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
  </svg>
);

export const IconDownload = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 4v11M8 11l4 4 4-4" />
    <path d="M5 19h14" />
  </svg>
);

export const IconRefresh = (p: Props) => (
  <svg {...base(p)}>
    <path d="M20 5v5h-5" />
    <path d="M19 10a7.5 7.5 0 10.5 4" />
  </svg>
);

export const IconTrash = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 13h9.4l.8-13" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const IconShield = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 3l7 2.8v5.4c0 4.4-2.9 7.6-7 9.3-4.1-1.7-7-4.9-7-9.3V5.8L12 3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const IconLock = (p: Props) => (
  <svg {...base(p)}>
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8.5 10V7.5a3.5 3.5 0 017 0V10" />
  </svg>
);

export const IconCpu = (p: Props) => (
  <svg {...base(p)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
  </svg>
);

export const IconClock = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.3l3.2 2" />
  </svg>
);

export const IconCopy = (p: Props) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3" />
  </svg>
);

export const IconPlay = (p: Props) => (
  <svg {...base(p)}>
    <path d="M8 5.5l10 6.5-10 6.5v-13z" />
  </svg>
);

export const IconPause = (p: Props) => (
  <svg {...base(p)}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);

export const IconActivity = (p: Props) => (
  <svg {...base(p)}>
    <path d="M3 12h4l2.2-6 4 12L15.5 12H21" />
  </svg>
);

export const IconDatabase = (p: Props) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="6" rx="7" ry="3" />
    <path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
    <path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3" />
  </svg>
);

export const IconChain = (p: Props) => (
  <svg {...base(p)}>
    <path d="M9.5 14.5l5-5" />
    <path d="M7.5 16.5l-1 1a3.5 3.5 0 01-5-5l3-3a3.5 3.5 0 015 0" />
    <path d="M16.5 7.5l1-1a3.5 3.5 0 015 5l-3 3a3.5 3.5 0 01-5 0" />
  </svg>
);

export const IconUser = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.5 3.5-5 7-5s6.2 1.5 7 5" />
  </svg>
);

export const IconLogout = (p: Props) => (
  <svg {...base(p)}>
    <path d="M14 8V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h7a2 2 0 002-2v-2" />
    <path d="M9 12h11M17 8l4 4-4 4" />
  </svg>
);

export const IconInfo = (p: Props) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5M12 8v.1" />
  </svg>
);

export const IconScan = (p: Props) => (
  <svg {...base(p)}>
    <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" />
    <path d="M4 12h16" />
  </svg>
);

export const IconSpinner = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={`animate-spin ${className}`}
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const IconSpark = (p: Props) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    <path d="M18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" />
  </svg>
);
