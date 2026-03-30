import React, { useEffect, useRef, useState } from "react";
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
import { Btn, Toggle } from "./components/ui";
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
    setMinimized,
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
    setView,
    setShowCreateTimer,
  } = useStore();

  const prevBattery = useRef(battery);
  const processingId = useRef<string | null>(null);
  const wasOverlay = useRef(false);
  const autostartInitialized = useRef(false);
  const lastAutostart = useRef<boolean | null>(null);
  const [closePromptOpen, setClosePromptOpen] = useState(false);
  const [dontAskClose, setDontAskClose] = useState(false);

  const performClose = (action: "minimize" | "exit") => {
    if (action === "exit") return void TauriCommands.exitApp();
    return void TauriCommands.windowClose();
  };

  const handleCloseRequest = () => {
    if (!settings.askBeforeClose) {
      performClose(settings.closeAction);
      return;
    }
    setDontAskClose(false);
    setClosePromptOpen(true);
  };

  const hasRunningTimers = timers.some((t) => t.status === "running");
  useEffect(() => {
    if (!hasRunningTimers) return;
    const id = setInterval(tickTimers, 1000);
    return () => clearInterval(id);
  }, [tickTimers, hasRunningTimers]);

  useEffect(() => {
    applyTheme({ theme: settings.theme, accentColor: settings.accentColor });
  }, [settings.accentColor, settings.theme]);

  const overlayMode = settings.minimizeMode;
  useEffect(() => {
    if (isMinimized) {
      wasOverlay.current = true;
      void TauriCommands.minimizeToOverlay(overlayMode, settings.clockSize);
      return;
    }
    if (!wasOverlay.current) return;
    wasOverlay.current = false;
    void TauriCommands.restoreFromOverlay();
  }, [isMinimized, settings.clockSize, overlayMode, settings.minimizeMode]);

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
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => window.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("__TAURI_INTERNALS__" in window)) return;
    const enabledCount = batteryRules.filter((r) => r.enabled).length;
    void TauriCommands.updateTrayMenu(enabledCount);
  }, [batteryRules]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("__TAURI_INTERNALS__" in window)) return;

    let unlistenRestore: (() => void) | undefined;
    let unlistenClose: (() => void) | undefined;
    let unlistenOpenView: (() => void) | undefined;

    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unlistenRestore = await listen("poh://restore-app", () => {
        setMinimized(false);
      });
      unlistenClose = await listen("poh://close-requested", () => {
        handleCloseRequest();
      });
      unlistenOpenView = await listen<{ view?: string; create?: boolean }>(
        "poh://open-view",
        (event) => {
          const view = event.payload?.view;
          if (view) setView(view as any);
          if (event.payload?.create) setShowCreateTimer(true);
          setMinimized(false);
        },
      );
    })();

    return () => {
      if (unlistenRestore) unlistenRestore();
      if (unlistenClose) unlistenClose();
      if (unlistenOpenView) unlistenOpenView();
    };
  }, [
    setMinimized,
    setView,
    setShowCreateTimer,
    settings.askBeforeClose,
    settings.closeAction,
  ]);

  const hasEnabledBatteryRules = batteryRules.some((r) => r.enabled);
  const batteryPollMs = hasEnabledBatteryRules ? 10_000 : 30_000;

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
    const id = setInterval(poll, batteryPollMs);
    return () => clearInterval(id);
  }, [setBattery, batteryPollMs]);

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
            key={current.id}
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
      <TitleBar onCloseRequest={handleCloseRequest} />
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
          key={current.id}
          action={current.action}
          source={current.source}
          label={current.label}
          onConfirm={() => void executeRequest(current)}
          onCancel={() => finalizeRequest(current, "canceled")}
        />
      )}
      {closePromptOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(5px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 300,
            animation: "slide-up 0.2s ease",
          }}
        >
          <div
            style={{
              width: 420,
              maxWidth: "calc(100vw - 32px)",
              background: "var(--bg-surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              padding: "24px 24px 20px",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Close PoHtimer?
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Choose whether to exit the app or minimize it to the tray.
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <Btn
                variant="outline"
                style={{ flex: 1 }}
                onClick={() => {
                  if (dontAskClose) {
                    updateSettings({
                      askBeforeClose: false,
                      closeAction: "minimize",
                    });
                  }
                  setClosePromptOpen(false);
                  performClose("minimize");
                }}
              >
                Minimize to tray
              </Btn>
              <Btn
                variant="danger"
                style={{ flex: 1 }}
                onClick={() => {
                  if (dontAskClose) {
                    updateSettings({
                      askBeforeClose: false,
                      closeAction: "exit",
                    });
                  }
                  setClosePromptOpen(false);
                  performClose("exit");
                }}
              >
                Exit app
              </Btn>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
              }}
            >
              <Toggle
                checked={dontAskClose}
                onChange={setDontAskClose}
                size="sm"
              />
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                Don’t ask again
              </span>
              <button
                onClick={() => setClosePromptOpen(false)}
                style={{
                  marginLeft: "auto",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
