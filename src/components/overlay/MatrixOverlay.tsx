import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

interface MatrixChar {
  char: string;
  y: number;
  speed: number;
  opacity: number;
}

export const MatrixOverlay: React.FC<OverlayProps> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, settings, updateSettings } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [matrixChars, setMatrixChars] = useState<MatrixChar[]>([]);

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
    const id = setInterval(() => setNow(new Date()), 100);
    return () => clearInterval(id);
  }, []);

  // Matrix rain effect
  useEffect(() => {
    const chars = "0123456789ABCDEF";
    const initialChars: MatrixChar[] = [];
    for (let i = 0; i < 20; i++) {
      initialChars.push({
        char: chars[Math.floor(Math.random() * chars.length)],
        y: Math.random() * size,
        speed: 0.5 + Math.random() * 1.5,
        opacity: Math.random(),
      });
    }
    setMatrixChars(initialChars);

    const id = setInterval(() => {
      setMatrixChars((prev) =>
        prev.map((c) => {
          const nextY = c.y + c.speed;
          const wrapped = nextY > size;
          const nextChar =
            Math.random() > 0.95
              ? chars[Math.floor(Math.random() * chars.length)]
              : c.char;
          return {
            ...c,
            y: wrapped ? -20 : nextY,
            opacity: wrapped ? 1 : c.opacity * 0.98,
            char: nextChar,
          };
        }),
      );
    }, 50);

    return () => clearInterval(id);
  }, [size]);

  const activeTimer = timers.find((t) => t.status === "running");
  const scale = size / 160;

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const hasTimerPanel = activeTimer && settings.digitalWatchStyle !== "minimal";
  const timerPct = activeTimer
    ? 1 - activeTimer.remaining / activeTimer.duration
    : 0;

  return (
    <div
      data-tauri-drag-region
      style={{
        position: "relative",
        width: size,
        height: hasTimerPanel ? size * 1.3 : size * 0.8,
        background: "#000",
        backdropFilter: "blur(10px)",
        border: "1px solid #003300",
        borderRadius: 4 * scale,
        padding: `${12 * scale}px`,
        cursor: "grab",
        userSelect: "none",
        boxShadow: `
          0 0 20px rgba(0,255,0,0.1),
          inset 0 0 40px rgba(0,255,0,0.05)
        `,
        overflow: "hidden",
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
      {/* Matrix rain background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          opacity: 0.15,
          pointerEvents: "none",
        }}
      >
        {matrixChars.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${(i / 20) * 100}%`,
              top: c.y,
              fontFamily: "var(--font-mono)",
              fontSize: 10 * scale,
              color: "#00ff00",
              opacity: c.opacity,
              textShadow: "0 0 5px #00ff00",
            }}
          >
            {c.char}
          </div>
        ))}
      </div>

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
          pointerEvents: "none",
          opacity: 0.5,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8 * scale,
        }}
      >
        {/* Header */}
        <div
          style={{
            fontSize: 6 * scale,
            color: "#00ff00",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.3em",
            textShadow: "0 0 10px #00ff00",
            opacity: 0.7,
          }}
        >
          SYSTEM_TIME
        </div>

        {/* Main time display */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 4 * scale,
            fontFamily: "var(--font-mono)",
          }}
        >
          <span
            style={{
              fontSize: 32 * scale,
              fontWeight: 700,
              color: "#00ff00",
              textShadow: "0 0 20px #00ff00, 0 0 40px #00ff00",
              letterSpacing: "0.05em",
            }}
          >
            {hours}:{minutes}
          </span>
          <span
            style={{
              fontSize: 16 * scale,
              color: "#00cc00",
              textShadow: "0 0 10px #00cc00",
            }}
          >
            :{seconds}
          </span>
        </div>

        {/* Date */}
        <div
          style={{
            fontSize: 8 * scale,
            color: "#00aa00",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.1em",
            border: "1px solid #003300",
            padding: `${2 * scale}px ${8 * scale}px`,
            background: "rgba(0,255,0,0.05)",
          }}
        >
          {now
            .toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .replace(/\//g, ".")}
        </div>

        {/* Timer Panel */}
        {hasTimerPanel && (
          <div
            style={{
              marginTop: 8 * scale,
              padding: `${10 * scale}px ${14 * scale}px`,
              border: `1px solid ${activeTimer.remaining <= 60 ? "#ff0000" : "#00ff00"}`,
              background:
                activeTimer.remaining <= 60
                  ? "rgba(255,0,0,0.1)"
                  : "rgba(0,255,0,0.05)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4 * scale,
              width: "90%",
            }}
          >
            <div
              style={{
                fontSize: 6 * scale,
                color: activeTimer.remaining <= 60 ? "#ff6666" : "#00aa00",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.15em",
              }}
            >
              {activeTimer.label.toUpperCase()}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 14 * scale,
                fontWeight: 700,
                color: activeTimer.remaining <= 60 ? "#ff0000" : "#00ff00",
                textShadow:
                  activeTimer.remaining <= 60
                    ? "0 0 10px #ff0000"
                    : "0 0 10px #00ff00",
              }}
            >
              {String(Math.floor(activeTimer.remaining / 3600)).padStart(
                2,
                "0",
              )}
              :
              {String(Math.floor((activeTimer.remaining % 3600) / 60)).padStart(
                2,
                "0",
              )}
              :{String(activeTimer.remaining % 60).padStart(2, "0")}
            </div>
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: 3 * scale,
                background: "rgba(0,255,0,0.1)",
                marginTop: 4 * scale,
              }}
            >
              <div
                style={{
                  width: `${timerPct * 100}%`,
                  height: "100%",
                  background:
                    activeTimer.remaining <= 60 ? "#ff0000" : "#00ff00",
                  boxShadow: `0 0 10px ${activeTimer.remaining <= 60 ? "#ff0000" : "#00ff00"}`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        )}

        {/* Status indicators */}
        <div
          style={{
            display: "flex",
            gap: 12 * scale,
            marginTop: 4 * scale,
          }}
        >
          {[
            { label: "CPU", active: true },
            { label: "MEM", active: false },
            { label: "NET", active: true },
          ].map(({ label, active }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 2 * scale }}
            >
              <div
                style={{
                  width: 4 * scale,
                  height: 4 * scale,
                  borderRadius: "50%",
                  background: active ? "#00ff00" : "#003300",
                  boxShadow: active ? "0 0 5px #00ff00" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 5 * scale,
                  color: active ? "#00ff00" : "#004400",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 8,
            background: "rgba(0,10,0,0.98)",
            border: "1px solid #00ff00",
            borderRadius: 4,
            padding: "4px",
            zIndex: 999,
            minWidth: 140,
            boxShadow: "0 0 20px rgba(0,255,0,0.3)",
          }}
          data-tauri-drag-region="false"
        >
          {[
            {
              label: "> OPEN_POHTIMER",
              action: () => {
                setMinimized(false);
                setShowMenu(false);
              },
            },
            {
              label: "> SWITCH_MODE",
              action: () => {
                updateSettings({ digitalWatchStyle: "segment" });
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
                borderRadius: 2,
                fontSize: 10,
                background: "none",
                border: "none",
                color: "#00aa00",
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,255,0,0.15)";
                e.currentTarget.style.color = "#00ff00";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "#00aa00";
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
