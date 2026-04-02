import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

export const OrbitalOverlay: React.FC<OverlayProps> = ({ size }) => {
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
    const id = setInterval(() => setNow(new Date()), 100);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find((t) => t.status === "running");
  const cx = size / 2;
  const cy = size / 2;

  // Time calculations
  const ms = now.getMilliseconds();
  const s = now.getSeconds() + ms / 1000;
  const m = now.getMinutes() + s / 60;
  const h = (now.getHours() % 12) + m / 60;

  // Orbital radii
  const orbit1 = size * 0.18; // Hours
  const orbit2 = size * 0.28; // Minutes
  const orbit3 = size * 0.38; // Seconds

  // Calculate positions
  const hourAngle = (h / 12) * Math.PI * 2 - Math.PI / 2;
  const minAngle = (m / 60) * Math.PI * 2 - Math.PI / 2;
  const secAngle = (s / 60) * Math.PI * 2 - Math.PI / 2;

  const hourPos = {
    x: cx + Math.cos(hourAngle) * orbit1,
    y: cy + Math.sin(hourAngle) * orbit1,
  };
  const minPos = {
    x: cx + Math.cos(minAngle) * orbit2,
    y: cy + Math.sin(minAngle) * orbit2,
  };
  const secPos = {
    x: cx + Math.cos(secAngle) * orbit3,
    y: cy + Math.sin(secAngle) * orbit3,
  };

  // Timer progress
  const timerPct = activeTimer
    ? 1 - activeTimer.remaining / activeTimer.duration
    : 0;
  const timerAngle = timerPct * Math.PI * 2 - Math.PI / 2;
  const timerOrbit = size * 0.45;
  const timerPos = {
    x: cx + Math.cos(timerAngle) * timerOrbit,
    y: cy + Math.sin(timerAngle) * timerOrbit,
  };

  const scale = size / 160;

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
          <radialGradient id="orbital-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f1419" />
            <stop offset="100%" stopColor="#05070a" />
          </radialGradient>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,185,0,0.8)" />
            <stop offset="40%" stopColor="rgba(255,140,0,0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="orbital-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background */}
        <circle cx={cx} cy={cy} r={size * 0.48} fill="url(#orbital-bg)" />

        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.46}
          fill="none"
          stroke="rgba(255,185,0,0.15)"
          strokeWidth={1}
        />

        {/* Orbit rings */}
        {[orbit1, orbit2, orbit3].map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`rgba(255,255,255,${0.05 + i * 0.03})`}
            strokeWidth={1}
            strokeDasharray={`${(Math.PI * r) / 12} ${(Math.PI * r) / 24}`}
          />
        ))}

        {/* Timer orbit (if active) */}
        {activeTimer && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={timerOrbit}
              fill="none"
              stroke="rgba(255,140,0,0.2)"
              strokeWidth={2}
            />
            {/* Timer progress arc */}
            <path
              d={`M ${cx} ${cy - timerOrbit} A ${timerOrbit} ${timerOrbit} 0 ${timerPct > 0.5 ? 1 : 0} 1 ${timerPos.x} ${timerPos.y}`}
              fill="none"
              stroke={activeTimer.remaining <= 60 ? "#ff4d4d" : "#ff8c00"}
              strokeWidth={3}
              strokeLinecap="round"
              filter="url(#orbital-glow)"
            />
            {/* Timer satellite */}
            <circle
              cx={timerPos.x}
              cy={timerPos.y}
              r={4 * scale}
              fill={activeTimer.remaining <= 60 ? "#ff4d4d" : "#ff8c00"}
              filter="url(#orbital-glow)"
            />
          </>
        )}

        {/* Hour planet */}
        <g filter="url(#orbital-glow)">
          <circle cx={hourPos.x} cy={hourPos.y} r={6 * scale} fill="#3b9eff" />
          <circle
            cx={hourPos.x}
            cy={hourPos.y}
            r={10 * scale}
            fill="url(#sun-glow)"
            opacity={0.5}
          />
        </g>

        {/* Minute planet */}
        <g filter="url(#orbital-glow)">
          <circle cx={minPos.x} cy={minPos.y} r={5 * scale} fill="#00d97e" />
          <circle
            cx={minPos.x}
            cy={minPos.y}
            r={8 * scale}
            fill="rgba(0,217,126,0.3)"
          />
        </g>

        {/* Second satellite */}
        <g>
          <line
            x1={cx}
            y1={cy}
            x2={secPos.x}
            y2={secPos.y}
            stroke="rgba(255,185,0,0.3)"
            strokeWidth={1}
          />
          <circle
            cx={secPos.x}
            cy={secPos.y}
            r={3 * scale}
            fill="var(--accent)"
            filter="url(#orbital-glow)"
          />
          {/* Satellite trail */}
          <circle
            cx={secPos.x}
            cy={secPos.y}
            r={8 * scale}
            fill="var(--accent)"
            opacity={0.2}
          />
        </g>

        {/* Center sun */}
        <circle
          cx={cx}
          cy={cy}
          r={8 * scale}
          fill="var(--accent)"
          filter="url(#orbital-glow)"
        />
        <circle
          cx={cx}
          cy={cy}
          r={12 * scale}
          fill="url(#sun-glow)"
          opacity={0.6}
        />
        <circle cx={cx} cy={cy} r={4 * scale} fill="#fff" opacity={0.8} />

        {/* Hour markers as stars */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const r = size * 0.42;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const isMain = i % 3 === 0;
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={isMain ? 2 * scale : 1 * scale}
                fill={isMain ? "var(--accent)" : "rgba(255,255,255,0.4)"}
              />
              {isMain && (
                <text
                  x={x}
                  y={y + 12 * scale}
                  textAnchor="middle"
                  fontSize={8 * scale}
                  fill="rgba(255,255,255,0.5)"
                >
                  {i === 0 ? 12 : i}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Digital readout overlay */}
      <div
        style={{
          position: "absolute",
          bottom: 20 * scale,
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11 * scale,
            color: "rgba(255,255,255,0.6)",
            letterSpacing: "0.1em",
          }}
        >
          {now.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <div
          style={{
            fontSize: 7 * scale,
            color: "rgba(255,255,255,0.3)",
            marginTop: 2 * scale,
          }}
        >
          {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
              label: "Switch to Swiss",
              action: () => {
                updateSettings({ analogWatchStyle: "swiss" });
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
