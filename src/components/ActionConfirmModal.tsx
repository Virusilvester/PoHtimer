import React, { useEffect, useRef, useState } from "react";
// ActionSource now includes "manual" for direct PowerView invocations
import type { PowerAction } from "../store";
import { ACTION_META } from "../utils";
import { Btn } from "./ui";

// Extended locally so PowerView can pass "manual" without touching store types
type ModalActionSource = "timer" | "battery" | "manual";

export const ActionConfirmModal: React.FC<{
  action: PowerAction;
  source: ModalActionSource;
  label: string;
  seconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ action, source, label, seconds = 5, onConfirm, onCancel }) => {
  const [count, setCount] = useState(seconds);
  const meta = ACTION_META[action];
  const onConfirmRef = useRef(onConfirm);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    if (count <= 0) {
      onConfirmRef.current();
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  const circ = 2 * Math.PI * 32;
  const offset = circ * (count / seconds);

  const sourceLabel =
    source === "manual"
      ? "Direct action"
      : source === "timer"
        ? "Timer"
        : "Battery rule";

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onCancel()}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        animation: "slide-up 0.2s ease",
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: `1px solid ${meta.color}50`,
          borderRadius: "var(--radius-xl)",
          padding: "34px 34px 28px",
          width: 420,
          maxWidth: "calc(100vw - 32px)",
          textAlign: "center",
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 40px ${meta.color}20`,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 18,
          }}
        >
          <svg width={80} height={80}>
            <circle
              cx={40}
              cy={40}
              r={32}
              fill="none"
              stroke="var(--bg-overlay)"
              strokeWidth={6}
            />
            <circle
              cx={40}
              cy={40}
              r={32}
              fill="none"
              stroke={meta.color}
              strokeWidth={6}
              strokeDasharray={circ}
              strokeDashoffset={circ - offset}
              strokeLinecap="round"
              transform="rotate(-90 40 40)"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
            <text
              x={40}
              y={45}
              textAnchor="middle"
              fontSize={24}
              fontFamily="var(--font-mono)"
              fontWeight="700"
              fill={meta.color}
            >
              {count}
            </text>
          </svg>
        </div>

        <div style={{ fontSize: 28, marginBottom: 6 }}>{meta.icon}</div>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          {meta.label} in {count}s
        </h2>
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
          Triggered via{" "}
          <span style={{ color: "var(--text-secondary)" }}>{sourceLabel}</span>{" "}
          •{" "}
          <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          Press <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 4px", border: "1px solid var(--border)", borderRadius: 3 }}>Esc</kbd> to cancel
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <Btn variant="danger" style={{ flex: 1 }} onClick={onCancel}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            style={{ flex: 1, background: meta.color, color: "#0a0c10" }}
            onClick={onConfirm}
          >
            {meta.label} Now
          </Btn>
        </div>
      </div>
    </div>
  );
};
