import React, { useState, useRef } from "react";
import type { PowerAction } from "../store";
import { ACTION_META } from "../utils";

/* ─── Button ─────────────────────────────────────────────────── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}
export const Btn: React.FC<BtnProps> = ({
  variant = "ghost",
  size = "md",
  icon,
  children,
  className = "",
  ...p
}) => {
  const variantClass =
    {
      primary: "btn-primary",
      ghost: "btn-ghost",
      danger: "btn-danger",
      outline: "btn-outline",
    }[variant] ?? "btn-ghost";

  const sizeClass =
    {
      sm: "btn-sm",
      md: "btn-md",
      lg: "btn-lg",
    }[size] ?? "btn-md";

  const classes = ["btn", variantClass, sizeClass, className]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      className={classes}
      {...p}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  );
};

/* ─── Toggle ─────────────────────────────────────────────────── */
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  size = "md",
  disabled,
}) => {
  const w = size === "sm" ? 32 : 44;
  const h = size === "sm" ? 18 : 24;
  const d = size === "sm" ? 14 : 18;
  const pad = 2;
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: w,
        height: h,
        background: checked ? "var(--accent)" : "var(--bg-overlay)",
        border: "1px solid",
        borderColor: checked ? "var(--accent)" : "var(--border)",
        borderRadius: h,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background 0.2s, border-color 0.2s",
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: pad,
          left: checked ? w - d - pad : pad,
          width: d,
          height: d,
          background: checked ? "#0a0c10" : "var(--text-muted)",
          borderRadius: "50%",
          transition: "left 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      />
    </button>
  );
};

/* ─── ActionBadge ─────────────────────────────────────────────── */
export const ActionBadge: React.FC<{
  action: PowerAction;
  size?: "sm" | "md";
}> = ({ action, size = "md" }) => {
  const meta = ACTION_META[action];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: `${meta.color}18`,
        color: meta.color,
        border: `1px solid ${meta.color}40`,
        borderRadius: "var(--radius-sm)",
        padding: size === "sm" ? "2px 7px" : "3px 10px",
        fontSize: size === "sm" ? 11 : 12,
        fontWeight: 500,
        letterSpacing: "0.02em",
      }}
    >
      <span style={{ fontSize: size === "sm" ? 10 : 12 }}>{meta.icon}</span>
      {meta.label}
    </span>
  );
};

/* ─── ActionPicker ────────────────────────────────────────────── */
interface ActionPickerProps {
  value: PowerAction;
  onChange: (a: PowerAction) => void;
  exclude?: PowerAction[];
}
export const ActionPicker: React.FC<ActionPickerProps> = ({
  value,
  onChange,
  exclude = [],
}) => {
  const actions = (Object.keys(ACTION_META) as PowerAction[]).filter(
    (a) => !exclude.includes(a),
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {actions.map((a) => {
        const meta = ACTION_META[a];
        const sel = value === a;
        return (
          <button
            key={a}
            onClick={() => onChange(a)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${sel ? meta.color : "var(--border)"}`,
              background: sel ? `${meta.color}20` : "var(--bg-overlay)",
              color: sel ? meta.color : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }}>{meta.icon}</span>
            {meta.label}
          </button>
        );
      })}
    </div>
  );
};

/* ─── Input ───────────────────────────────────────────────────── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  suffix?: React.ReactNode;
}
export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  suffix,
  className = "",
  ...p
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    {label && (
      <label
        style={{
          fontSize: 12,
          color: "var(--text-secondary)",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
    )}
    <div
      style={{ position: "relative", display: "flex", alignItems: "center" }}
    >
      <input
        style={{
          width: "100%",
          background: "var(--bg-overlay)",
          border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
          padding: "8px 12px",
          fontSize: 13,
          paddingRight: suffix ? 40 : 12,
          transition: "border-color 0.15s",
        }}
        {...p}
      />
      {suffix && (
        <span
          style={{
            position: "absolute",
            right: 12,
            color: "var(--text-muted)",
            pointerEvents: "none",
            fontSize: 12,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
    {(hint || error) && (
      <span
        style={{
          fontSize: 11,
          color: error ? "var(--danger)" : "var(--text-muted)",
        }}
      >
        {error || hint}
      </span>
    )}
  </div>
);

/* ─── Card ────────────────────────────────────────────────────── */
interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
}
export const Card: React.FC<CardProps> = ({
  children,
  style,
  className,
  onClick,
  glow,
}) => (
  <div
    onClick={onClick}
    style={{
      background: "var(--bg-surface)",
      border: `1px solid ${glow ? "var(--border-accent)" : "var(--border)"}`,
      borderRadius: "var(--radius-lg)",
      padding: "20px",
      boxShadow: glow ? "var(--shadow-accent)" : "var(--shadow-sm)",
      cursor: onClick ? "pointer" : "default",
      transition: "border-color 0.2s, box-shadow 0.2s",
      ...style,
    }}
    className={className}
  >
    {children}
  </div>
);

/* ─── SectionHeader ───────────────────────────────────────────── */
export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 16,
    }}
  >
    <div>
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          {subtitle}
        </p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ─── EmptyState ──────────────────────────────────────────────── */
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ icon, title, subtitle, action }) => (
  <div
    style={{
      textAlign: "center",
      padding: "40px 20px",
      color: "var(--text-muted)",
    }}
  >
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <p
      style={{
        fontSize: 14,
        fontWeight: 500,
        color: "var(--text-secondary)",
        marginBottom: 6,
      }}
    >
      {title}
    </p>
    {subtitle && <p style={{ fontSize: 12, marginBottom: 16 }}>{subtitle}</p>}
    {action}
  </div>
);

/* ─── Tooltip wrapper (simple) ────────────────────────────────── */
export const Tip: React.FC<{ text: string; children: React.ReactNode }> = ({
  text,
  children,
}) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "5px 9px",
            fontSize: 11,
            whiteSpace: "nowrap",
            color: "var(--text-secondary)",
            marginBottom: 4,
            zIndex: 999,
            pointerEvents: "none",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};

/* ─── Slider ──────────────────────────────────────────────────── */
interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}
export const Slider: React.FC<SliderProps> = ({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  format,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--accent)",
          fontFamily: "var(--font-mono)",
          fontWeight: 600,
        }}
      >
        {format ? format(value) : value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(+e.target.value)}
      style={{
        WebkitAppearance: "none",
        height: 4,
        borderRadius: 2,
        background: `linear-gradient(to right, var(--accent) ${((value - min) / (max - min)) * 100}%, var(--bg-overlay) 0)`,
        cursor: "pointer",
      }}
    />
  </div>
);
