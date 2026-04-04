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

// Injected once into <head> so Sidebar re-renders don't duplicate the tag
let _styleInjected = false;
function injectSidebarStyles() {
  if (_styleInjected || typeof document === "undefined") return;
  _styleInjected = true;
  const el = document.createElement("style");
  el.textContent = `
    .sidebar-nav-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: var(--radius-md);
      background: transparent; border: 1px solid transparent;
      color: var(--text-secondary); font-size: 13px; font-weight: 400;
      cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
      text-align: left; position: relative; width: 100%;
    }
    .sidebar-nav-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .sidebar-nav-btn.active {
      background: var(--accent-dim);
      border-color: var(--border-accent);
      color: var(--accent);
      font-weight: 600;
    }
    .sidebar-minimize-btn {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: var(--radius-md);
      background: transparent; border: 1px solid transparent;
      color: var(--text-muted); font-size: 12px;
      cursor: pointer; transition: background 0.15s, color 0.15s; width: 100%;
    }
    .sidebar-minimize-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
  `;
  document.head.appendChild(el);
}

export const Sidebar: React.FC = () => {
  injectSidebarStyles();

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
              className={`sidebar-nav-btn${active ? " active" : ""}`}
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
          className="sidebar-minimize-btn"
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
            PoHtimer v0.1.5
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
