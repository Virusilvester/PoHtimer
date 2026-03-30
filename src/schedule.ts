export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKEND = [0, 6];

const normalizeDays = (days?: number[]) => {
  if (!days || days.length === 0) return ALL_DAYS;
  const clean = Array.from(new Set(days.filter((d) => d >= 0 && d <= 6))).sort(
    (a, b) => a - b,
  );
  return clean.length ? clean : ALL_DAYS;
};

const sameDays = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export function formatScheduleDays(days?: number[]) {
  const normalized = normalizeDays(days);
  if (sameDays(normalized, ALL_DAYS)) return "Daily";
  if (sameDays(normalized, WEEKDAYS)) return "Weekdays";
  if (sameDays(normalized, WEEKEND)) return "Weekend";
  return normalized.map((d) => DAY_LABELS[d]).join(", ");
}

export function nextScheduleOccurrence(
  time: string,
  days?: number[],
  from: Date = new Date(),
) {
  const [h, m] = time.split(":").map((v) => Number(v));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;

  const targetDays = normalizeDays(days);
  const nowTs = from.getTime();

  for (let i = 0; i <= 7; i += 1) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    d.setHours(h, m, 0, 0);
    if (!targetDays.includes(d.getDay())) continue;
    if (d.getTime() <= nowTs) continue;
    const seconds = Math.max(1, Math.ceil((d.getTime() - nowTs) / 1000));
    return { nextAt: d.getTime(), seconds };
  }

  const fallback = new Date(from);
  fallback.setDate(from.getDate() + 7);
  fallback.setHours(h, m, 0, 0);
  const seconds = Math.max(
    1,
    Math.ceil((fallback.getTime() - nowTs) / 1000),
  );
  return { nextAt: fallback.getTime(), seconds };
}
