import React, { useEffect } from "react";
import { useStore } from "../store";
import { TauriCommands } from "../tauricommands";
import { AnalogOverlay } from "./overlay/AnalogOverlay";
import { DigitalOverlay } from "./overlay/DigitalOverlay";
import { FlipClockOverlay } from "./overlay/FlipClockOverlay";
import { MatrixOverlay } from "./overlay/MatrixOverlay";
import { SegmentDisplayOverlay } from "./overlay/SegmentDisplayOverlay";
import { SwissOverlay } from "./overlay/SwissOverlay";
import { StealthOverlay } from "./overlay/StealthOverlay";
import { OrbitalOverlay } from "./overlay/OrbitalOverlay";

export const DesktopOverlay: React.FC = () => {
  const { settings, timers } = useStore();
  const size = settings.clockSize;
  const hasActiveTimer = timers.some((t) => t.status === "running");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    const rootEl = document.getElementById("root");
    const prevRoot = rootEl?.style.background ?? "";
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    if (rootEl) rootEl.style.background = "transparent";
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
      if (rootEl) rootEl.style.background = prevRoot;
    };
  }, []);

  useEffect(() => {
    const mode = settings.minimizeMode;
    const width = size;
    const height =
      mode === "digital"
        ? hasActiveTimer && settings.digitalWatchStyle !== "minimal"
          ? size * 1.1
          : size * 0.65
        : size;
    void TauriCommands.setOverlayBounds(
      mode,
      Math.round(width),
      Math.round(height),
    );
  }, [size, hasActiveTimer, settings.minimizeMode, settings.digitalWatchStyle]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {settings.minimizeMode === "digital" ? (
        settings.digitalWatchStyle === "matrix" ? (
          <MatrixOverlay size={size} />
        ) : settings.digitalWatchStyle === "segment" ? (
          <SegmentDisplayOverlay size={size} />
        ) : settings.digitalWatchStyle === "flip" ? (
          <FlipClockOverlay size={size} />
        ) : (
          <DigitalOverlay size={size} />
        )
      ) : settings.analogWatchStyle === "swiss" ? (
        <SwissOverlay size={size} />
      ) : settings.analogWatchStyle === "stealth" ? (
        <StealthOverlay size={size} />
      ) : settings.analogWatchStyle === "orbital" ? (
        <OrbitalOverlay size={size} />
      ) : (
        <AnalogOverlay size={size} />
      )}
    </div>
  );
};
