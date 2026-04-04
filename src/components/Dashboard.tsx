import React, { useEffect, useMemo, useState } from "react";
import { useStore, type TimerEntry } from "../store";
import { Card, ActionBadge, Btn } from "./ui";
import { formatDuration, formatDurationLong, ACTION_META } from "../utils";

// Isolated clock — only this component re-renders every second
const LiveClock = React.memo(() => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 56,
          fontWeight: 700,
          color: "var(--text-primary)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
        {now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </div>
  );
});

// Isolated battery widget — only re-renders when battery state changes
const BatteryWidget = React.memo(() => {
  const battery = useStore((s) => s.battery);
  const pct = battery.level ?? 0;
  const onAc = battery.plugged;
  const hasBattery = battery.present && battery.level != null;
  const color =
    pct <= 10 ? "var(--danger)" : pct <= 25 ? "var(--warn)" : "var(--success)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Battery
        </span>
        <span
          style={{
            fontSize: 12,
            color: hasBattery ? color : "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontWeight: 600,
          }}
        >
          {hasBattery ? (
            <>
              {battery.charging ? "⚡ " : ""}
              {pct}%
            </>
          ) : (
            "N/A"
          )}
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--bg-overlay)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${hasBattery ? pct : 0}%`,
            background: hasBattery ? color : "var(--text-muted)",
            borderRadius: 3,
            transition: "width 0.5s ease",
            boxShadow: `0 0 8px ${color}60`,
          }}
        />
      </div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {!hasBattery
          ? "No battery detected"
          : onAc
            ? battery.charging
              ? "Charging"
              : "Plugged in"
            : "On battery"}
        {hasBattery && pct <= 25 && !onAc && (
          <span style={{ color: "var(--warn)", marginLeft: 6 }}>⚠ Low</span>
        )}
      </div>
    </div>
  );
});

// Receives timer as prop — avoids O(n) find per card on every render
const ActiveTimerCard = React.memo<{ timer: TimerEntry }>(({ timer }) => {
  const { toggleTimer, removeTimer } = useStore();
  const isSchedule = timer.kind === "schedule" && !!timer.scheduleTime;
  const nextRun =
    isSchedule && timer.nextFireAt
      ? new Date(timer.nextFireAt)
      : isSchedule
        ? new Date(Date.now() + timer.remaining * 1000)
        : null;
  const pct = (1 - timer.remaining / timer.duration) * 100;
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference * (1 - pct / 100);
  const urgent = timer.remaining <= 60;
  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: `1px solid ${urgent ? "var(--warn)40" : "var(--border)"}`,
        borderRadius: "var(--radius-md)",
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Progress ring */}
      <svg width={64} height={64} style={{ flexShrink: 0 }}>
        <circle
          cx={32}
          cy={32}
          r={28}
          fill="none"
          stroke="var(--bg-overlay)"
          strokeWidth={4}
        />
        <circle
          cx={32}
          cy={32}
          r={28}
          fill="none"
          stroke={urgent ? "var(--warn)" : "var(--accent)"}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
        <text
          x={32}
          y={36}
          textAnchor="middle"
          fontSize={11}
          fontFamily="var(--font-mono)"
          fill={urgent ? "var(--warn)" : "var(--accent)"}
          fontWeight={700}
        >
          {formatDuration(timer.remaining)}
        </text>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 3,
          }}
        >
          {timer.label}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ActionBadge action={timer.action} size="sm" />
          {timer.repeat && (
            <span
              style={{
                fontSize: 10,
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: 4,
                padding: "1px 5px",
              }}
            >
              ↺ repeat
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
          {timer.status === "paused"
            ? "⏸ Paused"
            : isSchedule && nextRun
              ? `⏰ Next: ${nextRun.toLocaleString("en-US", {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : `⏱ ${formatDurationLong(timer.remaining)} left`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        <button
          onClick={() => toggleTimer(timer.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--bg-overlay)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {timer.status === "running" ? "⏸" : "▶"}
        </button>
        <button
          onClick={() => removeTimer(timer.id)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "var(--danger-dim)",
            border: "1px solid var(--danger)30",
            color: "var(--danger)",
            cursor: "pointer",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
});

export const Dashboard: React.FC = () => {
  const { timers, batteryRules, history, setView } = useStore();

  // Memoised derived data — not recomputed unless source arrays change
  const active = useMemo(
    () => timers.filter((t) => t.status === "running" || t.status === "paused"),
    [timers],
  );
  const activeBatteryRules = useMemo(
    () => batteryRules.filter((r) => r.enabled),
    [batteryRules],
  );
  const eventsToday = useMemo(
    () => history.filter((h) => Date.now() - h.timestamp < 86_400_000).length,
    [history],
  );
  const recentHistory = useMemo(() => history.slice(0, 3), [history]);

  return (
    <div
      style={{
        padding: "24px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Header clock */}
      <Card
        glow
        style={{ padding: "28px 24px", background: "var(--bg-elevated)" }}
      >
        <LiveClock />
        <div
          style={{
            marginTop: 20,
            padding: "16px 0 0",
            borderTop: "1px solid var(--border)",
          }}
        >
          <BatteryWidget />
        </div>
      </Card>

      {/* Stats row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 12,
        }}
      >
        {[
          {
            label: "Active Timers",
            value: active.length,
            icon: "◷",
            color: "var(--accent)",
            action: () => setView("timer"),
          },
          {
            label: "Battery Rules",
            value: activeBatteryRules.length,
            icon: "⚡",
            color: "var(--info)",
            action: () => setView("battery"),
          },
          {
            label: "Events Today",
            value: eventsToday,
            icon: "≡",
            color: "var(--success)",
            action: () => setView("history"),
          },
        ].map(({ label, value, icon, color, action }) => (
          <Card
            key={label}
            onClick={action}
            style={{
              padding: "16px",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div
              style={{
                fontSize: 28,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color,
              }}
            >
              {value}
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              {label}
            </div>
          </Card>
        ))}
      </div>

      {/* Active timers */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-secondary)",
            }}
          >
            ACTIVE TIMERS
          </span>
          <Btn size="sm" variant="ghost" onClick={() => setView("timer")}>
            + New
          </Btn>
        </div>
        {active.length === 0 ? (
          <div
            style={{
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>◷</div>
            <div style={{ fontSize: 13 }}>No active timers</div>
            <Btn
              size="sm"
              variant="outline"
              style={{ marginTop: 12 }}
              onClick={() => setView("timer")}
            >
              Create a timer
            </Btn>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {/* Pass timer object directly — no find() lookup in each card */}
            {active.map((t) => (
              <ActiveTimerCard key={t.id} timer={t} />
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-secondary)",
            marginBottom: 10,
          }}
        >
          QUICK POWER ACTIONS
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
          }}
        >
          {(
            [
              "shutdown",
              "restart",
              "hibernate",
              "sleep",
              "lock",
              "logoff",
            ] as const
          ).map((action) => {
            const meta = ACTION_META[action];
            return (
              <button
                key={action}
                className="quick-action-btn"
                onClick={() => setView("power")}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  padding: "12px 8px",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  color: meta.color,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                <span style={{ fontSize: 20 }}>{meta.icon}</span>
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent history */}
      {recentHistory.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              RECENT EVENTS
            </span>
            <Btn size="sm" variant="ghost" onClick={() => setView("history")}>
              View all
            </Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentHistory.map((h) => {
              const meta = ACTION_META[h.action];
              return (
                <div
                  key={h.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span style={{ fontSize: 14, color: meta.color }}>
                    {meta.icon}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 12,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {h.label}
                  </span>
                  <ActionBadge action={h.action} size="sm" />
                  <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                    {new Date(h.timestamp).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
