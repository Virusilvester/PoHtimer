import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

export const SwissOverlay: React.FC<OverlayProps> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, updateSettings } = useStore();
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
    const id = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find((t) => t.status === "running");
  const cx = size / 2;
  const r = size / 2 - 8;
  const scale = size / 160;

  // Time calculations with smooth movement
  const ms = now.getMilliseconds();
  const s = now.getSeconds() + ms / 1000;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  // Angles
  const hAngle = (h / 12) * 360 - 90;
  const mAngle = (m / 60) * 360 - 90;
  const sAngle = (s / 60) * 360 - 90;

  // Hand positions
  const toXY = (angle: number, len: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * len,
    y: cx + Math.sin((angle * Math.PI) / 180) * len,
  });

  const hPos = toXY(hAngle, r * 0.5);
  const mPos = toXY(mAngle, r * 0.75);
  const sPos = toXY(sAngle, r * 0.9);

  // Timer arc
  const timerPct = activeTimer
    ? 1 - activeTimer.remaining / activeTimer.duration
    : 0;
  const timerAngle = timerPct * 360;
  const timerR = r - 6;

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
      <svg width={size} height={size}>
        <defs>
          {/* Dial gradients */}
          <radialGradient id="swiss-dial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f8f9fa" />
            <stop offset="85%" stopColor="#e9ecef" />
            <stop offset="100%" stopColor="#dee2e6" />
          </radialGradient>
          <radialGradient id="swiss-dial-dark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a1d21" />
            <stop offset="100%" stopColor="#0d0f12" />
          </radialGradient>

          {/* Metallic finishes */}
          <linearGradient id="silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8f9fa" />
            <stop offset="50%" stopColor="#adb5bd" />
            <stop offset="100%" stopColor="#6c757d" />
          </linearGradient>

          <linearGradient id="rose-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f4c2c2" />
            <stop offset="50%" stopColor="#d4a5a5" />
            <stop offset="100%" stopColor="#b5838d" />
          </linearGradient>

          <filter id="swiss-shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Case */}
        <circle cx={cx} cy={cx} r={r + 4} fill="url(#silver)" />
        <circle cx={cx} cy={cx} r={r + 2} fill="#495057" />

        {/* Dial */}
        <circle cx={cx} cy={cx} r={r} fill="url(#swiss-dial-dark)" />

        {/* Minute track */}
        <circle
          cx={cx}
          cy={cx}
          r={r - 4}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />

        {/* Minute markers */}
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i / 60) * 360 - 90;
          const isHour = i % 5 === 0;
          const innerR = r - (isHour ? 8 : 5);
          const outerR = r - 4;
          const start = toXY(angle, innerR);
          const end = toXY(angle, outerR);
          return (
            <line
              key={i}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke={
                isHour ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"
              }
              strokeWidth={isHour ? 2 : 1}
            />
          );
        })}

        {/* Hour markers - applied indices */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 - 90;
          const pos = toXY(angle, r - 15);
          const isCardinal = i % 3 === 0;
          return (
            <g key={i}>
              <rect
                x={pos.x - (isCardinal ? 4 : 2) * scale}
                y={pos.y - (isCardinal ? 12 : 6) * scale}
                width={(isCardinal ? 8 : 4) * scale}
                height={(isCardinal ? 24 : 12) * scale}
                fill="rgba(255,255,255,0.9)"
                rx={1}
                transform={`rotate(${angle + 90} ${pos.x} ${pos.y})`}
                filter="url(#swiss-shadow)"
              />
            </g>
          );
        })}

        {/* Brand text */}
        <text
          x={cx}
          y={cx - r * 0.35}
          textAnchor="middle"
          fontSize={10 * scale}
          fill="rgba(255,255,255,0.8)"
          fontWeight={300}
          letterSpacing="0.2em"
        >
          POHTIMER
        </text>
        <text
          x={cx}
          y={cx - r * 0.25}
          textAnchor="middle"
          fontSize={6 * scale}
          fill="rgba(255,255,255,0.4)"
          letterSpacing="0.1em"
        >
          AUTOMATIC
        </text>

        {/* Timer arc */}
        {activeTimer && (
          <>
            <circle
              cx={cx}
              cy={cx}
              r={timerR}
              fill="none"
              stroke="rgba(255,140,0,0.15)"
              strokeWidth={3}
            />
            <path
              d={`M ${cx} ${cx - timerR} A ${timerR} ${timerR} 0 ${timerPct > 0.5 ? 1 : 0} 1 ${toXY(timerAngle - 90, timerR).x} ${toXY(timerAngle - 90, timerR).y}`}
              fill="none"
              stroke={activeTimer.remaining <= 60 ? "#ff4d4d" : "#ff8c00"}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </>
        )}

        {/* Hour hand - dauphine style */}
        <g filter="url(#swiss-shadow)">
          <path
            d={`M ${cx} ${cx} L ${hPos.x} ${hPos.y}`}
            stroke="url(#silver)"
            strokeWidth={4 * scale}
            strokeLinecap="round"
          />
          <path
            d={`M ${cx} ${cx} L ${toXY(hAngle, r * 0.35).x} ${toXY(hAngle, r * 0.35).y}`}
            stroke="url(#silver)"
            strokeWidth={6 * scale}
            strokeLinecap="round"
          />
        </g>

        {/* Minute hand - dauphine style */}
        <g filter="url(#swiss-shadow)">
          <path
            d={`M ${cx} ${cx} L ${mPos.x} ${mPos.y}`}
            stroke="url(#silver)"
            strokeWidth={3 * scale}
            strokeLinecap="round"
          />
          <path
            d={`M ${cx} ${cx} L ${toXY(mAngle, r * 0.6).x} ${toXY(mAngle, r * 0.6).y}`}
            stroke="url(#silver)"
            strokeWidth={5 * scale}
            strokeLinecap="round"
          />
        </g>

        {/* Second hand - needle style */}
        <g>
          <line
            x1={cx}
            y1={cx + r * 0.2}
            x2={sPos.x}
            y2={sPos.y}
            stroke="#ff4d4d"
            strokeWidth={1}
          />
          <circle cx={sPos.x} cy={sPos.y} r={2 * scale} fill="#ff4d4d" />
        </g>

        {/* Center cap */}
        <circle cx={cx} cy={cx} r={5 * scale} fill="url(#silver)" />
        <circle cx={cx} cy={cx} r={3 * scale} fill="#343a40" />
        <circle cx={cx} cy={cx} r={1.5 * scale} fill="#ff4d4d" />

        {/* Date window */}
        <rect
          x={cx + r * 0.55}
          y={cx - 8 * scale}
          width={24 * scale}
          height={16 * scale}
          fill="#0d0f12"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
          rx={2}
        />
        <text
          x={cx + r * 0.55 + 12 * scale}
          y={cx + 2 * scale}
          textAnchor="middle"
          fontSize={9 * scale}
          fill="rgba(255,255,255,0.8)"
          fontFamily="var(--font-mono)"
        >
          {String(now.getDate()).padStart(2, "0")}
        </text>
      </svg>

      {/* Context Menu */}
      {showMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 8,
            background: "rgba(24,28,36,0.98)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            padding: "4px",
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
              label: "Switch to Stealth",
              action: () => {
                updateSettings({ analogWatchStyle: "stealth" });
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
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,185,0,0.15)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "rgba(240,242,245,0.7)";
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
