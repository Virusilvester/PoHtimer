import React, { useMemo, useState } from "react";
import { useStore, type BatteryRule } from "../store";
import { Card, Toggle, ActionPicker, ActionBadge, Btn, SectionHeader, Input, Slider } from "./ui";

const RULE_ICONS: Record<BatteryRule["type"], string> = {
  low: "🔋",
  percent: "%",
  unplug: "🔌",
};
const RULE_LABELS: Record<BatteryRule["type"], string> = {
  low: "Low Battery",
  percent: "Battery at %",
  unplug: "Power Disconnected",
};
const RULE_DESC: Record<BatteryRule["type"], string> = {
  low: "Triggers when OS reports low battery threshold",
  percent: "Triggers when battery reaches specified %",
  unplug: "Triggers when charger is disconnected",
};

const RuleCard = React.memo<{ rule: BatteryRule }>(({ rule }) => {
  const { updateBatteryRule, removeBatteryRule, toggleBatteryRule } = useStore();
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
          cursor: "pointer",
          background: rule.enabled ? "transparent" : "rgba(0,0,0,0.2)",
          opacity: rule.enabled ? 1 : 0.65,
          transition: "opacity 0.2s",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: rule.enabled ? "var(--accent-dim)" : "var(--bg-overlay)",
            border: `1px solid ${rule.enabled ? "var(--border-accent)" : "var(--border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: rule.enabled ? "var(--accent)" : "var(--text-muted)",
            flexShrink: 0,
          }}
        >
          {RULE_ICONS[rule.type]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}
            >
              {rule.label}
            </span>
            {rule.type === "percent" && rule.percent !== undefined && (
              <span
                style={{
                  fontSize: 10,
                  color: "var(--warn)",
                  border: "1px solid var(--warn)40",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                ≤ {rule.percent}%
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {RULE_DESC[rule.type]}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ActionBadge action={rule.action} size="sm" />
          <Toggle
            checked={rule.enabled}
            onChange={() => toggleBatteryRule(rule.id)}
          />
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div
          style={{
            padding: "0 20px 20px",
            borderTop: "1px solid var(--border)",
            animation: "slide-up 0.2s ease",
          }}
        >
          <div
            style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}
          >
            <Input
              label="Rule label"
              value={rule.label}
              onChange={(e) => updateBatteryRule(rule.id, { label: e.target.value })}
            />

            {rule.type === "percent" && (
              <Slider
                label="Trigger at battery level"
                min={1}
                max={99}
                step={1}
                value={rule.percent ?? 20}
                onChange={(v) => updateBatteryRule(rule.id, { percent: v })}
                format={(v) => `${v}%`}
              />
            )}

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                  marginBottom: 8,
                }}
              >
                Action to perform
              </div>
              <ActionPicker
                value={rule.action}
                onChange={(a) => updateBatteryRule(rule.id, { action: a })}
                exclude={rule.type === "unplug" ? ["none"] : []}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn
                size="sm"
                variant="danger"
                onClick={() => removeBatteryRule(rule.id)}
              >
                Delete Rule
              </Btn>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
});

const BatteryMeter = React.memo(() => {
  const battery = useStore((s) => s.battery);
  const pct = battery.level ?? 0;
  const hasBattery = battery.present && battery.level != null;
  const onAc = battery.plugged;
  const color = !hasBattery
    ? "var(--text-muted)"
    : pct <= 10
      ? "var(--danger)"
      : pct <= 25
        ? "var(--warn)"
        : pct <= 50
          ? "var(--accent)"
          : "var(--success)";

  const segments = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => {
        const threshold = (i + 1) * 5;
        return hasBattery && threshold <= pct;
      }),
    [hasBattery, pct],
  );

  return (
    <Card style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Battery icon */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={80} height={140}>
            {/* Terminal */}
            <rect x={25} y={0} width={30} height={8} rx={3} fill="var(--bg-overlay)" />
            {/* Body */}
            <rect
              x={5}
              y={8}
              width={70}
              height={126}
              rx={8}
              fill="var(--bg-overlay)"
              stroke="var(--border)"
              strokeWidth={2}
            />
            {/* Fill */}
            <rect
              x={9}
              y={12 + (1 - (hasBattery ? pct : 0) / 100) * 118}
              width={62}
              height={(hasBattery ? pct : 0) / 100 * 118}
              rx={4}
              fill={color}
              style={{
                transition: "all 1s ease",
                filter: `drop-shadow(0 0 8px ${color}60)`,
              }}
            />
            {/* % text */}
            <text
              x={40}
              y={76}
              textAnchor="middle"
              fontSize={16}
              fontFamily="var(--font-mono)"
              fontWeight="700"
              fill="white"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {hasBattery ? `${pct}%` : "N/A"}
            </text>
            {battery.charging && (
              <text x={40} y={96} textAnchor="middle" fontSize={18} fill="white">
                ⚡
              </text>
            )}
          </svg>
        </div>

        {/* Info */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 36,
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color,
              lineHeight: 1,
            }}
          >
            {hasBattery ? (
              <>
                {pct}
                <span style={{ fontSize: 20 }}>%</span>
              </>
            ) : (
              <span style={{ fontSize: 16 }}>N/A</span>
            )}
          </div>
          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
            {!hasBattery
              ? "No battery detected"
              : onAc
                ? battery.charging
                  ? "⚡ Charging"
                  : "Plugged in"
                : "🔋 On battery"}
          </div>

          {/* Segment bar */}
          <div style={{ display: "flex", gap: 3, marginTop: 16, flexWrap: "wrap" }}>
            {segments.map((on, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 20,
                  borderRadius: 3,
                  background: on ? color : "var(--bg-overlay)",
                  border: `1px solid ${on ? `${color}60` : "var(--border)"}`,
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: 16,
            }}
          >
            {[
              {
                label: "Status",
                value: !hasBattery
                  ? "N/A"
                  : battery.charging
                    ? "Charging"
                    : onAc
                      ? "Plugged"
                      : "Discharging",
              },
              { label: "Health", value: "Good" },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
                  {label}
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
});

export const BatteryView: React.FC = () => {
  const { batteryRules, addBatteryRule } = useStore();

  // Memoised so RULES count label doesn't trigger full re-render
  const activeCount = useMemo(
    () => batteryRules.filter((r) => r.enabled).length,
    [batteryRules],
  );

  const addRule = (type: BatteryRule["type"]) => {
    addBatteryRule({
      enabled: true,
      type,
      percent: type === "percent" ? 20 : undefined,
      action: type === "unplug" ? "lock" : "hibernate",
      label: RULE_LABELS[type],
    });
  };

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <SectionHeader
        title="Battery Management"
        subtitle="Automatic power actions based on battery state"
      />

      <BatteryMeter />

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <span
            style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}
          >
            RULES ({activeCount} active)
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {(["low", "percent", "unplug"] as const).map((type) => (
              <Btn key={type} size="sm" variant="outline" onClick={() => addRule(type)}>
                + {RULE_LABELS[type]}
              </Btn>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {batteryRules.map((r: BatteryRule) => (
            <RuleCard key={r.id} rule={r} />
          ))}
        </div>

        {/* Info panel */}
        <div
          style={{
            marginTop: 20,
            padding: "14px 16px",
            background: "var(--info)10",
            border: "1px solid var(--info)30",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            style={{ fontSize: 12, color: "var(--info)", fontWeight: 600, marginBottom: 6 }}
          >
            ℹ Battery monitoring notes
          </div>
          <ul
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              listStyle: "disc",
              paddingLeft: 16,
            }}
          >
            <li>Rules only apply to laptops or devices with batteries.</li>
            <li>
              "Low Battery" uses the OS threshold (~15–20% depending on Windows settings).
            </li>
            <li>Multiple rules can be active simultaneously.</li>
            <li>
              Actions execute in priority order: shutdown &gt; restart &gt; hibernate &gt;
              sleep &gt; lock.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
