import React from "react";
import { useStore } from "../store";
import { TauriCommands } from "../tauricommands";

// Injected once — avoids duplicating <style> on every render
let _styleInjected = false;
function injectTitlebarStyles() {
  if (_styleInjected || typeof document === "undefined") return;
  _styleInjected = true;
  const el = document.createElement("style");
  el.textContent = `
    .titlebar-overlay-btn {
      width: 26px; height: 26px; border-radius: 6px;
      background: transparent; border: 1px solid var(--border);
      color: var(--text-muted); cursor: pointer; font-size: 12px;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .titlebar-overlay-btn:hover {
      background: var(--accent-dim);
      border-color: var(--border-accent);
      color: var(--accent);
    }
    .titlebar-traffic-btn {
      width: 12px; height: 12px; border-radius: 50%;
      border: none; cursor: pointer; transition: filter 0.15s;
    }
    .titlebar-traffic-btn:hover { filter: brightness(1.2); }
  `;
  document.head.appendChild(el);
}

export const TitleBar: React.FC<{ onCloseRequest?: () => void }> = ({
  onCloseRequest,
}) => {
  injectTitlebarStyles();

  const { timers, setMinimized } = useStore();
  const runningCount = timers.filter((t) => t.status === "running").length;

  const handleMinimize = () => {
    setMinimized(true);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('[data-tauri-drag-region="false"]')) return;
    void TauriCommands.startDragging();
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleDragStart}
      style={{
        height: 40,
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px 0 20px",
        flexShrink: 0,
        userSelect: "none",
      }}
    >
      {/* Left: App info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 14,
            letterSpacing: "0.04em",
            color: "var(--text-muted)",
          }}
        >
          POH<span style={{ color: "var(--accent)" }}>TIMER</span>
        </span>
        {runningCount > 0 && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "var(--success)15",
              border: "1px solid var(--success)30",
              borderRadius: 10,
              padding: "1px 8px",
              fontSize: 10,
              color: "var(--success)",
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--success)",
                animation: "pulse-ring 1.5s infinite",
                display: "inline-block",
              }}
            />
            {runningCount} running
          </span>
        )}
      </div>

      {/* Right: Window controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Overlay button */}
        <button
          onClick={handleMinimize}
          title="Minimize to desktop overlay"
          data-tauri-drag-region="false"
          className="titlebar-overlay-btn"
        >
          ⊟
        </button>

        {/* macOS-style traffic lights */}
        <button
          onClick={() => void TauriCommands.windowMinimize()}
          title="Hide to tray"
          data-tauri-drag-region="false"
          className="titlebar-traffic-btn"
          style={{ background: "#fbd45a" }}
        />
        <button
          onClick={() => void TauriCommands.windowToggleMaximize()}
          title="Maximize/restore window"
          data-tauri-drag-region="false"
          className="titlebar-traffic-btn"
          style={{ background: "#6fcf62" }}
        />
        <button
          onClick={() =>
            onCloseRequest ? onCloseRequest() : void TauriCommands.windowClose()
          }
          title="Close"
          data-tauri-drag-region="false"
          className="titlebar-traffic-btn"
          style={{ background: "#fc615d" }}
        />
      </div>
    </div>
  );
};
