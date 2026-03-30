import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type PowerAction = 'shutdown' | 'restart' | 'hibernate' | 'sleep' | 'lock' | 'logoff' | 'none';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'expired';
export type View = 'dashboard' | 'timer' | 'battery' | 'power' | 'history' | 'settings';
export type ClockMode = 'digital' | 'analog';
export type ActionSource = 'timer' | 'battery';

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
  duration: number;       // seconds
  remaining: number;      // seconds
  action: PowerAction;
  status: TimerStatus;
  createdAt: number;
  firedAt?: number;
  repeat: boolean;
  warnedAt?: number;
}

export interface BatteryRule {
  id: string;
  enabled: boolean;
  type: 'low' | 'percent' | 'unplug';
  percent?: number;       // for 'percent' type
  action: PowerAction;
  label: string;
}

export interface HistoryEntry {
  id: string;
  label: string;
  action: PowerAction;
  timestamp: number;
  source: 'timer' | 'battery';
  result?: 'executed' | 'canceled' | 'failed';
  error?: string;
}

export interface Settings {
  theme: 'dark' | 'midnight' | 'amber';
  accentColor: string;
  minimizeMode: 'digital' | 'analog';
  digitalWatchStyle: 'minimal' | 'glass' | 'panel';
  analogWatchStyle: 'classic' | 'neon' | 'minimal';
  clockSize: number;
  clockPosition: { x: number; y: number };
  notifyBeforeSeconds: number;
  confirmBeforeAction: boolean;
  startMinimized: boolean;
  autostart: boolean;
  askBeforeClose: boolean;
  closeAction: 'minimize' | 'exit';
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

  setView: (v: View) => void;
  setMinimized: (v: boolean) => void;
  setClockMode: (m: ClockMode) => void;
  setShowCreateTimer: (v: boolean) => void;

  addTimer: (t: Omit<TimerEntry, 'id' | 'createdAt' | 'remaining' | 'status'>) => void;
  updateTimer: (id: string, patch: Partial<TimerEntry>) => void;
  removeTimer: (id: string) => void;
  toggleTimer: (id: string) => void;
  tickTimers: () => void;

  addBatteryRule: (r: Omit<BatteryRule, 'id'>) => void;
  updateBatteryRule: (id: string, patch: Partial<BatteryRule>) => void;
  removeBatteryRule: (id: string) => void;
  toggleBatteryRule: (id: string) => void;

  addHistory: (h: Omit<HistoryEntry, 'id'>) => void;
  clearHistory: () => void;

  enqueueAction: (a: Omit<ActionRequest, 'id' | 'createdAt'>) => void;
  dequeueAction: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  setBattery: (battery: BatteryState) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultSettings: Settings = {
  theme: 'dark',
  accentColor: '#ffb900',
  minimizeMode: 'digital',
  digitalWatchStyle: 'minimal',
  analogWatchStyle: 'classic',
  clockSize: 160,
  clockPosition: { x: 20, y: 20 },
  notifyBeforeSeconds: 30,
  confirmBeforeAction: true,
  startMinimized: false,
  autostart: false,
  askBeforeClose: true,
  closeAction: 'minimize',
};

const defaultBatteryRules: BatteryRule[] = [
  { id: uid(), enabled: true,  type: 'low',     action: 'hibernate', label: 'Low battery' },
  { id: uid(), enabled: false, type: 'percent', percent: 10, action: 'shutdown', label: 'Critical level' },
  { id: uid(), enabled: false, type: 'unplug',  action: 'lock',      label: 'Unplugged' },
];

export const useStore = create<AppState>()(
  persist(
    (set) => ({
  view: 'dashboard',
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
  clockMode: 'digital',

  setView: (view) => set({ view }),
  setMinimized: (isMinimized) => set({ isMinimized }),
  setClockMode: (clockMode) => set({ clockMode }),
  setShowCreateTimer: (showCreateTimer) => set({ showCreateTimer }),

  addTimer: (t) => set((s) => ({
    timers: [...s.timers, {
      ...t,
      id: uid(),
      createdAt: Date.now(),
      remaining: t.duration,
      status: 'running',
    }],
  })),

  updateTimer: (id, patch) => set((s) => ({
    timers: s.timers.map(t => t.id === id ? { ...t, ...patch } : t),
  })),

  removeTimer: (id) => set((s) => ({
    timers: s.timers.filter(t => t.id !== id),
    pendingActions: s.pendingActions.filter(a => a.timerId !== id),
  })),

  toggleTimer: (id) => set((s) => ({
    timers: s.timers.map(t => {
      if (t.id !== id) return t;
      if (t.status === 'running') return { ...t, status: 'paused' };
      if (t.status === 'paused') return { ...t, status: 'running' };
      return t;
    }),
  })),

  tickTimers: () => {
    set((s) => {
      const now = Date.now();
      const pendingActions = [...s.pendingActions];

      const timers = s.timers.map((t) => {
        if (t.status !== 'running') return t;

        const remaining = t.remaining - 1;
        if (remaining > 0) return { ...t, remaining };

        const alreadyQueued = pendingActions.some(
          (a) => a.source === 'timer' && a.timerId === t.id,
        );
        if (!alreadyQueued) {
          pendingActions.push({
            id: uid(),
            source: 'timer',
            action: t.action,
            label: t.label,
            createdAt: now,
            timerId: t.id,
          });
        }

        if (t.repeat) return { ...t, remaining: t.duration, warnedAt: undefined };
        return { ...t, remaining: 0, status: 'expired' as TimerStatus, firedAt: now };
      });

      return { timers, pendingActions };
    });
  },

  addBatteryRule: (r) => set((s) => ({
    batteryRules: [...s.batteryRules, { ...r, id: uid() }],
  })),

  updateBatteryRule: (id, patch) => set((s) => ({
    batteryRules: s.batteryRules.map(r => r.id === id ? { ...r, ...patch } : r),
  })),

  removeBatteryRule: (id) => set((s) => ({
    batteryRules: s.batteryRules.filter(r => r.id !== id),
    pendingActions: s.pendingActions.filter(a => a.ruleId !== id),
  })),

  toggleBatteryRule: (id) => set((s) => ({
    batteryRules: s.batteryRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r),
  })),

  addHistory: (h) => set((s) => ({
    history: [{ ...h, id: uid() }, ...s.history].slice(0, 200),
  })),
  clearHistory: () => set({ history: [] }),

  enqueueAction: (a) => set((s) => {
    const exists =
      (a.timerId && s.pendingActions.some(p => p.source === a.source && p.timerId === a.timerId)) ||
      (a.ruleId && s.pendingActions.some(p => p.source === a.source && p.ruleId === a.ruleId));
    if (exists) return s;
    return { pendingActions: [...s.pendingActions, { ...a, id: uid(), createdAt: Date.now() }] };
  }),
  dequeueAction: (id) => set((s) => ({
    pendingActions: s.pendingActions.filter(a => a.id !== id),
  })),

  updateSettings: (patch) => set((s) => ({
    settings: { ...s.settings, ...patch },
  })),

      setBattery: (battery) => set({ battery }),
    }),
    {
      name: 'poh-timer:v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        view: s.view,
        timers: s.timers.map((t) =>
          t.status === 'running' ? { ...t, status: 'paused' } : t,
        ),
        batteryRules: s.batteryRules,
        history: s.history,
        settings: s.settings,
        clockMode: s.clockMode,
      }),
    },
  ),
);
