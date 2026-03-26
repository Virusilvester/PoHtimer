import React, { useEffect, useRef } from "react";
import "./App.css";
import { type ActionRequest, useStore } from "./store";
import { Sidebar } from "./components/Sidebar";
import { TitleBar } from "./components/Titlebar";
import { Dashboard } from "./components/Dashboard";
import { TimerView } from "./components/TimerView";
import { BatteryView } from "./components/BatteryView";
import { PowerView } from "./components/PowerView";
import { HistoryView } from "./components/Historyview";
import { SettingsView } from "./components/Settingsview";
import { DesktopOverlay } from "./components/DesktopOverlay";
import { ActionConfirmModal } from "./components/ActionConfirmModal";
import { TauriCommands } from "./tauricommands";
import { executePowerAction } from "./powerActions";
import { applyTheme } from "./theme";

const ViewRenderer: React.FC = () => {
  const { view } = useStore();
  switch (view) {
    case "dashboard":
      return <Dashboard />;
    case "timer":
      return <TimerView />;
    case "battery":
      return <BatteryView />;
    case "power":
      return <PowerView />;
    case "history":
      return <HistoryView />;
    case "settings":
      return <SettingsView />;
    default:
      return <Dashboard />;
  }
};

const App: React.FC = () => {
  const {
    isMinimized,
    tickTimers,
    timers,
    batteryRules,
    battery,
    setBattery,
    settings,
    pendingActions,
    enqueueAction,
    dequeueAction,
    updateTimer,
    addHistory,
    updateSettings,
  } = useStore();

  const prevBattery = useRef(battery);
  const processingId = useRef<string | null>(null);
  const wasOverlay = useRef(false);
  const autostartInitialized = useRef(false);
  const lastAutostart = useRef<boolean | null>(null);

  useEffect(() => {
    const id = setInterval(tickTimers, 1000);
    return () => clearInterval(id);
  }, [tickTimers]);

  useEffect(() => {
    applyTheme({ theme: settings.theme, accentColor: settings.accentColor });
  }, [settings.accentColor, settings.theme]);

  useEffect(() => {
    if (isMinimized) {
      wasOverlay.current = true;
      void TauriCommands.minimizeToOverlay(settings.minimizeMode, settings.clockSize);
      return;
    }
    if (!wasOverlay.current) return;
    wasOverlay.current = false;
    void TauriCommands.restoreFromOverlay();
  }, [isMinimized, settings.clockSize, settings.minimizeMode]);

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration((s) => {
      if (s.settings.startMinimized) s.setMinimized(true);

      autostartInitialized.current = true;
      lastAutostart.current = s.settings.autostart;

      void (async () => {
        const enabled = await TauriCommands.getAutostartEnabled().catch(() => null);
        if (enabled == null) return;
        if (enabled !== s.settings.autostart) s.updateSettings({ autostart: enabled });
      })();
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!autostartInitialized.current) return;
    if (lastAutostart.current === settings.autostart) return;
    lastAutostart.current = settings.autostart;

    void TauriCommands.setAutostart(settings.autostart).catch((e) => {
      lastAutostart.current = !settings.autostart;
      updateSettings({ autostart: !settings.autostart });
      void TauriCommands.sendNotification("PoHtimer", `Failed to set autostart: ${String(e)}`);
    });
  }, [settings.autostart, updateSettings]);

  useEffect(() => {
    const poll = async () => {
      try {
        const info = await TauriCommands.getBatteryInfo();
        setBattery({
          present: info.present,
          level: info.level,
          charging: info.charging,
          plugged: info.plugged,
          isLow: info.isLow,
          isCritical: info.isCritical,
        });
      } catch {
        setBattery({
          present: false,
          level: undefined,
          charging: false,
          plugged: true,
          isLow: false,
          isCritical: false,
        });
      }
    };
    poll();
    const id = setInterval(poll, 10_000);
    return () => clearInterval(id);
  }, [setBattery]);

  useEffect(() => {
    const prev = prevBattery.current;
    prevBattery.current = battery;
    if (!battery.present) return;
    if (!prev.present) return;

    for (const rule of batteryRules) {
      if (!rule.enabled) continue;

      const nowLow =
        battery.isLow ||
        battery.isCritical ||
        (battery.level != null && battery.level <= 20 && !battery.plugged);
      const prevLow =
        prev.isLow ||
        prev.isCritical ||
        (prev.level != null && prev.level <= 20 && !prev.plugged);

      if (rule.type === "unplug") {
        if (prev.plugged && !battery.plugged) {
          enqueueAction({
            source: "battery",
            action: rule.action,
            label: rule.label,
            ruleId: rule.id,
          });
        }
      } else if (rule.type === "percent") {
        if (rule.percent == null) continue;
        if (
          prev.level != null &&
          battery.level != null &&
          prev.level > rule.percent &&
          battery.level <= rule.percent
        ) {
          enqueueAction({
            source: "battery",
            action: rule.action,
            label: rule.label,
            ruleId: rule.id,
          });
        }
      } else if (rule.type === "low") {
        if (!prevLow && nowLow) {
          enqueueAction({
            source: "battery",
            action: rule.action,
            label: rule.label,
            ruleId: rule.id,
          });
        }
      }
    }
  }, [battery, batteryRules, enqueueAction]);

  useEffect(() => {
    const lead = settings.notifyBeforeSeconds;
    if (lead <= 0) return;

    for (const t of timers) {
      if (t.status !== "running") continue;
      if (t.warnedAt) continue;
      if (t.remaining <= 0) continue;
      if (t.remaining > lead) continue;

      void TauriCommands.sendNotification(
        "PoHtimer",
        `"${t.label}" will fire in ${t.remaining}s`,
      );
      updateTimer(t.id, { warnedAt: Date.now() });
    }
  }, [settings.notifyBeforeSeconds, timers, updateTimer]);

  const current = pendingActions[0];
  const shouldConfirm =
    !!current && current.action !== "none" && settings.confirmBeforeAction && !isMinimized;

  const finalizeRequest = (req: ActionRequest, result: "executed" | "canceled" | "failed", error?: string) => {
    addHistory({
      label: req.label,
      action: req.action,
      timestamp: Date.now(),
      source: req.source,
      result,
      error,
    });
    dequeueAction(req.id);
    processingId.current = null;
  };

  const executeRequest = async (req: ActionRequest) => {
    if (processingId.current === req.id) return;
    processingId.current = req.id;

    try {
      if (req.action === "none") {
        await TauriCommands.sendNotification("PoHtimer", `"${req.label}" completed`);
        finalizeRequest(req, "executed");
        return;
      }

      await executePowerAction(req.action);
      finalizeRequest(req, "executed");
    } catch (e) {
      finalizeRequest(req, "failed", String(e));
    }
  };

  useEffect(() => {
    if (!current) {
      processingId.current = null;
      return;
    }
    if (shouldConfirm) return;
    if (processingId.current === current.id) return;
    void executeRequest(current);
  }, [current, shouldConfirm]);

  if (isMinimized) {
    return (
      <div
        style={{ width: "100vw", height: "100vh", background: "transparent" }}
      >
        <DesktopOverlay />
        {shouldConfirm && current && (
          <ActionConfirmModal
            action={current.action}
            source={current.source}
            label={current.label}
            onConfirm={() => void executeRequest(current)}
            onCancel={() => finalizeRequest(current, "canceled")}
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-base)",
      }}
    >
      <TitleBar />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar />
        <main
          style={{ flex: 1, overflow: "hidden", background: "var(--bg-base)" }}
        >
          <ViewRenderer />
        </main>
      </div>
      {shouldConfirm && current && (
        <ActionConfirmModal
          action={current.action}
          source={current.source}
          label={current.label}
          onConfirm={() => void executeRequest(current)}
          onCancel={() => finalizeRequest(current, "canceled")}
        />
      )}
    </div>
  );
};

export default App;
