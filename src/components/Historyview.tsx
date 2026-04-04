import React, { useState } from "react";
import { useStore, type PowerAction } from "../store";
import { ActionBadge, Btn, SectionHeader, EmptyState } from "./ui";
import { ACTION_META } from "../utils";

export const HistoryView: React.FC = () => {
  const { history, clearHistory } = useStore();
  const [filter, setFilter] = useState<PowerAction | "all">("all");

  const filtered =
    filter === "all" ? history : history.filter((h) => h.action === filter);
  const actions = Array.from(
    new Set(history.map((h) => h.action)),
  ) as PowerAction[];

  return (
    <div
      style={{
        padding: "24px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SectionHeader
        title="Event History"
        subtitle="Log of all triggered power actions"
        action={
          history.length > 0 ? (
            <Btn size="sm" variant="danger" onClick={clearHistory}>
              Clear All
            </Btn>
          ) : undefined
        }
      />

      {/* Filter chips */}
      {history.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              background:
                filter === "all" ? "var(--accent-dim)" : "var(--bg-elevated)",
              border: `1px solid ${filter === "all" ? "var(--border-accent)" : "var(--border)"}`,
              color: filter === "all" ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            All ({history.length})
          </button>
          {actions.map((a) => {
            const meta = ACTION_META[a];
            const count = history.filter((h) => h.action === a).length;
            return (
              <button
                key={a}
                onClick={() => setFilter(a)}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  background:
                    filter === a ? `${meta.color}20` : "var(--bg-elevated)",
                  border: `1px solid ${filter === a ? `${meta.color}50` : "var(--border)"}`,
                  color: filter === a ? meta.color : "var(--text-muted)",
                }}
              >
                {meta.icon} {meta.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filtered.length === 0 ? (
          <EmptyState
            icon="â‰¡"
            title="No events yet"
            subtitle="Events will appear here when timers or battery rules trigger"
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((h, i) => {
              const meta = ACTION_META[h.action];
              const isFirst =
                i === 0 ||
                new Date(filtered[i - 1].timestamp).toDateString() !==
                  new Date(h.timestamp).toDateString();
              return (
                <React.Fragment key={h.id}>
                  {isFirst && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        padding: "4px 0",
                        marginTop: i > 0 ? 8 : 0,
                      }}
                    >
                      {new Date(h.timestamp)
                        .toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                        })
                        .toUpperCase()}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      transition: "background 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: `${meta.color}15`,
                        border: `1px solid ${meta.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 16,
                        color: meta.color,
                        flexShrink: 0,
                      }}
                    >
                      {meta.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {h.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 1,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <span>
                          via{" "}
                          {h.source === "timer" ? "â—· Timer" : h.source === "battery" ? "âš¡ Battery rule" : "â—· System"}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <ActionBadge action={h.action} size="sm" />
                      <span
                        style={{ fontSize: 10, color: "var(--text-muted)" }}
                      >
                        {new Date(h.timestamp).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
