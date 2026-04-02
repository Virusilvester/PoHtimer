import React, { useEffect } from "react";
import { useStore } from "../store";
import { TauriCommands } from "../tauricommands";
import { Card, Toggle, Slider, SectionHeader } from "./ui";

const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
}> = ({ label, description, control }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 0",
      borderBottom: "1px solid var(--border)",
    }}
  >
    <div style={{ flex: 1 }}>
      <div
        style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}
      >
        {label}
      </div>
      {description && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{control}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card style={{ padding: "20px", marginBottom: 16 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--accent)",
        letterSpacing: "0.08em",
        marginBottom: 4,
      }}
    >
      {title}
    </div>
    {children}
  </Card>
);

export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useStore();
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const enabled = await TauriCommands.getAutostartEnabled().catch(
        () => null,
      );
      if (!mounted || enabled == null) return;
      if (enabled !== settings.autostart) {
        updateSettings({ autostart: enabled });
      }
    })();
    return () => {
      mounted = false;
    };
  }, [updateSettings]);

  const renderDigitalPreview = (style: typeof settings.digitalWatchStyle) => {
    const baseStyle: React.CSSProperties = {
      width: 70,
      height: 44,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontFamily: "var(--font-mono)",
      letterSpacing: "0.06em",
      position: "relative",
      overflow: "hidden",
    };

    if (style === "minimal") {
      return (
        <div
          style={{
            ...baseStyle,
            border: "1px dashed rgba(255,255,255,0.18)",
            color: "rgba(240,242,245,0.5)",
          }}
        >
          12:34
        </div>
      );
    }
    if (style === "glass") {
      return (
        <div
          style={{
            ...baseStyle,
            background: "rgba(10,12,16,0.65)",
            border: "1px solid rgba(255,185,0,0.35)",
            color: "var(--accent)",
            boxShadow: "0 0 12px rgba(255,185,0,0.25)",
          }}
        >
          12:34
        </div>
      );
    }
    if (style === "panel") {
      return (
        <div
          style={{
            ...baseStyle,
            background: "rgba(20,24,32,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(240,242,245,0.85)",
          }}
        >
          12:34
        </div>
      );
    }
    if (style === "edge") {
      return (
        <div
          style={{
            ...baseStyle,
            background: "rgba(8,10,14,0.9)",
            border: "1px solid rgba(255,255,255,0.22)",
            color: "rgba(240,242,245,0.85)",
          }}
        >
          12:34
        </div>
      );
    }
    if (style === "matrix") {
      return (
        <div
          style={{
            ...baseStyle,
            background: "#000",
            border: "1px solid #003300",
            color: "#00ff00",
            textShadow: "0 0 8px #00ff00",
          }}
        >
          12:34
        </div>
      );
    }
    if (style === "segment") {
      return (
        <div
          style={{
            ...baseStyle,
            background: "linear-gradient(145deg, #0d1016, #080a0e)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--accent)",
            boxShadow: "inset 0 0 8px rgba(255,185,0,0.25)",
          }}
        >
          88:88
        </div>
      );
    }
    return (
      <div
        style={{
          ...baseStyle,
          background: "rgba(14,18,26,0.95)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "var(--accent)",
        }}
      >
        12:34
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            borderBottom: "1px solid rgba(0,0,0,0.5)",
            opacity: 0.6,
          }}
        />
      </div>
    );
  };

  const renderAnalogPreview = (style: typeof settings.analogWatchStyle) => {
    const stroke =
      style === "neon"
        ? "var(--accent-strong)"
        : style === "halo"
          ? "rgba(255,185,0,0.6)"
          : "rgba(255,255,255,0.25)";
    const fill =
      style === "minimal"
        ? "rgba(10,12,16,0.35)"
        : style === "stealth"
          ? "#0d0f12"
          : style === "swiss"
            ? "rgba(15,18,24,0.95)"
            : "rgba(10,12,16,0.75)";
    return (
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: fill,
          border: `1px solid ${stroke}`,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 2,
            height: 14,
            background: "var(--accent)",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 14,
            height: 2,
            background: "rgba(255,255,255,0.7)",
            top: "50%",
            left: 10,
            borderRadius: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: "var(--accent)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
          }}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <SectionHeader
        title="Settings"
        subtitle="Customize PoHtimer behavior and appearance"
      />

      {/* Appearance */}
      <Section title="APPEARANCE">
        <SettingRow
          label="Theme"
          description="Application color scheme"
          control={
            <div style={{ display: "flex", gap: 6 }}>
              {(["dark", "midnight", "amber"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    background:
                      settings.theme === t
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.theme === t ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.theme === t
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <SettingRow
          label="Accent Color"
          description="Highlight color throughout the app"
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[
                "#ffb900",
                "#3b9eff",
                "#00d97e",
                "#ff4d4d",
                "#9b7fe8",
                "#ff6b35",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => updateSettings({ accentColor: c })}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: c,
                    border: `2px solid ${settings.accentColor === c ? "white" : "transparent"}`,
                    cursor: "pointer",
                    transition: "border 0.15s",
                  }}
                />
              ))}
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) =>
                  updateSettings({ accentColor: e.target.value })
                }
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            </div>
          }
        />
      </Section>

      {/* Overlay */}
      <Section title="DESKTOP OVERLAY">
        <SettingRow
          label="Clock Mode"
          description="Style when minimized to desktop overlay"
          control={
            <div style={{ display: "flex", gap: 6 }}>
              {(["digital", "analog"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => updateSettings({ minimizeMode: m })}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    background:
                      settings.minimizeMode === m
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.minimizeMode === m ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.minimizeMode === m
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        />
        <div
          style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}
        >
          <Slider
            label="Overlay size"
            min={100}
            max={300}
            step={10}
            value={settings.clockSize}
            onChange={(v) => updateSettings({ clockSize: v })}
            format={(v) => `${v}px`}
          />
        </div>
        <SettingRow
          label="Digital watch style"
          description="Choose a digital overlay theme"
          control={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  "minimal",
                  "glass",
                  "panel",
                  "edge",
                  "matrix",
                  "segment",
                  "flip",
                ] as const
              ).map((v) => (
                <button
                  key={v}
                  onClick={() => updateSettings({ digitalWatchStyle: v })}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    cursor: "pointer",
                    background:
                      settings.digitalWatchStyle === v
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.digitalWatchStyle === v ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.digitalWatchStyle === v
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {renderDigitalPreview(v)}
                  <span style={{ textTransform: "capitalize" }}>{v}</span>
                </button>
              ))}
            </div>
          }
        />
        <SettingRow
          label="Analog watch style"
          description="Choose an analog overlay theme"
          control={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(
                [
                  "classic",
                  "neon",
                  "minimal",
                  "halo",
                  "swiss",
                  "stealth",
                  "orbital",
                ] as const
              ).map((v) => (
                <button
                  key={v}
                  onClick={() => updateSettings({ analogWatchStyle: v })}
                  style={{
                    padding: "6px 8px",
                    borderRadius: 6,
                    fontSize: 10,
                    cursor: "pointer",
                    background:
                      settings.analogWatchStyle === v
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.analogWatchStyle === v ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.analogWatchStyle === v
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  {renderAnalogPreview(v)}
                  <span style={{ textTransform: "capitalize" }}>{v}</span>
                </button>
              ))}
            </div>
          }
        />
      </Section>

      {/* Notifications */}
      <Section title="NOTIFICATIONS">
        <SettingRow
          label="Notify before action"
          description="Show notification before power action fires"
          control={
            <Toggle
              checked={settings.notifyBeforeSeconds > 0}
              onChange={(v) =>
                updateSettings({ notifyBeforeSeconds: v ? 30 : 0 })
              }
            />
          }
        />
        {settings.notifyBeforeSeconds > 0 && (
          <div
            style={{
              padding: "14px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Slider
              label="Warning lead time"
              min={5}
              max={120}
              step={5}
              value={settings.notifyBeforeSeconds}
              onChange={(v) => updateSettings({ notifyBeforeSeconds: v })}
              format={(v) => `${v}s before`}
            />
          </div>
        )}
        <SettingRow
          label="Confirm before action"
          description="Show 5-second countdown with cancel option"
          control={
            <Toggle
              checked={settings.confirmBeforeAction}
              onChange={(v) => updateSettings({ confirmBeforeAction: v })}
            />
          }
        />
      </Section>

      {/* Startup */}
      <Section title="STARTUP & SYSTEM">
        <SettingRow
          label="Start with Windows"
          description="Launch PoHtimer automatically at login"
          control={
            <Toggle
              checked={settings.autostart}
              onChange={(v) => updateSettings({ autostart: v })}
            />
          }
        />
        <SettingRow
          label="Start minimized"
          description="Open as desktop overlay on startup"
          control={
            <Toggle
              checked={settings.startMinimized}
              onChange={(v) => updateSettings({ startMinimized: v })}
            />
          }
        />
        <SettingRow
          label="Ask before closing"
          description="Prompt to exit or minimize to tray"
          control={
            <Toggle
              checked={settings.askBeforeClose}
              onChange={(v) => updateSettings({ askBeforeClose: v })}
            />
          }
        />
        <SettingRow
          label="Default close action"
          description="Used when 'Ask before closing' is off"
          control={
            <div style={{ display: "flex", gap: 6 }}>
              {(["minimize", "exit"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => updateSettings({ closeAction: v })}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    background:
                      settings.closeAction === v
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.closeAction === v ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.closeAction === v
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {v === "minimize" ? "Minimize" : "Exit"}
                </button>
              ))}
            </div>
          }
        />
      </Section>

      {/* About */}
      <Card style={{ padding: "20px", textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--accent)",
            color: "#0a0c10",
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 0 20px var(--accent-glow)",
          }}
        >
          ◷
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          POH<span style={{ color: "var(--accent)" }}>TIMER</span>
        </div>
        <div
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}
        >
          Version 0.1.3 · Built with Tauri 2 + React
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Power Scheduling Utility for Windows
        </div>
      </Card>
    </div>
  );
};
