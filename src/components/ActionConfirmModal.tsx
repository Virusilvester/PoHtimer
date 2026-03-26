import React, { useEffect, useState } from "react";
import type { ActionSource, PowerAction } from "../store";
import { ACTION_META } from "../utils";
import { Btn } from "./ui";

export const ActionConfirmModal: React.FC<{
  action: PowerAction;
  source: ActionSource;
  label: string;
  seconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ action, source, label, seconds = 5, onConfirm, onCancel }) => {
  const [count, setCount] = useState(seconds);
  const meta = ACTION_META[action];

  useEffect(() => {
    if (count <= 0) {
      onConfirm();
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, onConfirm]);

  const circ = 2 * Math.PI * 32;
  const offset = circ * (count / seconds);

  return (
    <div
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
          Triggered via <span style={{ color: "var(--text-secondary)" }}>{source}</span> •{" "}
          <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
          <Btn variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn
            variant="primary"
            onClick={onConfirm}
            style={{ background: meta.color, color: "#0a0c10" }}
          >
            Execute now
          </Btn>
        </div>
      </div>
    </div>
  );
};

