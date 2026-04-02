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
      /* ignore */
    }
  }, [updateSettings]);

  useEffect(() => {
    // Neon and halo need smooth second movement
    const interval = settings.analogWatchStyle === "classic" ? 1000 : 50;
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [settings.analogWatchStyle]);

  const activeTimer = timers.find((t) => t.status === "running");
  const style = settings.analogWatchStyle;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const scale = size / 160;

  // Smooth time for neon/halo
  const ms = now.getMilliseconds();
  const rawS =
    style === "classic" ? now.getSeconds() : now.getSeconds() + ms / 1000;
  const rawM = now.getMinutes() + rawS / 60;
  const rawH = (now.getHours() % 12) + rawM / 60;

  const hAngle = (rawH / 12) * 360 - 90;
  const mAngle = (rawM / 60) * 360 - 90;
  const sAngle = (rawS / 60) * 360 - 90;

  const toXY = (angle: number, len: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * len,
    y: cy + Math.sin((angle * Math.PI) / 180) * len,
  });

  const hTip = toXY(hAngle, r * 0.55);
  const mTip = toXY(mAngle, r * 0.75);
  const sTip = toXY(sAngle, r * 0.85);
  const sTail = toXY(sAngle + 180, r * 0.2);

  // Timer arc
  const timerPct = activeTimer
    ? 1 - activeTimer.remaining / activeTimer.duration
    : 0;
  const timerAngle = timerPct * 360;
  const timerR = r - 7;
  const timerArcEnd = toXY(timerAngle - 90, timerR);
  const largeArc = timerPct > 0.5 ? 1 : 0;

  // ── Style-specific config ────────────────────────────────
  type StyleCfg = {
    bgFill: string;
    rimStroke: string;
    rimWidth: number;
    markerColor: (i: number) => string;
    markerLen: (i: number) => number;
    markerWidth: (i: number) => number;
    hHandColor: string;
    hHandWidth: number;
    mHandColor: string;
    mHandWidth: number;
    sHandColor: string;
    sHandWidth: number;
    centerColor: string;
    filterH?: string;
    filterM?: string;
    filterS?: string;
    showNumbers: boolean;
    showDragHandle: boolean;
    rimGlowFilter?: string;
  };

  const cfgMap: Record<string, StyleCfg> = {
    // ── Classic: warm cream dial, railroad markers, traditional hands
    classic: {
      bgFill: "rgba(18,14,10,0.92)",
      rimStroke: "rgba(200,170,110,0.55)",
      rimWidth: 2,
      markerColor: (i) =>
        i % 3 === 0 ? "rgba(200,170,110,0.9)" : "rgba(200,170,110,0.4)",
      markerLen: (i) => (i % 3 === 0 ? r - 8 : r - 5),
      markerWidth: (i) => (i % 3 === 0 ? 2 : 1),
      hHandColor: "rgba(220,200,160,0.95)",
      hHandWidth: 4.5 * scale,
      mHandColor: "rgba(220,200,160,0.9)",
      mHandWidth: 3 * scale,
      sHandColor: "#e8621a",
      sHandWidth: 1.2 * scale,
      centerColor: "#e8621a",
      showNumbers: true,
      showDragHandle: false,
    },
    // ── Neon: cyberpunk dark, glowing cyan/magenta, thin laser hands
    neon: {
      bgFill: "rgba(4,6,12,0.96)",
      rimStroke: "#00f5ff",
      rimWidth: 1.5,
      markerColor: (i) => (i % 3 === 0 ? "#00f5ff" : "#ff00aa"),
      markerLen: (i) => (i % 3 === 0 ? r - 7 : r - 4),
      markerWidth: (i) => (i % 3 === 0 ? 2 : 1),
      hHandColor: "#00f5ff",
      hHandWidth: 3 * scale,
      mHandColor: "#ff00aa",
      mHandWidth: 2 * scale,
      sHandColor: "#ffff00",
      sHandWidth: 1 * scale,
      centerColor: "#ffffff",
      filterH: "neon-cyan-glow",
      filterM: "neon-pink-glow",
      filterS: "neon-yellow-glow",
      rimGlowFilter: "neon-cyan-glow",
      showNumbers: false,
      showDragHandle: true,
    },
    // ── Minimal: frameless, nearly invisible, pure typography focus
    minimal: {
      bgFill: "rgba(10,12,16,0.12)",
      rimStroke: "rgba(255,255,255,0.06)",
      rimWidth: 1,
      markerColor: () => "rgba(255,255,255,0.0)",
      markerLen: () => r - 4,
      markerWidth: () => 0,
      hHandColor: "rgba(255,255,255,0.88)",
      hHandWidth: 3 * scale,
      mHandColor: "rgba(255,255,255,0.6)",
      mHandWidth: 1.5 * scale,
      sHandColor: "var(--accent)",
      sHandWidth: 0.8 * scale,
      centerColor: "var(--accent)",
      showNumbers: false,
      showDragHandle: false,
    },
    // ── Halo: aurora gradient rim, translucent dial, prismatic glow
    halo: {
      bgFill: "url(#halo-dial)",
      rimStroke: "url(#halo-ring)",
      rimWidth: 2.5,
      markerColor: (i) =>
        i % 3 === 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.2)",
      markerLen: (i) => (i % 3 === 0 ? r - 9 : r - 5),
      markerWidth: (i) => (i % 3 === 0 ? 2 : 1),
      hHandColor: "rgba(255,255,255,0.95)",
      hHandWidth: 3.5 * scale,
      mHandColor: "rgba(180,220,255,0.9)",
      mHandWidth: 2.5 * scale,
      sHandColor: "#ffb900",
      sHandWidth: 1.2 * scale,
      centerColor: "#ffb900",
      filterH: "halo-glow",
      filterM: "halo-glow",
      showNumbers: false,
      showDragHandle: true,
    },
  };

  const cfg = cfgMap[style] ?? cfgMap.classic;

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
      {/* Drag handle — only for styles with opaque background */}
      {cfg.showDragHandle && (
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
      )}

      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <defs>
          {/* Halo gradients */}
          <linearGradient id="halo-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,100,200,0.9)" />
            <stop offset="33%" stopColor="rgba(100,180,255,0.9)" />
            <stop offset="66%" stopColor="rgba(100,255,180,0.9)" />
            <stop offset="100%" stopColor="rgba(255,220,50,0.9)" />
          </linearGradient>
          <radialGradient id="halo-dial" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(30,24,60,0.88)" />
            <stop offset="70%" stopColor="rgba(14,10,30,0.82)" />
            <stop offset="100%" stopColor="rgba(8,6,18,0.75)" />
          </radialGradient>

          {/* Neon glow filters */}
          <filter
            id="neon-cyan-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#00f5ff" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="neon-pink-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#ff00aa" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="neon-yellow-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#ffff00" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Halo glow */}
          <filter id="halo-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Generic subtle glow */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Neon: outer double-ring electric effect */}
        {style === "neon" && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={r + 4}
              fill="none"
              stroke="rgba(0,245,255,0.08)"
              strokeWidth={6}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r + 1}
              fill="none"
              stroke="rgba(0,245,255,0.25)"
              strokeWidth={1}
            />
          </>
        )}

        {/* Halo: outer aurora ring */}
        {style === "halo" && (
          <circle
            cx={cx}
            cy={cy}
            r={r + 3}
            fill="none"
            stroke="url(#halo-ring)"
            strokeWidth={4}
            opacity={0.35}
            filter="url(#halo-glow)"
          />
        )}

        {/* Dial background */}
        <circle cx={cx} cy={cy} r={r} fill={cfg.bgFill} />

        {/* Classic: inner track line */}
        {style === "classic" && (
          <circle
            cx={cx}
            cy={cy}
            r={r - 3}
            fill="none"
            stroke="rgba(200,170,110,0.18)"
            strokeWidth={1}
          />
        )}

        {/* Rim */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={cfg.rimStroke}
          strokeWidth={cfg.rimWidth}
          filter={cfg.rimGlowFilter ? `url(#${cfg.rimGlowFilter})` : undefined}
        />

        {/* Hour markers */}
        {style !== "minimal" &&
          Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * 360 - 90;
            const inner = toXY(a, cfg.markerLen(i));
            const outer = toXY(a, r - 3);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={cfg.markerColor(i)}
                strokeWidth={cfg.markerWidth(i)}
              />
            );
          })}

        {/* Classic: roman-style 4 cardinal numbers */}
        {cfg.showNumbers &&
          [
            { n: "XII", i: 0 },
            { n: "III", i: 3 },
            { n: "VI", i: 6 },
            { n: "IX", i: 9 },
          ].map(({ n, i }) => {
            const a = (i / 12) * 360 - 90;
            const pos = toXY(a, r - 20);
            return (
              <text
                key={n}
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fontSize={8 * scale}
                fontFamily="Georgia, serif"
                fill="rgba(200,170,110,0.7)"
                fontWeight="600"
              >
                {n}
              </text>
            );
          })}

        {/* Minimal: only 4 small pip dots at cardinal positions */}
        {style === "minimal" &&
          [0, 3, 6, 9].map((i) => {
            const a = (i / 12) * 360 - 90;
            const pos = toXY(a, r - 8);
            return (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r={2.5 * scale}
                fill="rgba(255,255,255,0.35)"
              />
            );
          })}

        {/* Neon: minute tick marks (subtle) */}
        {style === "neon" &&
          Array.from({ length: 60 }, (_, i) => {
            if (i % 5 === 0) return null;
            const a = (i / 60) * 360 - 90;
            const inner = toXY(a, r - 4);
            const outer = toXY(a, r - 2);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(255,0,170,0.3)"
                strokeWidth={0.7}
              />
            );
          })}

        {/* Timer progress arc */}
        {activeTimer && timerPct > 0 && style !== "minimal" && (
          <path
            d={`M ${cx} ${cy - timerR} A ${timerR} ${timerR} 0 ${largeArc} 1 ${timerArcEnd.x} ${timerArcEnd.y}`}
            fill="none"
            stroke={
              activeTimer.remaining <= 60
                ? "#ff8c00"
                : style === "neon"
                  ? "#ffff00"
                  : style === "halo"
                    ? "rgba(255,185,0,0.9)"
                    : "var(--accent)"
            }
            strokeWidth={style === "neon" ? 2.5 : 3}
            strokeLinecap="round"
            filter={style === "neon" ? "url(#neon-yellow-glow)" : undefined}
          />
        )}

        {/* Hour hand */}
        <g filter={cfg.filterH ? `url(#${cfg.filterH})` : undefined}>
          <line
            x1={cx}
            y1={cy}
            x2={hTip.x}
            y2={hTip.y}
            stroke={cfg.hHandColor}
            strokeWidth={cfg.hHandWidth}
            strokeLinecap="round"
          />
        </g>

        {/* Minute hand */}
        <g filter={cfg.filterM ? `url(#${cfg.filterM})` : undefined}>
          <line
            x1={cx}
            y1={cy}
            x2={mTip.x}
            y2={mTip.y}
            stroke={cfg.mHandColor}
            strokeWidth={cfg.mHandWidth}
            strokeLinecap="round"
          />
        </g>

        {/* Second hand: tail + tip through center */}
        <g filter={cfg.filterS ? `url(#${cfg.filterS})` : "url(#glow)"}>
          {/* Tail */}
          <line
            x1={cx}
            y1={cy}
            x2={sTail.x}
            y2={sTail.y}
            stroke={cfg.sHandColor}
            strokeWidth={cfg.sHandWidth * 2}
            strokeLinecap="round"
          />
          {/* Needle to tip */}
          <line
            x1={cx}
            y1={cy}
            x2={sTip.x}
            y2={sTip.y}
            stroke={cfg.sHandColor}
            strokeWidth={cfg.sHandWidth}
            strokeLinecap="round"
          />
        </g>

        {/* Center dot */}
        <circle
          cx={cx}
          cy={cy}
          r={3.5 * scale}
          fill={cfg.centerColor}
          filter={
            style === "neon"
              ? "url(#neon-cyan-glow)"
              : style === "halo"
                ? "url(#halo-glow)"
                : undefined
          }
        />
        <circle cx={cx} cy={cy} r={1.8 * scale} fill="#0a0c10" />

        {/* Classic: crown jewel center pip */}
        {style === "classic" && (
          <circle cx={cx} cy={cy} r={1.2 * scale} fill="#e8621a" />
        )}
      </svg>

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
            padding: 4,
            zIndex: 999,
            minWidth: 150,
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
