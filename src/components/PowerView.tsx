import React, { useEffect, useState } from "react";
import { type PowerAction } from "../store";
import { ACTION_META } from "../utils";
import { Card, Btn, SectionHeader } from "./ui";
import { TauriCommands } from "../tauricommands";

type SystemInfo = {
  os: string;
  uptimeSeconds: number;
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
};

function formatUptime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "N/A";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function formatMemory(usedBytes: number, totalBytes: number) {
  if (!Number.isFinite(usedBytes) || !Number.isFinite(totalBytes)) return "N/A";
  if (totalBytes <= 0) return "N/A";
  const toGb = (b: number) => b / 1024 / 1024 / 1024;
  const usedGb = toGb(usedBytes);
  const totalGb = toGb(totalBytes);
  const usedTxt = usedGb.toFixed(1);
  const totalTxt = totalGb >= 10 ? totalGb.toFixed(0) : totalGb.toFixed(1);
  return `${usedTxt} / ${totalTxt} GB`;
}

const PowerCard: React.FC<{
  action: PowerAction;
  onExecute: (a: PowerAction) => void;
}> = ({ action, onExecute }) => {
  const meta = ACTION_META[action];
  if (action === "none") return null;
  return (
    <button
      onClick={() => onExecute(action)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "20px",
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.background = `${meta.color}12`;
        el.style.borderColor = `${meta.color}50`;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = `0 8px 24px ${meta.color}20`;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.background = "var(--bg-surface)";
        el.style.borderColor = "var(--border)";
        el.style.transform = "none";
        el.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${meta.color}20`,
          border: `1px solid ${meta.color}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          marginBottom: 12,
          color: meta.color,
        }}
      >
        {meta.icon}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        {meta.label}
      </div>
      <div
        style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.4 }}
      >
        {meta.description}
      </div>
    </button>
  );
};

const CountdownConfirm: React.FC<{
  action: PowerAction;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ action, onConfirm, onCancel }) => {
  const [count, setCount] = useState(5);
  const meta = ACTION_META[action];

  React.useEffect(() => {
    if (count <= 0) {
      onConfirm();
      return;
    }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count]);

  const circ = 2 * Math.PI * 32;
  const offset = circ * (count / 5);

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
        zIndex: 200,
        animation: "slide-up 0.2s ease",
      }}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: `1px solid ${meta.color}50`,
          borderRadius: "var(--radius-xl)",
          padding: "40px",
          width: 380,
          textAlign: "center",
          boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 40px ${meta.color}20`,
        }}
      >
        {/* Countdown ring */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: 24,
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

        <div style={{ fontSize: 28, marginBottom: 8 }}>{meta.icon}</div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          {meta.label} in {count}s
        </h2>
        <p
          style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}
        >
          {meta.description}
        </p>

        <div style={{ display: "flex", gap: 10 }}>
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

export const PowerView: React.FC = () => {
  const [confirming, setConfirming] = useState<PowerAction | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [sysinfo, setSysinfo] = useState<SystemInfo | null>(null);
  const [sysinfoError, setSysinfoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let intervalId: number | null = null;

    const refresh = async () => {
      if (document.hidden) return;
      if (inFlight) return;
      inFlight = true;
      try {
        const info = await TauriCommands.getSystemInfo();
        if (!cancelled) {
          setSysinfo(info);
          setSysinfoError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSysinfoError(String(e));
        }
      } finally {
        inFlight = false;
      }
    };

    const start = () => {
      refresh();
      intervalId = window.setInterval(refresh, 10000);
    };

    const stop = () => {
      if (intervalId != null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stop();
      } else if (intervalId == null) {
        start();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const executeAction = async (action: PowerAction) => {
    setConfirming(null);
    setLastAction(
      `${ACTION_META[action].label} executed at ${new Date().toLocaleTimeString()}`,
    );
    switch (action) {
      case "shutdown":
        await TauriCommands.shutdown();
        break;
      case "restart":
        await TauriCommands.restart();
        break;
      case "hibernate":
        await TauriCommands.hibernate();
        break;
      case "sleep":
        await TauriCommands.sleep();
        break;
      case "lock":
        await TauriCommands.lockScreen();
        break;
      case "logoff":
        await TauriCommands.logoff();
        break;
    }
  };

  const actions: PowerAction[] = [
    "shutdown",
    "restart",
    "hibernate",
    "sleep",
    "lock",
    "logoff",
  ];

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <SectionHeader
        title="Power Actions"
        subtitle="Execute immediate power commands"
      />

      {lastAction && (
        <div
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            background: "var(--success)15",
            border: "1px solid var(--success)30",
            borderRadius: "var(--radius-md)",
            fontSize: 12,
            color: "var(--success)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>✓</span>
          <span>{lastAction}</span>
          <button
            onClick={() => setLastAction(null)}
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              color: "var(--success)",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Warning */}
      <div
        style={{
          marginBottom: 20,
          padding: "12px 16px",
          background: "var(--warn)10",
          border: "1px solid var(--warn)30",
          borderRadius: "var(--radius-md)",
          fontSize: 12,
          color: "var(--warn)",
          display: "flex",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <span style={{ flexShrink: 0 }}>⚠</span>
        <span>
          Actions execute after a 5-second countdown with option to cancel. Save
          your work before proceeding.
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {actions.map((a) => (
          <PowerCard key={a} action={a} onExecute={(a) => setConfirming(a)} />
        ))}
      </div>

      {/* System info */}
      <Card style={{ marginTop: 20, padding: "18px 20px" }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary)",
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          SYSTEM INFORMATION
        </div>
        {sysinfoError && (
          <div
            style={{
              fontSize: 11,
              color: "var(--danger)",
              marginBottom: 10,
              padding: "8px 10px",
              background: "var(--danger-dim)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--danger)30",
            }}
          >
            âš  {sysinfoError}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,1fr)",
            gap: 12,
          }}
        >
          {[
            { label: "OS", value: sysinfo?.os ?? "Loading..." },
            {
              label: "Uptime",
              value: sysinfo ? formatUptime(sysinfo.uptimeSeconds) : "Loading...",
            },
            {
              label: "CPU Usage",
              value: sysinfo ? `${Math.round(sysinfo.cpuUsage)}%` : "Loading...",
            },
            {
              label: "Memory",
              value: sysinfo
                ? formatMemory(sysinfo.memoryUsed, sysinfo.memoryTotal)
                : "Loading...",
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "10px 12px",
                background: "var(--bg-overlay)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {confirming && (
        <CountdownConfirm
          action={confirming}
          onConfirm={() => executeAction(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </div>
  );
};
