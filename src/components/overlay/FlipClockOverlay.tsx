import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

interface FlipDigitProps {
  digit: string;
  size: number;
  color?: string;
}

const FlipDigit: React.FC<FlipDigitProps> = ({
  digit,
  size,
  color = "var(--accent)",
}) => {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setPrevDigit(digit);
        setIsFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  const scale = size / 160;
  const digitWidth = 28 * scale;
  const digitHeight = 40 * scale;
  const fontSize = 24 * scale;
  const borderRadius = 4 * scale;

  return (
    <div
      style={{
        width: digitWidth,
        height: digitHeight,
        position: "relative",
        perspective: "200px",
      }}
    >
      {/* Static background digit */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #1a1d24 0%, #14171d 100%)",
          borderRadius,
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize,
          fontWeight: 700,
          color: "rgba(255,255,255,0.15)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        {digit}
      </div>

      {/* Top half - current */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(180deg, #2a2e38 0%, #1f232b 100%)",
          borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
          border: "1px solid rgba(255,255,255,0.12)",
          borderBottom: "none",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize,
          fontWeight: 700,
          color,
          lineHeight: 0.8,
          overflow: "hidden",
          transformOrigin: "bottom",
          transform: isFlipping ? "rotateX(-90deg)" : "rotateX(0deg)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 2,
        }}
      >
        <span style={{ transform: "translateY(50%)" }}>{prevDigit}</span>
      </div>

      {/* Bottom half - next */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          background: "linear-gradient(180deg, #1a1d24 0%, #15181e 100%)",
          borderRadius: `0 0 ${borderRadius}px ${borderRadius}px`,
          border: "1px solid rgba(255,255,255,0.08)",
          borderTop: "none",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          fontFamily: "var(--font-mono)",
          fontSize,
          fontWeight: 700,
          color,
          lineHeight: 0.8,
          overflow: "hidden",
          transformOrigin: "top",
          transform: isFlipping ? "rotateX(0deg)" : "rotateX(90deg)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1,
        }}
      >
        <span style={{ transform: "translateY(-50%)" }}>{digit}</span>
      </div>

      {/* Center line */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: 1,
          background: "rgba(0,0,0,0.6)",
          zIndex: 3,
        }}
      />
    </div>
  );
};

const FlipSeparator: React.FC<{ size: number; blink?: boolean }> = ({
  size,
  blink = true,
}) => {
  const scale = size / 160;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!blink) return;
    const id = setInterval(() => setVisible((v) => !v), 1000);
    return () => clearInterval(id);
  }, [blink]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4 * scale,
        padding: `0 ${4 * scale}px`,
        opacity: visible ? 1 : 0.3,
        transition: "opacity 0.2s",
      }}
    >
      <div
        style={{
          width: 4 * scale,
          height: 4 * scale,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent-glow)",
        }}
      />
      <div
        style={{
          width: 4 * scale,
          height: 4 * scale,
          borderRadius: "50%",
          background: "var(--accent)",
          boxShadow: "0 0 6px var(--accent-glow)",
        }}
      />
    </div>
  );
};

export const FlipClockOverlay: React.FC<OverlayProps> = ({ size }) => {
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

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const hasTimerPanel = activeTimer && settings.digitalWatchStyle !== "minimal";

  return (
    <div
      data-tauri-drag-region
      style={{
        position: "relative",
        width: size,
        height: hasTimerPanel ? size * 1.25 : size * 0.75,
        background:
          "linear-gradient(145deg, rgba(20,24,32,0.95) 0%, rgba(14,18,26,0.98) 100%)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 16 * scale,
        padding: `${16 * scale}px ${20 * scale}px`,
        cursor: "grab",
        userSelect: "none",
        boxShadow: `
          0 20px 40px rgba(0,0,0,0.6),
          0 0 0 1px rgba(255,185,0,0.1),
          inset 0 1px 0 rgba(255,255,255,0.05)
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8 * scale,
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
      {/* Brand */}
      <div
        style={{
          fontSize: 8 * scale,
          color: "rgba(255,185,0,0.6)",
          letterSpacing: "0.2em",
          fontWeight: 600,
          textTransform: "uppercase",
        }}
      >
        POHTIMER
      </div>

      {/* Time Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2 * scale,
        }}
      >
        {/* Hours */}
        <div style={{ display: "flex", gap: 2 * scale }}>
          <FlipDigit digit={hours[0]} size={size} />
          <FlipDigit digit={hours[1]} size={size} />
        </div>

        <FlipSeparator size={size} />

        {/* Minutes */}
        <div style={{ display: "flex", gap: 2 * scale }}>
          <FlipDigit digit={minutes[0]} size={size} />
          <FlipDigit digit={minutes[1]} size={size} />
        </div>

        <FlipSeparator size={size} blink={false} />

        {/* Seconds */}
        <div style={{ display: "flex", gap: 2 * scale }}>
          <FlipDigit digit={seconds[0]} size={size} color="var(--text-muted)" />
          <FlipDigit digit={seconds[1]} size={size} color="var(--text-muted)" />
        </div>
      </div>

      {/* Date */}
      <div
        style={{
          fontSize: 9 * scale,
          color: "rgba(240,242,245,0.4)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </div>

      {/* Timer Panel */}
      {hasTimerPanel && (
        <div
          style={{
            marginTop: 4 * scale,
            padding: `${8 * scale}px ${12 * scale}px`,
            background: "rgba(255,185,0,0.08)",
            border: "1px solid rgba(255,185,0,0.2)",
            borderRadius: 8 * scale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2 * scale,
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: 7 * scale,
              color: "rgba(255,185,0,0.6)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {activeTimer.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 14 * scale,
              fontWeight: 700,
              color: activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)",
              letterSpacing: "0.02em",
            }}
          >
            {String(Math.floor(activeTimer.remaining / 3600)).padStart(2, "0")}:
            {String(Math.floor((activeTimer.remaining % 3600) / 60)).padStart(
              2,
              "0",
            )}
            :{String(activeTimer.remaining % 60).padStart(2, "0")}
          </div>
        </div>
      )}

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
            backdropFilter: "blur(12px)",
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
              label: "Switch Style",
              action: () => {
                updateSettings({ digitalWatchStyle: "matrix" });
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
