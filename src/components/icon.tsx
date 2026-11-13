import type { ReactNode } from "react";

const paths = {
  spark: <><path d="M12 2.5 14.1 9.9 21.5 12l-7.4 2.1L12 21.5l-2.1-7.4L2.5 12l7.4-2.1L12 2.5Z"/><path d="M19.5 2.5v4m-2-2h4"/></>,
  download: <><path d="M12 3v12m-4-4 4 4 4-4"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></>,
  shuffle: <><path d="M3 7h3c4 0 5 10 9 10h6m-4-4 4 4-4 4M3 17h3c1.4 0 2.5-1.4 3.3-3m3.4-4C13.6 8.3 14.6 7 16 7h5m-4-4 4 4-4 4"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/></>,
  sliders: <><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--panel, #fff)"/><circle cx="15" cy="17" r="2" fill="var(--panel, #fff)"/></>,
  up: <path d="m6 14 6-6 6 6"/>,
  down: <path d="m6 10 6 6 6-6"/>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  trash: <><path d="M4 7h16m-9-3h2a1 1 0 0 1 1 1v2m4 0-.8 12a1 1 0 0 1-1 1H7.8a1 1 0 0 1-1-1L6 7m4 4v5m4-5v5"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  check: <path d="m5 12 4 4 10-10"/>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></>,
  pointer: <path d="m5 3 14 10-7 1-3 6L5 3Z"/>,
  frame: <path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>,
} satisfies Record<string, ReactNode>;

export function Icon({ name, size = 18 }: { name: keyof typeof paths; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
