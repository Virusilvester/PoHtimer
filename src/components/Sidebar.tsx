import React from "react";
import { useStore, type View } from "../store";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "⊞" },
  { id: "timer", label: "Timers", icon: "◷" },
  { id: "battery", label: "Battery", icon: "⚡" },
  { id: "power", label: "Power", icon: "⏻" },
  { id: "history", label: "History", icon: "≡" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export const Sidebar: React.FC = () => {
  const { view, setView, setMinimized, timers, batteryRules } = useStore();
  const runningTimers = timers.filter((t) => t.status === "running").length;
  const activeBatteryRules = batteryRules.filter((r) => r.enabled).length;

  const badges: Partial<Record<View, number>> = {
    timer: runningTimers,
    battery: activeBatteryRules,
  };

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid var(--border)",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "var(--accent)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#0a0c10",
              fontWeight: 700,
              boxShadow: "0 0 20px var(--accent-glow)",
            }}
          >
            ◷
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                letterSpacing: "0.04em",
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              POH<span style={{ color: "var(--accent)" }}>TIMER</span>
            </div>
            <div
              style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}
            >
              Power Scheduler
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {NAV.map(({ id, label, icon }) => {
          const active = view === id;
          const badge = badges[id];
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: "var(--radius-md)",
                background: active ? "var(--accent-dim)" : "transparent",
                border: `1px solid ${active ? "var(--border-accent)" : "transparent"}`,
                color: active ? "var(--accent)" : "var(--text-secondary)",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "left",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "var(--bg-hover)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "var(--text-secondary)";
                }
              }}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>
                {icon}
              </span>
              <span style={{ flex: 1 }}>{label}</span>
              {badge != null && badge > 0 && (
                <span
                  style={{
                    background: active ? "var(--accent)" : "var(--bg-overlay)",
                    color: active ? "#0a0c10" : "var(--text-muted)",
                    borderRadius: 10,
                    padding: "1px 7px",
                    fontSize: 10,
                    fontWeight: 700,
                    minWidth: 18,
                    textAlign: "center",
                  }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div
        style={{
          padding: "12px 10px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <button
          onClick={() => setMinimized(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderRadius: "var(--radius-md)",
            background: "transparent",
            border: "1px solid transparent",
            color: "var(--text-muted)",
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "var(--bg-hover)";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
            (e.currentTarget as HTMLButtonElement).style.color =
              "var(--text-muted)";
          }}
        >
          <span style={{ fontSize: 14 }}>⊟</span>
          Minimize to overlay
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 12px",
          }}
        >
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            PoHtimer v0.1.1
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--success)",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--success)",
                display: "inline-block",
              }}
            />
            Active
          </span>
        </div>
      </div>
    </aside>
  );
};
