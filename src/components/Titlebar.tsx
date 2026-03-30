import React from "react";
import { useStore } from "../store";
import { TauriCommands } from "../tauricommands";

export const TitleBar: React.FC<{ onCloseRequest?: () => void }> = ({
  onCloseRequest,
}) => {
  const { timers, setMinimized } = useStore();
  const runningCount = timers.filter((t) => t.status === "running").length;

  const handleMinimize = () => {
    // In Tauri: window.minimize()
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
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--accent-dim)";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border-accent)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--accent)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.borderColor =
              "var(--border)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-muted)";
          }}
        >
          ⊟
        </button>

        {/* Hide to tray */}
        <button
          onClick={() => void TauriCommands.windowMinimize()}
          title="Hide to tray"
          data-tauri-drag-region="false"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#fbd45a",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.2)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        />
        {/* Maximize */}
        <button
          onClick={() => void TauriCommands.windowToggleMaximize()}
          title="Maximize/restore window"
          data-tauri-drag-region="false"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#6fcf62",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.2)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        />
        {/* Close */}
        <button
          onClick={() =>
            onCloseRequest ? onCloseRequest() : void TauriCommands.windowClose()
          }
          title="Close"
          data-tauri-drag-region="false"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#fc615d",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.filter = "brightness(1.2)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
        />
      </div>
    </div>
  );
};
