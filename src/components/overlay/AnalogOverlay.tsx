import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

export const AnalogOverlay: React.FC<OverlayProps> = ({ size }) => {
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
  const cx = size / 2;
  const r = size / 2 - 4;

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  const hAngle = ((h + m / 60) / 12) * 360 - 90;
  const mAngle = ((m + s / 60) / 60) * 360 - 90;
  const sAngle = (s / 60) * 360 - 90;

  const toXY = (angle: number, len: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * len,
    y: cx + Math.sin((angle * Math.PI) / 180) * len,
  });

  const hPos = toXY(hAngle, r * 0.55);
  const mPos = toXY(mAngle, r * 0.75);
  const sPos = toXY(sAngle, r * 0.85);

  // Timer progress arc
  const timerPct = activeTimer
    ? 1 - activeTimer.remaining / activeTimer.duration
    : 0;
  const timerAngle = timerPct * 360;
  const timerR = r - 6;
  const timerStart = toXY(-90, timerR);
  const timerEnd = toXY(-90 + timerAngle, timerR);
  const largeArc = timerAngle > 180 ? 1 : 0;
  const style = settings.analogWatchStyle;

  return (
    <div
      data-tauri-drag-region
      style={{
        position: "relative",
        width: size,
        height: size,
        cursor: "grab",
        userSelect: "none",
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
      <div
        data-tauri-drag-region
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          width: 56,
          height: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "grab",
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 36,
            height: 3,
            borderRadius: 999,
            background: "rgba(240,242,245,0.14)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      </div>

      <svg width={size} height={size}>
        {/* Background */}
        <defs>
          <linearGradient id="halo-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,185,0,0.2)" />
            <stop offset="45%" stopColor="rgba(59,158,255,0.5)" />
            <stop offset="100%" stopColor="rgba(0,217,126,0.35)" />
          </linearGradient>
          <radialGradient id="halo-fill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(18,22,30,0.9)" />
            <stop offset="100%" stopColor="rgba(8,10,14,0.7)" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill={
            style === "minimal"
              ? "rgba(10,12,16,0.35)"
              : style === "halo"
                ? "url(#halo-fill)"
                : "rgba(10,12,16,0.85)"
          }
        />
        {style !== "minimal" && (
          <circle
            cx={cx}
            cy={cx}
            r={r}
            fill="none"
            stroke={
              style === "neon"
                ? "var(--accent-strong)"
                : style === "halo"
                  ? "url(#halo-ring)"
                  : "var(--border-accent)"
            }
            strokeWidth={style === "neon" ? 2.2 : style === "halo" ? 2 : 1.5}
          />
        )}

        {/* Timer arc */}
        {activeTimer && timerAngle > 0 && style !== "minimal" && (
          <path
            d={`M ${timerStart.x} ${timerStart.y} A ${timerR} ${timerR} 0 ${largeArc} 1 ${timerEnd.x} ${timerEnd.y}`}
            fill="none"
            stroke={
              activeTimer.remaining <= 60
                ? "#ff8c00"
                : style === "halo"
                  ? "rgba(255,185,0,0.85)"
                  : "var(--accent)"
            }
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Hour markers */}
        {style !== "minimal" &&
          Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * 360 - 90;
            const inner = toXY(a, r - 8);
            const outer = toXY(a, r - 3);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={
                  i === 0 || i % 3 === 0
                    ? style === "neon"
                      ? "var(--accent)"
                      : style === "halo"
                        ? "rgba(240,242,245,0.6)"
                      : "var(--accent-strong)"
                    : "rgba(255,255,255,0.15)"
                }
                strokeWidth={i % 3 === 0 ? 1.5 : 0.5}
              />
            );
          })}

        {/* Hour hand */}
        <line
          x1={cx}
          y1={cx}
          x2={hPos.x}
          y2={hPos.y}
          stroke="#f0f2f5"
          strokeWidth={style === "neon" ? 3.5 : 3}
          strokeLinecap="round"
          filter="url(#glow)"
        />
        {/* Minute hand */}
        <line
          x1={cx}
          y1={cx}
          x2={mPos.x}
          y2={mPos.y}
          stroke="var(--accent)"
          strokeWidth={style === "neon" ? 2.6 : 2}
          strokeLinecap="round"
          filter="url(#glow)"
        />
        {/* Second hand */}
        <line
          x1={cx}
          y1={cx}
          x2={sPos.x}
          y2={sPos.y}
          stroke={style === "neon" ? "#ff6b6b" : "#ff4d4d"}
          strokeWidth={style === "neon" ? 1.5 : 1}
          strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cx} r={3} fill="var(--accent)" />
        <circle cx={cx} cy={cx} r={1.5} fill="#0a0c10" />
      </svg>

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
            padding: 4,
            zIndex: 999,
            minWidth: 140,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
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
              label: "Switch to Digital",
              action: () => {
                updateSettings({ minimizeMode: "digital" });
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
