import React, { useCallback, useEffect, useState } from "react";
import { useStore } from "../../store";
import { TauriCommands } from "../../tauricommands";
import type { OverlayProps } from "./types";

interface SegmentDigitProps {
  digit: string;
  size: number;
  color?: string;
  glow?: boolean;
}

const SEGMENT_MAP: Record<string, boolean[]> = {
  "0": [true, true, true, true, true, true, false],
  "1": [false, true, true, false, false, false, false],
  "2": [true, true, false, true, true, false, true],
  "3": [true, true, true, true, false, false, true],
  "4": [false, true, true, false, false, true, true],
  "5": [true, false, true, true, false, true, true],
  "6": [true, false, true, true, true, true, true],
  "7": [true, true, true, false, false, false, false],
  "8": [true, true, true, true, true, true, true],
  "9": [true, true, true, true, false, true, true],
  " ": [false, false, false, false, false, false, false],
  "-": [false, false, false, false, false, false, true],
};

const SegmentDigit: React.FC<SegmentDigitProps> = ({
  digit,
  size,
  color = "var(--accent)",
  glow = true,
}) => {
  const scale = size / 160;
  const segments = SEGMENT_MAP[digit] || SEGMENT_MAP[" "];
  const segmentWidth = 4 * scale;
  const segmentLength = 16 * scale;
  const gap = 2 * scale;

  const segmentStyle = (
    active: boolean,
    vertical: boolean,
  ): React.CSSProperties => ({
    position: "absolute",
    width: vertical ? segmentWidth : segmentLength,
    height: vertical ? segmentLength : segmentWidth,
    background: active ? color : "rgba(255,255,255,0.06)",
    borderRadius: segmentWidth / 2,
    boxShadow:
      active && glow
        ? `0 0 ${8 * scale}px ${color}80, inset 0 1px 0 rgba(255,255,255,0.3)`
        : "none",
    transition: "all 0.3s ease",
  });

  return (
    <div
      style={{
        position: "relative",
        width: segmentLength + segmentWidth + gap * 2,
        height: segmentLength * 2 + segmentWidth + gap * 4,
      }}
    >
      {/* Top */}
      <div
        style={{
          ...segmentStyle(segments[0], false),
          top: 0,
          left: gap + segmentWidth / 2,
        }}
      />
      {/* Top Right */}
      <div
        style={{
          ...segmentStyle(segments[1], true),
          top: gap + segmentWidth / 2,
          right: 0,
        }}
      />
      {/* Bottom Right */}
      <div
        style={{
          ...segmentStyle(segments[2], true),
          bottom: gap + segmentWidth / 2,
          right: 0,
        }}
      />
      {/* Bottom */}
      <div
        style={{
          ...segmentStyle(segments[3], false),
          bottom: 0,
          left: gap + segmentWidth / 2,
        }}
      />
      {/* Bottom Left */}
      <div
        style={{
          ...segmentStyle(segments[4], true),
          bottom: gap + segmentWidth / 2,
          left: 0,
        }}
      />
      {/* Top Left */}
      <div
        style={{
          ...segmentStyle(segments[5], true),
          top: gap + segmentWidth / 2,
          left: 0,
        }}
      />
      {/* Middle */}
      <div
        style={{
          ...segmentStyle(segments[6], false),
          top: "50%",
          left: gap + segmentWidth / 2,
          transform: "translateY(-50%)",
        }}
      />
    </div>
  );
};

const SegmentSeparator: React.FC<{ size: number; active?: boolean }> = ({
  size,
  active = true,
}) => {
  const scale = size / 160;
  const dotSize = 5 * scale;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8 * scale,
        padding: `0 ${6 * scale}px`,
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: active ? "var(--accent)" : "rgba(255,255,255,0.1)",
          boxShadow: active ? `0 0 ${6 * scale}px var(--accent-glow)` : "none",
          transition: "all 0.5s ease",
        }}
      />
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: active ? "var(--accent)" : "rgba(255,255,255,0.1)",
          boxShadow: active ? `0 0 ${6 * scale}px var(--accent-glow)` : "none",
          transition: "all 0.5s ease",
        }}
      />
    </div>
  );
};

export const SegmentDisplayOverlay: React.FC<OverlayProps> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, settings, updateSettings } = useStore();
  const [showMenu, setShowMenu] = useState(false);
  const [colonActive, setColonActive] = useState(true);

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

  useEffect(() => {
    const id = setInterval(() => setColonActive((v) => !v), 1000);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find((t) => t.status === "running");
  const scale = size / 160;

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  const hasTimerPanel = activeTimer && settings.digitalWatchStyle !== "minimal";

  return (
    <div
      data-tauri-drag-region
      style={{
        position: "relative",
        width: size,
        height: hasTimerPanel ? size * 1.3 : size * 0.8,
        background: "linear-gradient(145deg, #0d1016 0%, #080a0e 100%)",
        backdropFilter: "blur(10px)",
        border: "2px solid rgba(255,255,255,0.08)",
        borderRadius: 12 * scale,
        padding: `${20 * scale}px ${16 * scale}px`,
        cursor: "grab",
        userSelect: "none",
        boxShadow: `
          inset 0 2px 4px rgba(0,0,0,0.5),
          0 16px 32px rgba(0,0,0,0.6),
          0 0 0 1px rgba(255,185,0,0.08)
        `,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12 * scale,
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
      {/* Bezel texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12 * scale,
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Label */}
      <div
        style={{
          fontSize: 7 * scale,
          color: "rgba(255,185,0,0.5)",
          letterSpacing: "0.3em",
          fontWeight: 700,
          textTransform: "uppercase",
          zIndex: 1,
        }}
      >
        DIGITAL
      </div>

      {/* Time Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4 * scale,
          zIndex: 1,
          padding: `${8 * scale}px`,
          background: "rgba(0,0,0,0.3)",
          borderRadius: 8 * scale,
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <SegmentDigit digit={hours[0]} size={size} />
        <SegmentDigit digit={hours[1]} size={size} />
        <SegmentSeparator size={size} active={colonActive} />
        <SegmentDigit digit={minutes[0]} size={size} />
        <SegmentDigit digit={minutes[1]} size={size} />
      </div>

      {/* Date */}
      <div
        style={{
          fontSize: 8 * scale,
          color: "rgba(240,242,245,0.35)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          fontFamily: "var(--font-mono)",
          zIndex: 1,
        }}
      >
        {now
          .toLocaleDateString("en-US", {
            weekday: "short",
            month: "2-digit",
            day: "2-digit",
          })
          .replace(/,/g, "")}
      </div>

      {/* Timer Panel */}
      {hasTimerPanel && (
        <div
          style={{
            marginTop: 4 * scale,
            padding: `${10 * scale}px ${14 * scale}px`,
            background: "rgba(255,140,0,0.1)",
            border: "1px solid rgba(255,140,0,0.25)",
            borderRadius: 6 * scale,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4 * scale,
            width: "85%",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 6 * scale,
              color: "rgba(255,140,0,0.7)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {activeTimer.label}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3 * scale,
            }}
          >
            {String(Math.floor(activeTimer.remaining / 3600))
              .padStart(2, "0")
              .split("")
              .map((d, i) => (
                <SegmentDigit
                  key={`h${i}`}
                  digit={d}
                  size={size * 0.6}
                  color={
                    activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)"
                  }
                />
              ))}
            <div
              style={{
                color:
                  activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)",
                fontSize: 10 * scale,
              }}
            >
              :
            </div>
            {String(Math.floor((activeTimer.remaining % 3600) / 60))
              .padStart(2, "0")
              .split("")
              .map((d, i) => (
                <SegmentDigit
                  key={`m${i}`}
                  digit={d}
                  size={size * 0.6}
                  color={
                    activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)"
                  }
                />
              ))}
            <div
              style={{
                color:
                  activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)",
                fontSize: 10 * scale,
              }}
            >
              :
            </div>
            {String(activeTimer.remaining % 60)
              .padStart(2, "0")
              .split("")
              .map((d, i) => (
                <SegmentDigit
                  key={`s${i}`}
                  digit={d}
                  size={size * 0.6}
                  color={
                    activeTimer.remaining <= 60 ? "#ff8c00" : "var(--accent)"
                  }
                />
              ))}
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
              label: "Switch to Flip",
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
