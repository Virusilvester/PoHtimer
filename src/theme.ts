import type { Settings } from "./store";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const trimmed = hex.trim().replace(/^#/, "");
  const full =
    trimmed.length === 3
      ? trimmed
          .split("")
          .map((c) => c + c)
          .join("")
      : trimmed;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  const n = parseInt(full, 16);
  return {
    r: (n >> 16) & 0xff,
    g: (n >> 8) & 0xff,
    b: n & 0xff,
  };
}

function rgba(hex: string, a: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(255,185,0,${a})`;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

export function applyTheme(settings: Pick<Settings, "theme" | "accentColor">) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;

  root.style.setProperty("--accent", settings.accentColor);
  root.style.setProperty("--accent-dim", rgba(settings.accentColor, 0.15));
  root.style.setProperty("--accent-glow", rgba(settings.accentColor, 0.25));
  root.style.setProperty("--accent-shadow", rgba(settings.accentColor, 0.1));
  root.style.setProperty("--accent-strong", rgba(settings.accentColor, 0.6));
  root.style.setProperty("--accent-glow-strong", rgba(settings.accentColor, 0.5));
  root.style.setProperty("--border-accent", rgba(settings.accentColor, 0.35));
}
