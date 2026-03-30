import React, { useState } from "react";
import { useStore, type TimerEntry } from "../store";
import {
  Card,
  Btn,
  Input,
  ActionPicker,
  ActionBadge,
  Toggle,
  SectionHeader,
  EmptyState,
} from "./ui";
import {
  formatDuration,
  formatDurationLong,
  parseTimeInput,
  QUICK_DURATIONS,
} from "../utils";

const TimerProgressRing: React.FC<{ timer: TimerEntry }> = ({ timer }) => {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = timer.duration > 0 ? 1 - timer.remaining / timer.duration : 0;
  const offset = circ * (1 - pct);
  const urgent = timer.remaining <= 60 && timer.status === "running";
  const expired = timer.status === "expired";
  const color = expired
    ? "var(--success)"
    : urgent
      ? "var(--warn)"
      : "var(--accent)";
  return (
    <svg width={120} height={120}>
      {/* Track */}
      <circle
        cx={60}
        cy={60}
        r={r}
        fill="none"
        stroke="var(--bg-overlay)"
        strokeWidth={6}
      />
      {/* Progress */}
      <circle
        cx={60}
        cy={60}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{
          transition: "stroke-dashoffset 1s linear, stroke 0.3s",
          filter: `drop-shadow(0 0 6px ${color}80)`,
        }}
      />
      {/* Inner glow */}
      {!expired && (
        <circle
          cx={60}
          cy={60}
          r={44}
          fill="none"
          stroke={`${color}15`}
          strokeWidth={28}
        />
      )}
      {/* Text */}
      <text
        x={60}
        y={54}
        textAnchor="middle"
        fontSize={expired ? 11 : 15}
        fontFamily="var(--font-mono)"
        fontWeight="700"
        fill={color}
      >
        {expired ? "Done" : formatDuration(timer.remaining)}
      </text>
      {!expired && (
        <text
          x={60}
          y={70}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-body)"
          fill="var(--text-muted)"
        >
          of {formatDurationLong(timer.duration)}
        </text>
      )}
    </svg>
  );
};

const TimerCard: React.FC<{ timer: TimerEntry }> = ({ timer }) => {
  const { toggleTimer, removeTimer, updateTimer } = useStore();

  return (
    <Card glow={timer.status === "running"} style={{ padding: "20px" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Ring */}
        <div style={{ flexShrink: 0 }}>
          <TimerProgressRing timer={timer} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {timer.label}
            </span>
            {timer.repeat && (
              <span
                style={{
                  fontSize: 10,
                  color: "var(--info)",
                  border: "1px solid var(--info)40",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                ↺ REPEAT
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                color:
                  timer.status === "running"
                    ? "var(--success)"
                    : timer.status === "paused"
                      ? "var(--warn)"
                      : timer.status === "expired"
                        ? "var(--info)"
                        : "var(--text-muted)",
                border: "1px solid currentColor",
                borderRadius: 4,
                padding: "1px 6px",
                opacity: 0.9,
                marginLeft: "auto",
              }}
            >
              {timer.status.toUpperCase()}
            </span>
          </div>

          <div style={{ marginBottom: 10 }}>
            <ActionBadge action={timer.action} />
          </div>

          {/* Progress bar */}
          <div
            style={{
              height: 3,
              background: "var(--bg-overlay)",
              borderRadius: 2,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${timer.duration > 0 ? (1 - timer.remaining / timer.duration) * 100 : 0}%`,
                background:
                  timer.status === "expired"
                    ? "var(--success)"
                    : "var(--accent)",
                borderRadius: 2,
                transition: "width 1s linear",
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {timer.status !== "expired" && (
              <Btn
                size="sm"
                variant="outline"
                onClick={() => toggleTimer(timer.id)}
              >
                {timer.status === "running" ? "⏸ Pause" : "▶ Resume"}
              </Btn>
            )}
            {timer.status === "expired" && (
              <Btn
                size="sm"
                variant="outline"
                onClick={() =>
                  updateTimer(timer.id, {
                    remaining: timer.duration,
                    status: "running",
                  })
                }
              >
                ↺ Restart
              </Btn>
            )}
            <Btn
              size="sm"
              variant="ghost"
              onClick={() =>
                updateTimer(timer.id, {
                  remaining: timer.duration,
                  status: "running",
                })
              }
            >
              ⟳ Reset
            </Btn>
            <Btn
              size="sm"
              variant="danger"
              onClick={() => removeTimer(timer.id)}
            >
              ✕ Remove
            </Btn>
          </div>
        </div>
      </div>
    </Card>
  );
};

const CreateTimerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addTimer } = useStore();
  const [label, setLabel] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [action, setAction] = useState<any>("shutdown");
  const [repeat, setRepeat] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = () => {
    const duration = parseTimeInput(timeStr);
    if (!label.trim()) {
      setError("Please enter a timer label");
      return;
    }
    if (!duration || duration <= 0) {
      setError("Please enter a valid duration (e.g. 30m, 1h30m, 90:00)");
      return;
    }
    addTimer({ label: label.trim(), duration, action, repeat });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-xl)",
          padding: 28,
          width: 520,
          maxWidth: "95vw",
          animation: "slide-up 0.25s ease",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              New Timer
            </h2>
            <p
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              Schedule a power action
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--bg-overlay)",
              border: "none",
              borderRadius: 6,
              width: 28,
              height: 28,
              color: "var(--text-muted)",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input
            label="Timer label"
            placeholder="e.g. Sleep after movie"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setError("");
            }}
          />

          <div>
            <Input
              label="Duration"
              placeholder="e.g. 30m, 1h30m, 90:00, 5400"
              value={timeStr}
              onChange={(e) => {
                setTimeStr(e.target.value);
                setError("");
              }}
              hint="Formats: 1h30m, 1:30:00, 90m, 5400 (seconds)"
              error={error && error.includes("duration") ? error : ""}
            />
            {/* Quick picks */}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginTop: 8,
              }}
            >
              {QUICK_DURATIONS.map(({ label: ql, value }) => (
                <button
                  key={value}
                  onClick={() => {
                    setTimeStr(String(value));
                    setError("");
                  }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    background:
                      timeStr === String(value)
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${timeStr === String(value) ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      timeStr === String(value)
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {ql}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontWeight: 500,
                marginBottom: 8,
              }}
            >
              Action when timer fires
            </div>
            <ActionPicker value={action} onChange={setAction} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                Repeat timer
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Restart automatically after firing
              </div>
            </div>
            <Toggle checked={repeat} onChange={setRepeat} />
          </div>

          {error && !error.includes("duration") && (
            <div
              style={{
                fontSize: 12,
                color: "var(--danger)",
                padding: "8px 12px",
                background: "var(--danger-dim)",
                borderRadius: 6,
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 24,
          }}
        >
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn variant="primary" onClick={handleCreate}>
            ▶ Start Timer
          </Btn>
        </div>
      </div>
    </div>
  );
};

export const TimerView: React.FC = () => {
  const { timers, showCreateTimer, setShowCreateTimer } = useStore();

  const active = timers.filter(
    (t) => t.status === "running" || t.status === "paused",
  );
  const expired = timers.filter((t) => t.status === "expired");

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <SectionHeader
        title="Power Timers"
        subtitle="Schedule automated power actions"
        action={
          <Btn variant="primary" onClick={() => setShowCreateTimer(true)}>
            + New Timer
          </Btn>
        }
      />

      {timers.length === 0 ? (
        <EmptyState
          icon="◷"
          title="No timers yet"
          subtitle="Create a timer to schedule shutdown, restart, hibernate, and more"
          action={
            <Btn variant="primary" onClick={() => setShowCreateTimer(true)}>
              + Create Timer
            </Btn>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {active.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  marginTop: 8,
                }}
              >
                RUNNING ({active.length})
              </div>
              {active.map((t) => (
                <TimerCard key={t.id} timer={t} />
              ))}
            </>
          )}
          {expired.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  marginTop: 8,
                }}
              >
                COMPLETED ({expired.length})
              </div>
              {expired.map((t) => (
                <TimerCard key={t.id} timer={t} />
              ))}
            </>
          )}
        </div>
      )}

      {showCreateTimer && (
        <CreateTimerModal onClose={() => setShowCreateTimer(false)} />
      )}
    </div>
  );
};
