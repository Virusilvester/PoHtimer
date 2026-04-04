import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nextScheduleOccurrence } from "./schedule";

export type PowerAction =
  | "shutdown"
  | "restart"
  | "hibernate"
  | "sleep"
  | "lock"
  | "logoff"
  | "none";
export type TimerStatus = "idle" | "running" | "paused" | "expired";
export type TimerKind = "duration" | "schedule";
export type View =
  | "dashboard"
  | "timer"
  | "battery"
  | "power"
  | "history"
  | "settings";
export type ClockMode = "digital" | "analog";
export type ActionSource = "timer" | "battery";
export type HistorySource = "timer" | "battery" | "system";

export interface MissedNotification {
  id: string;
  label: string;
  kind: "repeat" | "schedule";
  count?: number;
}

export interface ActionRequest {
  id: string;
  source: ActionSource;
  action: PowerAction;
  label: string;
  createdAt: number;
  timerId?: string;
  ruleId?: string;
}

export interface BatteryState {
  present: boolean;
  level?: number;
  charging: boolean;
  plugged: boolean;
  isLow: boolean;
  isCritical: boolean;
}

export interface TimerEntry {
  id: string;
  label: string;
  duration: number; // seconds
  remaining: number; // seconds
  action: PowerAction;
  status: TimerStatus;
  createdAt: number;
  updatedAt?: number;
  firedAt?: number;
  repeat: boolean;
  warnedAt?: number;
  kind?: TimerKind;
  scheduleTime?: string;
  scheduleDays?: number[];
  nextFireAt?: number;
}

export interface BatteryRule {
  id: string;
  enabled: boolean;
  type: "low" | "percent" | "unplug";
  percent?: number; // for 'percent' type
  action: PowerAction;
  label: string;
}

export interface HistoryEntry {
  id: string;
  label: string;
  action: PowerAction;
  timestamp: number;
  source: HistorySource;
  result?: "executed" | "canceled" | "failed";
  error?: string;
}

export interface Settings {
  theme: "dark" | "midnight" | "amber";
  accentColor: string;
  minimizeMode: "digital" | "analog";
  digitalWatchStyle:
    | "minimal"
    | "glass"
    | "panel"
    | "edge"
    | "matrix"
    | "segment"
    | "flip";
  analogWatchStyle:
    | "classic"
    | "neon"
    | "minimal"
    | "halo"
    | "swiss"
    | "stealth"
    | "orbital";
  clockSize: number;
  clockPosition: { x: number; y: number };
  notifyBeforeSeconds: number;
  confirmBeforeAction: boolean;
  startMinimized: boolean;
  autostart: boolean;
  askBeforeClose: boolean;
  closeAction: "minimize" | "exit";
}

interface AppState {
  view: View;
  isMinimized: boolean;
  timers: TimerEntry[];
  batteryRules: BatteryRule[];
  history: HistoryEntry[];
  pendingActions: ActionRequest[];
  showCreateTimer: boolean;
  settings: Settings;
  battery: BatteryState;
  clockMode: ClockMode;
  lastTickAt: number | null;
  missedNotifications: MissedNotification[];

  setView: (v: View) => void;
  setMinimized: (v: boolean) => void;
  setClockMode: (m: ClockMode) => void;
  setShowCreateTimer: (v: boolean) => void;

  addTimer: (
    t: Omit<TimerEntry, "id" | "createdAt" | "remaining" | "status">,
  ) => void;
  updateTimer: (id: string, patch: Partial<TimerEntry>) => void;
  removeTimer: (id: string) => void;
  toggleTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  tickTimers: () => void;
  syncTimersAfterDowntime: () => void;
  clearMissedNotifications: () => void;

  addBatteryRule: (r: Omit<BatteryRule, "id">) => void;
  updateBatteryRule: (id: string, patch: Partial<BatteryRule>) => void;
  removeBatteryRule: (id: string) => void;
  toggleBatteryRule: (id: string) => void;

  addHistory: (h: Omit<HistoryEntry, "id">) => void;
  clearHistory: () => void;

  enqueueAction: (a: Omit<ActionRequest, "id" | "createdAt">) => void;
  dequeueAction: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  setBattery: (battery: BatteryState) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultSettings: Settings = {
  theme: "dark",
  accentColor: "#ffb900",
  minimizeMode: "digital",
  digitalWatchStyle: "minimal",
  analogWatchStyle: "classic",
  clockSize: 160,
  clockPosition: { x: 20, y: 20 },
  notifyBeforeSeconds: 30,
  confirmBeforeAction: true,
  startMinimized: false,
  autostart: false,
  askBeforeClose: true,
  closeAction: "minimize",
};

const defaultBatteryRules: BatteryRule[] = [
  {
    id: uid(),
    enabled: true,
    type: "low",
    action: "hibernate",
    label: "Low battery",
  },
  {
    id: uid(),
    enabled: false,
    type: "percent",
    percent: 10,
    action: "shutdown",
    label: "Critical level",
  },
  {
    id: uid(),
    enabled: false,
    type: "unplug",
    action: "lock",
    label: "Unplugged",
  },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      view: "dashboard",
      isMinimized: false,
      timers: [],
      batteryRules: defaultBatteryRules,
      history: [],
      pendingActions: [],
      showCreateTimer: false,
      settings: defaultSettings,
      battery: {
        present: true,
        level: 72,
        charging: true,
        plugged: true,
        isLow: false,
        isCritical: false,
      },
      clockMode: "digital",
      lastTickAt: null,
      missedNotifications: [],

      setView: (view) => set({ view }),
      setMinimized: (isMinimized) => set({ isMinimized }),
      setClockMode: (clockMode) => set({ clockMode }),
      setShowCreateTimer: (showCreateTimer) => set({ showCreateTimer }),

      addTimer: (t) =>
        set((s) => {
          const now = Date.now();
          return {
            timers: [
              ...s.timers,
              (() => {
                if (t.kind === "schedule" && t.scheduleTime) {
                  const next = nextScheduleOccurrence(
                    t.scheduleTime,
                    t.scheduleDays,
                    new Date(now),
                  );
                  const seconds = next?.seconds ?? t.duration;
                  return {
                    ...t,
                    id: uid(),
                    createdAt: now,
                    updatedAt: now,
                    remaining: seconds,
                    duration: seconds,
                    status: "running",
                    nextFireAt: next?.nextAt,
                  };
                }
                return {
                  ...t,
                  id: uid(),
                  createdAt: now,
                  updatedAt: now,
                  remaining: t.duration,
                  status: "running",
                };
              })(),
            ],
            lastTickAt: now,
          };
        }),

      updateTimer: (id, patch) =>
        set((s) => ({
          timers: s.timers.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTimer: (id) =>
        set((s) => ({
          timers: s.timers.filter((t) => t.id !== id),
          pendingActions: s.pendingActions.filter((a) => a.timerId !== id),
        })),

      toggleTimer: (id) =>
        set((s) => {
          const now = Date.now();
          let didStart = false;
          const timers: TimerEntry[] = s.timers.map((t): TimerEntry => {
            if (t.id !== id) return t;
            if (t.status === "running") return { ...t, status: "paused" };
            if (t.status === "paused") {
              if (t.kind === "schedule" && t.scheduleTime) {
                const next = nextScheduleOccurrence(
                  t.scheduleTime,
                  t.scheduleDays,
                  new Date(now),
                );
                if (!next) return { ...t, status: "paused" };
                didStart = true;
                return {
                  ...t,
                  status: "running",
                  remaining: next.seconds,
                  duration: next.seconds,
                  warnedAt: undefined,
                  updatedAt: now,
                  nextFireAt: next.nextAt,
                };
              }
              didStart = true;
              return { ...t, status: "running", updatedAt: now };
            }
            return t;
          });
          return didStart ? { timers, lastTickAt: now } : { timers };
        }),

      resetTimer: (id) =>
        set((s) => {
          const now = Date.now();
          return {
            timers: s.timers.map((t) => {
              if (t.id !== id) return t;
              if (t.kind === "schedule" && t.scheduleTime) {
                const next = nextScheduleOccurrence(
                  t.scheduleTime,
                  t.scheduleDays,
                  new Date(now),
                );
                if (!next) return { ...t };
                return {
                  ...t,
                  remaining: next.seconds,
                  duration: next.seconds,
                  status: "running" as TimerStatus,
                  warnedAt: undefined,
                  updatedAt: now,
                  nextFireAt: next.nextAt,
                };
              }
              return {
                ...t,
                remaining: t.duration,
                status: "running" as TimerStatus,
                warnedAt: undefined,
                updatedAt: now,
              };
            }),
            lastTickAt: now,
          };
        }),

      tickTimers: () => {
        set((s) => {
          const now = Date.now();
          const lastTick = s.lastTickAt ?? now;
          const elapsedSeconds = Math.floor((now - lastTick) / 1000);
          if (elapsedSeconds <= 0) {
            if (s.lastTickAt == null) return { lastTickAt: now };
            return {};
          }
          const pendingActions = [...s.pendingActions];

          const timers = s.timers.map((t) => {
            if (t.status !== "running") return t;

            if (t.kind === "schedule" && t.scheduleTime) {
              const remaining = t.remaining - elapsedSeconds;
              if (remaining > 0)
                return {
                  ...t,
                  remaining,
                  updatedAt: now,
                };

              const alreadyQueued = pendingActions.some(
                (a) => a.source === "timer" && a.timerId === t.id,
              );
              if (!alreadyQueued) {
                pendingActions.push({
                  id: uid(),
                  source: "timer",
                  action: t.action,
                  label: t.label,
                  createdAt: now,
                  timerId: t.id,
                });
              }

              if (!t.repeat) {
                return {
                  ...t,
                  remaining: 0,
                  status: "expired" as TimerStatus,
                  firedAt: now,
                  updatedAt: now,
                };
              }

              const next = nextScheduleOccurrence(
                t.scheduleTime,
                t.scheduleDays,
                new Date(now),
              );
              if (!next)
                return {
                  ...t,
                  remaining: 0,
                  status: "paused" as TimerStatus,
                };

              return {
                ...t,
                remaining: next.seconds,
                duration: next.seconds,
                status: "running" as TimerStatus,
                firedAt: now,
                warnedAt: undefined,
                updatedAt: now,
                nextFireAt: next.nextAt,
              };
            }

            const remaining = t.remaining - elapsedSeconds;
            if (remaining > 0) return { ...t, remaining, updatedAt: now };

            const alreadyQueued = pendingActions.some(
              (a) => a.source === "timer" && a.timerId === t.id,
            );
            if (!alreadyQueued) {
              pendingActions.push({
                id: uid(),
                source: "timer",
                action: t.action,
                label: t.label,
                createdAt: now,
                timerId: t.id,
              });
            }

            if (t.repeat) {
              const duration = Math.max(1, t.duration);
              const elapsedAfterFire = Math.max(0, elapsedSeconds - t.remaining);
              const mod = elapsedAfterFire % duration;
              const nextRemaining = duration - mod;
              return {
                ...t,
                remaining: nextRemaining,
                warnedAt: undefined,
                updatedAt: now,
              };
            }
            return {
              ...t,
              remaining: 0,
              status: "expired" as TimerStatus,
              firedAt: now,
              updatedAt: now,
            };
          });

          return { timers, pendingActions, lastTickAt: now };
        });
      },

      syncTimersAfterDowntime: () =>
        set((s) => {
          const now = Date.now();
          const missedNotifications: MissedNotification[] = [];
          const missedHistory: HistoryEntry[] = [];
          const timers = s.timers.map((t) => {
            if (t.status !== "running") return t;

            const lastActiveAt = t.updatedAt ?? s.lastTickAt ?? t.createdAt;
            const elapsedSeconds = Math.floor((now - lastActiveAt) / 1000);
            if (elapsedSeconds <= 0) return t;

            if (t.kind === "schedule" && t.scheduleTime) {
              const dueAt =
                t.nextFireAt ?? lastActiveAt + t.remaining * 1000;
              if (dueAt <= now) {
                missedNotifications.push({
                  id: t.id,
                  label: t.label,
                  kind: "schedule",
                });
                missedHistory.push({
                  id: uid(),
                  label: `${t.label} (missed)`,
                  action: t.action,
                  timestamp: now,
                  source: "timer",
                });
              }
              const next = nextScheduleOccurrence(
                t.scheduleTime,
                t.scheduleDays,
                new Date(now),
              );
              if (!next)
                return {
                  ...t,
                  remaining: 0,
                  status: "paused" as TimerStatus,
                };
              return {
                ...t,
                remaining: next.seconds,
                duration: next.seconds,
                warnedAt: undefined,
                updatedAt: now,
                nextFireAt: next.nextAt,
              };
            }

            if (t.repeat) {
              if (elapsedSeconds >= t.remaining) {
                const duration = Math.max(1, t.duration);
                const count =
                  1 + Math.floor((elapsedSeconds - t.remaining) / duration);
                missedNotifications.push({
                  id: t.id,
                  label: t.label,
                  kind: "repeat",
                  count,
                });
                missedHistory.push({
                  id: uid(),
                  label:
                    count > 1
                      ? `${t.label} (missed x${count})`
                      : `${t.label} (missed)`,
                  action: t.action,
                  timestamp: now,
                  source: "timer",
                });
                return {
                  ...t,
                  remaining: duration,
                  warnedAt: undefined,
                  firedAt: now,
                  updatedAt: now,
                };
              }

              const remaining = t.remaining - elapsedSeconds;
              return { ...t, remaining, updatedAt: now };
            }

            const remaining = t.remaining - elapsedSeconds;
            if (remaining > 0) {
              return { ...t, remaining, updatedAt: now };
            }

            return {
              ...t,
              remaining: 0,
              status: "expired" as TimerStatus,
              firedAt: now,
              updatedAt: now,
            };
          });

          return {
            timers,
            lastTickAt: now,
            missedNotifications,
            history: missedHistory.length
              ? [...missedHistory, ...s.history].slice(0, 200)
              : s.history,
          };
        }),

      addBatteryRule: (r) =>
        set((s) => ({
          batteryRules: [...s.batteryRules, { ...r, id: uid() }],
        })),

      updateBatteryRule: (id, patch) =>
        set((s) => ({
          batteryRules: s.batteryRules.map((r) =>
            r.id === id ? { ...r, ...patch } : r,
          ),
        })),

      removeBatteryRule: (id) =>
        set((s) => ({
          batteryRules: s.batteryRules.filter((r) => r.id !== id),
          pendingActions: s.pendingActions.filter((a) => a.ruleId !== id),
        })),

      toggleBatteryRule: (id) =>
        set((s) => ({
          batteryRules: s.batteryRules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r,
          ),
        })),

      addHistory: (h) =>
        set((s) => ({
          history: [{ ...h, id: uid() }, ...s.history].slice(0, 200),
        })),
      clearHistory: () => set({ history: [] }),

      enqueueAction: (a) =>
        set((s) => {
          const exists =
            (a.timerId &&
              s.pendingActions.some(
                (p) => p.source === a.source && p.timerId === a.timerId,
              )) ||
            (a.ruleId &&
              s.pendingActions.some(
                (p) => p.source === a.source && p.ruleId === a.ruleId,
              ));
          if (exists) return s;
          return {
            pendingActions: [
              ...s.pendingActions,
              { ...a, id: uid(), createdAt: Date.now() },
            ],
          };
        }),
      dequeueAction: (id) =>
        set((s) => ({
          pendingActions: s.pendingActions.filter((a) => a.id !== id),
        })),

      updateSettings: (patch) =>
        set((s) => ({
          settings: { ...s.settings, ...patch },
        })),

      setBattery: (battery) => set({ battery }),
      clearMissedNotifications: () => set({ missedNotifications: [] }),
    }),
    {
      name: "PoHtimer:v1",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) return;
        state.syncTimersAfterDowntime();
      },
      partialize: (s) => ({
        view: s.view,
        timers: s.timers,
        batteryRules: s.batteryRules,
        history: s.history,
        settings: s.settings,
        clockMode: s.clockMode,
        lastTickAt: s.lastTickAt,
      }),
    },
  ),
);
