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
    updateSettings,
    setView,
    setShowCreateTimer,
    missedNotifications,
    clearMissedNotifications,
    addHistory,
  } = useStore();

  const prevBattery = useRef(battery);
  const processingId = useRef<string | null>(null);
  const wasOverlay = useRef(false);
  const autostartInitialized = useRef(false);
  const lastAutostart = useRef<boolean | null>(null);
  const autostartSyncId = useRef(0);
  const hydrationHandled = useRef(false);
  const [closePromptOpen, setClosePromptOpen] = useState(false);
  const [dontAskClose, setDontAskClose] = useState(false);
  const [inAppNotices, setInAppNotices] = useState<
    { id: string; title: string; body: string }[]
  >([]);
  const [uiWarning, setUiWarning] = useState<string | null>(null);
  const isTauriApp =
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window ||
      "__TAURI__" in window ||
      "__TAURI_METADATA__" in window);
  const isProdBuild =
    typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.PROD;

  const pushInAppNotice = (title: string, body: string) => {
    const id = Math.random().toString(36).slice(2, 10);
    setInAppNotices((items) => [...items, { id, title, body }]);
    window.setTimeout(() => {
      setInAppNotices((items) => items.filter((n) => n.id !== id));
    }, 7000);
  };

  const dismissInAppNotice = (id: string) => {
    setInAppNotices((items) => items.filter((n) => n.id !== id));
  };

  const notify = async (
    title: string,
    body: string,
    options?: { skipHistory?: boolean },
  ) => {
    try {
      await TauriCommands.sendNotification(title, body);
    } catch (e) {
      pushInAppNotice(title, body);
      if (!options?.skipHistory) {
        addHistory({
          label: `Notification failed: ${title}`,
          action: "none",
          timestamp: Date.now(),
          source: "system",
          result: "failed",
          error: body,
        });
      }
    }
  };

  useEffect(() => {
    if (!isProdBuild) return;
    const checkUi = () => {
      const titleBtn = document.querySelector(
        ".titlebar-traffic-btn",
      ) as HTMLElement | null;
      const sidebarBtn = document.querySelector(
        ".sidebar-nav-btn",
      ) as HTMLElement | null;

      const titleOk =
        !!titleBtn && titleBtn.offsetWidth >= 10 && titleBtn.offsetHeight >= 10;
      const sidebarOk =
        !!sidebarBtn && sidebarBtn.offsetHeight >= 20 && sidebarBtn.offsetWidth >= 80;

      if (!titleOk || !sidebarOk) {
        setUiWarning(
          "UI styles did not load correctly. Try restarting the app or reinstalling.",
        );
      } else {
        setUiWarning(null);
      }
    };

    const initial = window.setTimeout(checkUi, 2000);
    const interval = window.setInterval(checkUi, 8000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [isProdBuild]);

  const performClose = (action: "minimize" | "exit") => {
    if (action === "exit") return void TauriCommands.exitApp();
    setMinimized(true);
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

  useEffect(() => {
    if (!missedNotifications.length) return;
    missedNotifications.forEach((missed) => {
      if (missed.kind === "repeat") {
        const count = missed.count ?? 1;
        const times = count === 1 ? "once" : `${count} times`;
        void notify(
          "PoHtimer",
          `"${missed.label}" missed ${times} while PoHtimer was closed. Timer reset.`,
          { skipHistory: true },
        );
        return;
      }
      void notify(
        "PoHtimer",
        `"${missed.label}" missed while PoHtimer was closed. Next occurrence scheduled.`,
        { skipHistory: true },
      );
    });
    clearMissedNotifications();
  }, [missedNotifications, clearMissedNotifications, notify]);

  const overlayMode = settings.minimizeMode;
  useEffect(() => {
    if (isMinimized) {
      wasOverlay.current = true;
      void TauriCommands.minimizeToOverlay(overlayMode, settings.clockSize);
      window.setTimeout(() => {
        void TauriCommands.setOverlayPosition(
          settings.clockPosition.x,
          settings.clockPosition.y,
        );
      }, 200);
      return;
    }
    if (!wasOverlay.current) return;
    wasOverlay.current = false;
    void TauriCommands.restoreFromOverlay();
  }, [isMinimized, settings.clockSize, overlayMode, settings.minimizeMode]);

  useEffect(() => {
    const handleHydrated = (s: ReturnType<typeof useStore.getState>) => {
      if (hydrationHandled.current) return;
      hydrationHandled.current = true;

      if (s.settings.startMinimized) s.setMinimized(true);

      autostartInitialized.current = true;
      lastAutostart.current = s.settings.autostart;
      const syncId = ++autostartSyncId.current;

      window.setTimeout(() => {
        void TauriCommands.closeSplashscreen();
        if (!s.settings.startMinimized) {
          void TauriCommands.showMainWindow();
        }
      }, 3500);

      if (isTauriApp) {
        void (async () => {
          const enabled = await TauriCommands.getAutostartEnabled().catch(
            () => null,
          );
          if (enabled == null) return;
          if (syncId !== autostartSyncId.current) return;
          const current = useStore.getState().settings.autostart;
          if (enabled !== current)
            useStore.getState().updateSettings({ autostart: enabled });
        })();
      }
    };

    if (useStore.persist.hasHydrated()) {
      handleHydrated(useStore.getState());
    }

    const unsub = useStore.persist.onFinishHydration((s) => {
      handleHydrated(s);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!autostartInitialized.current) return;
    if (lastAutostart.current === settings.autostart) return;
    lastAutostart.current = settings.autostart;
    const syncId = ++autostartSyncId.current;

    void TauriCommands.setAutostart(settings.autostart).catch((e) => {
      if (syncId !== autostartSyncId.current) return;
      lastAutostart.current = !settings.autostart;
      updateSettings({ autostart: !settings.autostart });
      void notify("PoHtimer", `Failed to set autostart: ${String(e)}`);
    });
  }, [settings.autostart, updateSettings, notify]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void TauriCommands.closeSplashscreen();
    }, 3500);
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
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

      void notify(
        "PoHtimer",
        `"${t.label}" will fire in ${t.remaining}s`,
      );
      updateTimer(t.id, { warnedAt: Date.now() });
    }
  }, [settings.notifyBeforeSeconds, timers, updateTimer, notify]);

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
        await notify("PoHtimer", `"${req.label}" completed`, { skipHistory: true });
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
      {uiWarning && (
        <div
          style={{
            position: "fixed",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 410,
            background: "rgba(255,77,77,0.18)",
            border: "1px solid rgba(255,77,77,0.5)",
            color: "var(--danger)",
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            boxShadow: "var(--shadow-md)",
            maxWidth: "min(520px, calc(100vw - 24px))",
            textAlign: "center",
          }}
        >
          {uiWarning}
        </div>
      )}
      {inAppNotices.length > 0 && (
        <div
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 400,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            maxWidth: "min(360px, calc(100vw - 24px))",
          }}
        >
          {inAppNotices.map((n) => (
            <div
              key={n.id}
              onClick={() => dismissInAppNotice(n.id)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                boxShadow: "var(--shadow-md)",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 2,
                }}
              >
                {n.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {n.body}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                Click to dismiss
              </div>
            </div>
          ))}
        </div>
      )}
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
