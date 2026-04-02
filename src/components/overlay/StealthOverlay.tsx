import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

export const StealthOverlay: React.FC<OverlayProps> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, updateSettings } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(1);

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

  // Pulsing glow effect
  useEffect(() => {
    const id = setInterval(() => {
      setGlowIntensity(0.7 + Math.sin(Date.now() / 1000) * 0.3);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find((t) => t.status === "running");
  const cx = size / 2;
  const r = size / 2 - 6;
  const scale = size / 160;

  // Time calculations
  const ms = now.getMilliseconds();
  const s = now.getSeconds() + ms / 1000;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  const hAngle = (h / 12) * 360 - 90;
  const mAngle = (m / 60) * 360 - 90;
  const sAngle = (s / 60) * 360 - 90;

  const toXY = (angle: number, len: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * len,
    y: cx + Math.sin((angle * Math.PI) / 180) * len,
  });

  const hPos = toXY(hAngle, r * 0.55);
  const mPos = toXY(mAngle, r * 0.8);
  const sPos = toXY(sAngle, r * 0.9);

  // Timer
  const timerPct = activeTimer
    ? 1 - activeTimer.remaining / activeTimer.duration
    : 0;

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
          <radialGradient id="stealth-dial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0a0c0f" />
            <stop offset="100%" stopColor="#050608" />
          </radialGradient>

          <filter id="stealth-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="red-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feFlood floodColor="#ff3333" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Case - matte black */}
        <circle cx={cx} cy={cx} r={r + 6} fill="#0d0f12" />
        <circle cx={cx} cy={cx} r={r + 4} fill="#15181c" />

        {/* Bezel - tactical markings */}
        <circle
          cx={cx}
          cy={cx}
          r={r + 2}
          fill="none"
          stroke="#1a1d22"
          strokeWidth={2}
        />

        {/* Dial */}
        <circle cx={cx} cy={cx} r={r} fill="url(#stealth-dial)" />

        {/* Tachymeter scale */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 - 90;
          const start = toXY(angle, r - 2);
          const end = toXY(angle, r - 6);
          return (
            <line
              key={i}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#2a2f35"
              strokeWidth={2}
            />
          );
        })}

        {/* Hour markers - minimal triangles */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * 360 - 90;
          const pos = toXY(angle, r - 12);
          const isCardinal = i % 3 === 0;
          const size_marker = (isCardinal ? 4 : 2) * scale;

          return (
            <g key={i}>
              <polygon
                points={`${pos.x},${pos.y - size_marker} ${pos.x - size_marker * 0.6},${pos.y + size_marker * 0.4} ${pos.x + size_marker * 0.6},${pos.y + size_marker * 0.4}`}
                fill={isCardinal ? "#ff3333" : "#3a4149"}
                transform={`rotate(${angle + 90} ${pos.x} ${pos.y})`}
                filter={isCardinal ? "url(#red-glow)" : undefined}
              />
            </g>
          );
        })}

        {/* 24-hour military scale */}
        <text
          x={cx}
          y={cx - r * 0.3}
          textAnchor="middle"
          fontSize={6 * scale}
          fill="#3a4149"
          fontFamily="var(--font-mono)"
          letterSpacing="0.3em"
        >
          TACTICAL
        </text>

        {/* Timer ring */}
        {activeTimer && (
          <g>
            {/* Background track */}
            <circle
              cx={cx}
              cy={cx}
              r={r - 18}
              fill="none"
              stroke="#1a1d22"
              strokeWidth={4}
            />
            {/* Progress */}
            <circle
              cx={cx}
              cy={cx}
              r={r - 18}
              fill="none"
              stroke={activeTimer.remaining <= 60 ? "#ff3333" : "#ff6600"}
              strokeWidth={4}
              strokeDasharray={`${2 * Math.PI * (r - 18) * timerPct} ${2 * Math.PI * (r - 18)}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cx})`}
              filter="url(#red-glow)"
              style={{ transition: "stroke-dasharray 0.5s ease" }}
            />
          </g>
        )}

        {/* Hour hand - broad sword */}
        <g filter="url(#stealth-glow)">
          <path
            d={`M ${cx} ${cx} L ${toXY(hAngle + 15, r * 0.15).x} ${toXY(hAngle + 15, r * 0.15).y} L ${hPos.x} ${hPos.y} L ${toXY(hAngle - 15, r * 0.15).x} ${toXY(hAngle - 15, r * 0.15).y} Z`}
            fill="#2a2f35"
            stroke="#3a4149"
            strokeWidth={1}
          />
          <line
            x1={cx}
            y1={cx}
            x2={hPos.x}
            y2={hPos.y}
            stroke="#4a5568"
            strokeWidth={2}
          />
        </g>

        {/* Minute hand - broad sword */}
        <g filter="url(#stealth-glow)">
          <path
            d={`M ${cx} ${cx} L ${toXY(mAngle + 10, r * 0.15).x} ${toXY(mAngle + 10, r * 0.15).y} L ${mPos.x} ${mPos.y} L ${toXY(mAngle - 10, r * 0.15).x} ${toXY(mAngle - 10, r * 0.15).y} Z`}
            fill="#2a2f35"
            stroke="#3a4149"
            strokeWidth={1}
          />
          <line
            x1={cx}
            y1={cx}
            x2={mPos.x}
            y2={mPos.y}
            stroke="#4a5568"
            strokeWidth={1.5}
          />
        </g>

        {/* Second hand - tactical red */}
        <g filter="url(#red-glow)">
          <line
            x1={cx}
            y1={cx + r * 0.25}
            x2={sPos.x}
            y2={sPos.y}
            stroke="#ff3333"
            strokeWidth={1.5}
            opacity={glowIntensity}
          />
          <circle cx={sPos.x} cy={sPos.y} r={2.5 * scale} fill="#ff3333" />
        </g>

        {/* Center - target reticle */}
        <g>
          <circle
            cx={cx}
            cy={cx}
            r={8 * scale}
            fill="none"
            stroke="#2a2f35"
            strokeWidth={2}
          />
          <circle cx={cx} cy={cx} r={6 * scale} fill="#0d0f12" />
          <circle
            cx={cx}
            cy={cx}
            r={2 * scale}
            fill="#ff3333"
            filter="url(#red-glow)"
            opacity={glowIntensity}
          />
          {/* Crosshair */}
          <line
            x1={cx - 4 * scale}
            y1={cx}
            x2={cx + 4 * scale}
            y2={cx}
            stroke="#2a2f35"
            strokeWidth={1}
          />
          <line
            x1={cx}
            y1={cx - 4 * scale}
            x2={cx}
            y2={cx + 4 * scale}
            stroke="#2a2f35"
            strokeWidth={1}
          />
        </g>

        {/* Digital time overlay */}
        <text
          x={cx}
          y={cx + r * 0.4}
          textAnchor="middle"
          fontSize={8 * scale}
          fill="#3a4149"
          fontFamily="var(--font-mono)"
          letterSpacing="0.1em"
        >
          {now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })}
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
            background: "rgba(10,12,16,0.98)",
            border: "1px solid rgba(255,51,51,0.2)",
            borderRadius: 8,
            padding: "4px",
            zIndex: 999,
            minWidth: 140,
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
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
              label: "Switch to Classic",
              action: () => {
                updateSettings({ analogWatchStyle: "classic" });
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
                color: "rgba(240,242,245,0.6)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,51,51,0.15)";
                e.currentTarget.style.color = "#ff6666";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "rgba(240,242,245,0.6)";
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
