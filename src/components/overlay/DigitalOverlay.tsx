import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

export const DigitalOverlay: React.FC<OverlayProps> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, settings, updateSettings } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('[data-tauri-drag-region="false"]')) return;
    void TauriCommands.startDragging();
  };

  const persistPosition = useCallback(async () => {
    try {
      const [x, y] = await TauriCommands.getWindowPosition();
      updateSettings({ clockPosition: { x, y } });
    } catch {
      // ignore
    }
  }, [updateSettings]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find((t) => t.status === "running");
  const scale = size / 160;
  const style = settings.digitalWatchStyle;
  const hasTimerPanel = activeTimer && style !== "minimal";
  const containerStyle =
    style === "minimal"
      ? {
          background: "transparent",
          border: "none",
          boxShadow: "none",
          padding: 6 * scale,
        }
      : style === "panel"
        ? {
            background: "rgba(14,18,26,0.9)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.65)",
            padding: 12 * scale,
          }
        : {
            background: "rgba(10,12,16,0.85)",
            border: "1px solid var(--border-accent)",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.6), 0 0 20px var(--accent-shadow)",
            padding: 14 * scale,
          };

  return (
    <div
      data-tauri-drag-region
      style={{
        position: "relative",
        width: size,
        height: hasTimerPanel ? size * 1.1 : size * 0.65,
        background: containerStyle.background,
        backdropFilter: style === "minimal" ? "none" : "blur(12px)",
        border: containerStyle.border,
        borderRadius: 16 * scale,
        padding: containerStyle.padding,
        cursor: "grab",
        userSelect: "none",
        boxShadow: containerStyle.boxShadow,
        transition: "height 0.3s ease",
      }}
      onMouseDown={handleDragStart}
      onMouseUp={() => void persistPosition()}
      onTouchEnd={() => void persistPosition()}
      onDoubleClick={() => {
        void persistPosition();
        setMinimized(false);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(!showMenu);
      }}
    >
      {/* Time */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 32 * scale,
          fontWeight: 700,
          color: "var(--accent)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          textShadow: "0 0 20px var(--accent-glow-strong)",
          textAlign: "center",
        }}
      >
        {now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })}
        <span
          style={{
            fontSize: 18 * scale,
            color: "var(--accent-strong)",
            marginLeft: 2,
          }}
        >
          {String(now.getSeconds()).padStart(2, "0")}
        </span>
      </div>

      <div
        style={{
          fontSize: 9 * scale,
          color: "rgba(240,242,245,0.4)",
          textAlign: "center",
          marginTop: 3 * scale,
          letterSpacing: "0.05em",
        }}
      >
        {now
          .toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
          .toUpperCase()}
      </div>

      {/* Active timer countdown */}
      {hasTimerPanel && (
        <div
          style={{
            marginTop: 8 * scale,
            padding: `${6 * scale}px ${8 * scale}px`,
            background: "var(--accent-dim)",
            border: "1px solid var(--border-accent)",
            borderRadius: 8 * scale,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 8 * scale,
              color: "rgba(240,242,245,0.4)",
              letterSpacing: "0.05em",
            }}
          >
            TIMER
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 18 * scale,
              fontWeight: 700,
              color: activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)",
              letterSpacing: "-0.01em",
            }}
          >
            {String(Math.floor(activeTimer.remaining / 3600)).padStart(2, "0")}:
            {String(Math.floor((activeTimer.remaining % 3600) / 60)).padStart(
              2,
              "0",
            )}
            :{String(activeTimer.remaining % 60).padStart(2, "0")}
          </div>
          <div
            style={{
              fontSize: 8 * scale,
              color: "rgba(240,242,245,0.35)",
              marginTop: 1,
            }}
          >
            {activeTimer.label}
          </div>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "rgba(24,28,36,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "4px",
            zIndex: 999,
            minWidth: 140,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          }}
          data-tauri-drag-region="false"
        >
          {[
            {
              label: "Open PoHtimer",
              action: () => {
                setMinimized(false);
                setShowMenu(false);
              },
            },
            {
              label: "Switch to Analog",
              action: () => {
                updateSettings({ minimizeMode: "analog" });
                setShowMenu(false);
              },
            },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              data-tauri-drag-region="false"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "7px 10px",
                borderRadius: 5,
                fontSize: 11,
                background: "none",
                border: "none",
                color: "rgba(240,242,245,0.7)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--accent-dim)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
