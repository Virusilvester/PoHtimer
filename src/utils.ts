import type { PowerAction } from "./store";

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function formatDurationLong(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || !parts.length) parts.push(`${s}s`);
  return parts.join(" ");
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export const ACTION_META: Record<
  PowerAction,
  { label: string; icon: string; color: string; description: string }
> = {
  shutdown: {
    label: "Shutdown",
    icon: "⏻",
    color: "#ff4d4d",
    description: "Turn off the PC completely",
  },
  restart: {
    label: "Restart",
    icon: "↺",
    color: "#ff8c00",
    description: "Reboot the operating system",
  },
  hibernate: {
    label: "Hibernate",
    icon: "❄",
    color: "#3b9eff",
    description: "Save session to disk and power off",
  },
  sleep: {
    label: "Sleep",
    icon: "☽",
    color: "#9b7fe8",
    description: "Low-power sleep mode",
  },
  lock: {
    label: "Lock",
    icon: "🔒",
    color: "#00d97e",
    description: "Lock the screen",
  },
  logoff: {
    label: "Log Off",
    icon: "⇥",
    color: "#ffb900",
    description: "Sign out current user",
  },
  none: {
    label: "Do Nothing",
    icon: "–",
    color: "#4a5168",
    description: "No action (notification only)",
  },
};

export function progressPercent(remaining: number, total: number) {
  if (total === 0) return 0;
  return Math.max(0, Math.min(100, (1 - remaining / total) * 100));
}

export function parseTimeInput(val: string): number {
  // Accepts: "1:30:00", "90:00", "5400", "1h30m", "90m"
  if (/^\d+$/.test(val.trim())) return parseInt(val, 10);
  const hms = val.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (hms) {
    const [, a, b, c] = hms;
    if (c !== undefined) return +a * 3600 + +b * 60 + +c;
    return +a * 60 + +b;
  }
  const human = val.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i);
  if (human) {
    const [, h, m, s] = human;
    return +(h || 0) * 3600 + +(m || 0) * 60 + +(s || 0);
  }
  return 0;
}

export const QUICK_DURATIONS = [
  { label: "5 min", value: 300 },
  { label: "15 min", value: 900 },
  { label: "30 min", value: 1800 },
  { label: "1 hr", value: 3600 },
  { label: "2 hr", value: 7200 },
  { label: "4 hr", value: 14400 },
];
