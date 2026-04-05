import React from "react";
import { useStore } from "../store";
import { Card, Toggle, Slider, SectionHeader } from "./ui";

/* ─── SettingRow ─────────────────────────────────────── */
const SettingRow: React.FC<{
  label: string;
  description?: string;
  control: React.ReactNode;
  noBorder?: boolean;
}> = ({ label, description, control, noBorder }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "14px 0",
      borderBottom: noBorder ? "none" : "1px solid var(--border)",
    }}
  >
    <div style={{ flex: 1 }}>
      <div
        style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}
      >
        {label}
      </div>
      {description && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
          {description}
        </div>
      )}
    </div>
    <div style={{ flexShrink: 0 }}>{control}</div>
  </div>
);

/* ─── Section wrapper ─────────────────────────────────── */
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card style={{ padding: "20px", marginBottom: 16 }}>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--accent)",
        letterSpacing: "0.08em",
        marginBottom: 4,
      }}
    >
      {title}
    </div>
    {children}
  </Card>
);

/* ─── Digital style cards ──────────────────────────────── */
type DigitalStyle =
  | "minimal"
  | "glass"
  | "panel"
  | "edge"
  | "segment"
  | "matrix"
  | "flip";
type AnalogStyle =
  | "classic"
  | "neon"
  | "minimal"
  | "halo"
  | "orbital"
  | "swiss"
  | "stealth";

const DIGITAL_STYLES: {
  id: DigitalStyle;
  label: string;
  tag: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "glass",
    label: "Glass",
    tag: "Default",
    preview: (
      <div
        style={{
          background: "rgba(10,12,16,0.65)",
          border: "1px solid rgba(255,185,0,0.35)",
          borderRadius: 6,
          padding: "4px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--accent)",
          boxShadow: "0 0 10px rgba(255,185,0,0.2)",
          letterSpacing: "0.04em",
        }}
      >
        12:34
      </div>
    ),
  },
  {
    id: "minimal",
    label: "Minimal",
    tag: "Clean",
    preview: (
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "rgba(240,242,245,0.45)",
          letterSpacing: "0.06em",
        }}
      >
        12:34
      </div>
    ),
  },
  {
    id: "panel",
    label: "Panel",
    tag: "Dark",
    preview: (
      <div
        style={{
          background: "rgba(20,24,32,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 6,
          padding: "4px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "rgba(240,242,245,0.85)",
          letterSpacing: "0.04em",
        }}
      >
        12:34
      </div>
    ),
  },
  {
    id: "edge",
    label: "Edge",
    tag: "Bold",
    preview: (
      <div
        style={{
          background: "rgba(8,10,14,0.9)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 6,
          padding: "4px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "rgba(240,242,245,0.9)",
          boxShadow: "0 0 0 1px rgba(255,185,0,0.12)",
          letterSpacing: "0.04em",
        }}
      >
        12:34
      </div>
    ),
  },
  {
    id: "matrix",
    label: "Matrix",
    tag: "Hacker",
    preview: (
      <div
        style={{
          background: "#000",
          border: "1px solid #003300",
          borderRadius: 4,
          padding: "4px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "#00ff00",
          textShadow: "0 0 8px #00ff00",
          letterSpacing: "0.06em",
        }}
      >
        12:34
      </div>
    ),
  },
  {
    id: "segment",
    label: "Segment",
    tag: "Retro",
    preview: (
      <div
        style={{
          background: "linear-gradient(145deg, #0d1016, #080a0e)",
          border: "2px solid rgba(255,255,255,0.08)",
          borderRadius: 6,
          padding: "4px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--accent)",
          boxShadow:
            "inset 0 0 8px rgba(255,185,0,0.25), 0 0 6px rgba(255,185,0,0.15)",
          letterSpacing: "0.12em",
        }}
      >
        88:88
      </div>
    ),
  },
  {
    id: "flip",
    label: "Flip",
    tag: "Classic",
    preview: (
      <div style={{ display: "flex", gap: 2 }}>
        {["1", "2", ":", "3", "4"].map((c, i) => (
          <div
            key={i}
            style={{
              background:
                c === ":"
                  ? "transparent"
                  : "linear-gradient(180deg, #2a2e38 0%, #14171d 100%)",
              border: c === ":" ? "none" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 3,
              padding: "2px 4px",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              color: "var(--accent)",
              boxShadow: c === ":" ? "none" : "inset 0 2px 3px rgba(0,0,0,0.5)",
            }}
          >
            {c}
          </div>
        ))}
      </div>
    ),
  },
];

/* ─── Analog style SVG previews ─────────────────────────── */
const ANALOG_STYLES: {
  id: AnalogStyle;
  label: string;
  tag: string;
  preview: React.ReactNode;
}[] = [
  {
    id: "classic",
    label: "Classic",
    tag: "Vintage",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="rgba(18,14,10,0.92)"
          stroke="rgba(200,170,110,0.55)"
          strokeWidth={1.5}
        />
        <circle
          cx={23}
          cy={23}
          r={18}
          fill="none"
          stroke="rgba(200,170,110,0.18)"
          strokeWidth={0.5}
        />
        {[0, 3, 6, 9].map((i) => {
          const a = (i / 12) * 360 - 90;
          const x = 23 + Math.cos((a * Math.PI) / 180) * 16;
          const y = 23 + Math.sin((a * Math.PI) / 180) * 16;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.5}
              fill="rgba(200,170,110,0.8)"
            />
          );
        })}
        {/* Hour hand */}
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={13}
          stroke="rgba(220,200,160,0.95)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        {/* Minute hand */}
        <line
          x1={23}
          y1={23}
          x2={32}
          y2={23}
          stroke="rgba(220,200,160,0.85)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        {/* Second hand */}
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={9}
          stroke="#e8621a"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={27}
          stroke="#e8621a"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <circle cx={23} cy={23} r={2} fill="#e8621a" />
        <circle cx={23} cy={23} r={1} fill="#0a0c10" />
      </svg>
    ),
  },
  {
    id: "neon",
    label: "Neon",
    tag: "Cyber",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <defs>
          <filter id="nc">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="np">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={23} cy={23} r={21} fill="rgba(4,6,12,0.96)" />
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="none"
          stroke="#00f5ff"
          strokeWidth={1}
          filter="url(#nc)"
        />
        <circle
          cx={23}
          cy={23}
          r={22.5}
          fill="none"
          stroke="rgba(0,245,255,0.1)"
          strokeWidth={3}
        />
        {[0, 3, 6, 9].map((i) => {
          const a = (i / 12) * 360 - 90;
          const x1 = 23 + Math.cos((a * Math.PI) / 180) * 17;
          const y1 = 23 + Math.sin((a * Math.PI) / 180) * 17;
          const x2 = 23 + Math.cos((a * Math.PI) / 180) * 19.5;
          const y2 = 23 + Math.sin((a * Math.PI) / 180) * 19.5;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#00f5ff"
              strokeWidth={1.5}
              filter="url(#nc)"
            />
          );
        })}
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={13}
          stroke="#00f5ff"
          strokeWidth={2}
          strokeLinecap="round"
          filter="url(#nc)"
        />
        <line
          x1={23}
          y1={23}
          x2={32}
          y2={23}
          stroke="#ff00aa"
          strokeWidth={1.5}
          strokeLinecap="round"
          filter="url(#np)"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={9}
          stroke="#ffff00"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <circle cx={23} cy={23} r={2} fill="#fff" filter="url(#nc)" />
      </svg>
    ),
  },
  {
    id: "minimal",
    label: "Minimal",
    tag: "Ghost",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="rgba(10,12,16,0.12)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
        {[0, 3, 6, 9].map((i) => {
          const a = (i / 12) * 360 - 90;
          const x = 23 + Math.cos((a * Math.PI) / 180) * 19;
          const y = 23 + Math.sin((a * Math.PI) / 180) * 19;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1.2}
              fill="rgba(255,255,255,0.3)"
            />
          );
        })}
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={14}
          stroke="rgba(255,255,255,0.88)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={32}
          y2={23}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={9}
          stroke="var(--accent)"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={27}
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <circle cx={23} cy={23} r={1.8} fill="var(--accent)" />
      </svg>
    ),
  },
  {
    id: "halo",
    label: "Halo",
    tag: "Aurora",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <defs>
          <linearGradient id="hr" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,100,200,0.9)" />
            <stop offset="50%" stopColor="rgba(100,200,255,0.9)" />
            <stop offset="100%" stopColor="rgba(100,255,180,0.9)" />
          </linearGradient>
          <radialGradient id="hd" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(30,24,60,0.88)" />
            <stop offset="100%" stopColor="rgba(8,6,18,0.75)" />
          </radialGradient>
          <filter id="hg">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={23}
          cy={23}
          r={22}
          fill="none"
          stroke="url(#hr)"
          strokeWidth={3}
          opacity={0.4}
          filter="url(#hg)"
        />
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="url(#hd)"
          stroke="url(#hr)"
          strokeWidth={1.5}
        />
        {[0, 3, 6, 9].map((i) => {
          const a = (i / 12) * 360 - 90;
          const x1 = 23 + Math.cos((a * Math.PI) / 180) * 15;
          const y1 = 23 + Math.sin((a * Math.PI) / 180) * 15;
          const x2 = 23 + Math.cos((a * Math.PI) / 180) * 19;
          const y2 = 23 + Math.sin((a * Math.PI) / 180) * 19;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.7)"
              strokeWidth={1.5}
            />
          );
        })}
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={13}
          stroke="rgba(255,255,255,0.95)"
          strokeWidth={2.2}
          strokeLinecap="round"
          filter="url(#hg)"
        />
        <line
          x1={23}
          y1={23}
          x2={32}
          y2={23}
          stroke="rgba(180,220,255,0.9)"
          strokeWidth={1.5}
          strokeLinecap="round"
          filter="url(#hg)"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={9}
          stroke="#ffb900"
          strokeWidth={0.8}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={27}
          stroke="#ffb900"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={23} cy={23} r={2.2} fill="#ffb900" filter="url(#hg)" />
        <circle cx={23} cy={23} r={1} fill="#0a0c10" />
      </svg>
    ),
  },
  {
    id: "swiss",
    label: "Swiss",
    tag: "Luxury",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <defs>
          <linearGradient id="sv" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f0f0" />
            <stop offset="100%" stopColor="#888" />
          </linearGradient>
        </defs>
        <circle cx={23} cy={23} r={22} fill="url(#sv)" />
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="#1a1d21"
          stroke="#333"
          strokeWidth={0.5}
        />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 360 - 90;
          const isC = i % 3 === 0;
          const p1x = 23 + Math.cos((a * Math.PI) / 180) * 18.5;
          const p1y = 23 + Math.sin((a * Math.PI) / 180) * 18.5;
          const p2x = 23 + Math.cos((a * Math.PI) / 180) * 20;
          const p2y = 23 + Math.sin((a * Math.PI) / 180) * 20;
          return (
            <line
              key={i}
              x1={p1x}
              y1={p1y}
              x2={p2x}
              y2={p2y}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={isC ? 2 : 1}
            />
          );
        })}
        <text
          x={23}
          y={17}
          textAnchor="middle"
          fontSize={4}
          fill="rgba(255,255,255,0.6)"
          letterSpacing="0.3"
        >
          POHTIMER
        </text>
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={13}
          stroke="url(#sv)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={32}
          y2={23}
          stroke="url(#sv)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={8}
          stroke="#ff4d4d"
          strokeWidth={0.8}
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={27}
          stroke="#ff4d4d"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <circle cx={23} cy={23} r={2.5} fill="url(#sv)" />
        <circle cx={23} cy={23} r={1.2} fill="#222" />
        <circle cx={23} cy={23} r={0.6} fill="#ff4d4d" />
      </svg>
    ),
  },
  {
    id: "stealth",
    label: "Stealth",
    tag: "Tactical",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <defs>
          <filter id="rg2">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feFlood floodColor="#ff3333" result="c" />
            <feComposite in="c" in2="b" operator="in" result="s" />
            <feMerge>
              <feMergeNode in="s" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle cx={23} cy={23} r={22} fill="#0d0f12" />
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="#0a0c0f"
          stroke="#1a1d22"
          strokeWidth={1}
        />
        {[0, 3, 6, 9].map((i) => {
          const a = (i / 12) * 360 - 90;
          const px = 23 + Math.cos((a * Math.PI) / 180) * 18;
          const py = 23 + Math.sin((a * Math.PI) / 180) * 18;
          const sz = 3;
          return (
            <polygon
              key={i}
              points={`${px},${py - sz} ${px - sz * 0.6},${py + sz * 0.4} ${px + sz * 0.6},${py + sz * 0.4}`}
              fill="#ff3333"
              transform={`rotate(${a + 90} ${px} ${py})`}
              filter="url(#rg2)"
            />
          );
        })}
        <path
          d="M23,23 L21,16 L23,14 L25,16 Z"
          fill="#2a2f35"
          stroke="#3a4149"
          strokeWidth={0.5}
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={15}
          stroke="#4a5568"
          strokeWidth={1.5}
        />
        <path
          d="M23,23 L21.5,23 L23,9 L24.5,23 Z"
          fill="#2a2f35"
          stroke="#3a4149"
          strokeWidth={0.5}
        />
        <line
          x1={23}
          y1={23}
          x2={32}
          y2={23}
          stroke="#4a5568"
          strokeWidth={1}
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={8}
          stroke="#ff3333"
          strokeWidth={0.8}
          filter="url(#rg2)"
        />
        <line
          x1={23}
          y1={23}
          x2={23}
          y2={29}
          stroke="#ff3333"
          strokeWidth={2}
          filter="url(#rg2)"
        />
        <circle
          cx={23}
          cy={23}
          r={3.5}
          fill="none"
          stroke="#2a2f35"
          strokeWidth={1.5}
        />
        <circle cx={23} cy={23} r={2} fill="#0d0f12" />
        <line
          x1={20}
          y1={23}
          x2={26}
          y2={23}
          stroke="#2a2f35"
          strokeWidth={0.5}
        />
        <line
          x1={23}
          y1={20}
          x2={23}
          y2={26}
          stroke="#2a2f35"
          strokeWidth={0.5}
        />
        <circle cx={23} cy={23} r={1} fill="#ff3333" filter="url(#rg2)" />
      </svg>
    ),
  },
  {
    id: "orbital",
    label: "Orbital",
    tag: "Space",
    preview: (
      <svg width={46} height={46} viewBox="0 0 46 46">
        <defs>
          <radialGradient id="og">
            <stop offset="0%" stopColor="#0f1419" />
            <stop offset="100%" stopColor="#05070a" />
          </radialGradient>
          <filter id="ogw">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={23}
          cy={23}
          r={21}
          fill="url(#og)"
          stroke="rgba(255,185,0,0.15)"
          strokeWidth={1}
        />
        {[7, 11, 15].map((r, i) => (
          <circle
            key={i}
            cx={23}
            cy={23}
            r={r}
            fill="none"
            stroke={`rgba(255,255,255,${0.04 + i * 0.02})`}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        ))}
        <circle cx={23} cy={16} r={3} fill="#3b9eff" filter="url(#ogw)" />
        <circle cx={30} cy={23} r={2.5} fill="#00d97e" filter="url(#ogw)" />
        <line
          x1={23}
          y1={23}
          x2={34}
          y2={23}
          stroke="rgba(255,185,0,0.3)"
          strokeWidth={0.8}
        />
        <circle
          cx={34}
          cy={23}
          r={1.5}
          fill="var(--accent)"
          filter="url(#ogw)"
        />
        <circle cx={23} cy={23} r={4} fill="var(--accent)" filter="url(#ogw)" />
        <circle cx={23} cy={23} r={2.5} fill="rgba(255,185,0,0.3)" />
        <circle cx={23} cy={23} r={1.5} fill="#fff" opacity={0.8} />
      </svg>
    ),
  },
];

/* ─── StyleCard ───────────────────────────────────────── */
const StyleCard: React.FC<{
  label: string;
  tag: string;
  preview: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}> = ({ label, tag, preview, selected, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      padding: "12px 8px",
      background: selected ? "var(--accent-dim)" : "var(--bg-elevated)",
      border: `1.5px solid ${selected ? "var(--border-accent)" : "var(--border)"}`,
      borderRadius: 10,
      cursor: "pointer",
      transition: "all 0.15s",
      outline: "none",
      flex: "1 1 calc(25% - 8px)",
      minWidth: 72,
    }}
    onMouseEnter={(e) => {
      if (!selected)
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border-accent)";
    }}
    onMouseLeave={(e) => {
      if (!selected)
        (e.currentTarget as HTMLButtonElement).style.borderColor =
          "var(--border)";
    }}
  >
    {/* Preview area */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 52,
      }}
    >
      {preview}
    </div>
    {/* Label */}
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: selected ? "var(--accent)" : "var(--text-secondary)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 9,
          color: selected ? "var(--accent)" : "var(--text-muted)",
          opacity: 0.7,
          marginTop: 1,
        }}
      >
        {tag}
      </div>
    </div>
    {/* Selected tick */}
    {selected && (
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          color: "#0a0c10",
          fontWeight: 800,
        }}
      >
        ✓
      </div>
    )}
  </button>
);

/* ─── StyleGrid ───────────────────────────────────────── */
const StyleGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
    {children}
  </div>
);

/* ─── Main SettingsView ───────────────────────────────── */
export const SettingsView: React.FC = () => {
  const { settings, updateSettings } = useStore();

  return (
    <div style={{ padding: "24px", height: "100%", overflowY: "auto" }}>
      <SectionHeader
        title="Settings"
        subtitle="Customize PoHtimer behavior and appearance"
      />

      {/* ── Appearance ──────────────────────────────── */}
      <Section title="APPEARANCE">
        <SettingRow
          label="Theme"
          description="Application color scheme"
          control={
            <div style={{ display: "flex", gap: 6 }}>
              {(["dark", "midnight", "amber"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => updateSettings({ theme: t })}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    background:
                      settings.theme === t
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.theme === t ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.theme === t
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          }
        />
        <SettingRow
          label="Accent color"
          description="Highlight color used throughout the app"
          noBorder
          control={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[
                "#ffb900",
                "#3b9eff",
                "#00d97e",
                "#ff4d4d",
                "#9b7fe8",
                "#ff6b35",
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => updateSettings({ accentColor: c })}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: c,
                    border: `2px solid ${settings.accentColor === c ? "white" : "transparent"}`,
                    cursor: "pointer",
                    transition: "border 0.15s",
                  }}
                />
              ))}
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) =>
                  updateSettings({ accentColor: e.target.value })
                }
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              />
            </div>
          }
        />
      </Section>

      {/* ── Desktop Overlay ─────────────────────────── */}
      <Section title="DESKTOP OVERLAY">
        {/* Clock mode toggle */}
        <SettingRow
          label="Clock mode"
          description="Type of overlay displayed when minimized"
          control={
            <div
              style={{
                display: "flex",
                background: "var(--bg-overlay)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 3,
                gap: 3,
              }}
            >
              {(["digital", "analog"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => updateSettings({ minimizeMode: m })}
                  style={{
                    padding: "5px 16px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 500,
                    background:
                      settings.minimizeMode === m
                        ? "var(--accent-dim)"
                        : "transparent",
                    border: `1px solid ${settings.minimizeMode === m ? "var(--border-accent)" : "transparent"}`,
                    color:
                      settings.minimizeMode === m
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "digital" ? "⬛ Digital" : "⭕ Analog"}
                </button>
              ))}
            </div>
          }
        />

        {/* Overlay size */}
        <div
          style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}
        >
          <Slider
            label="Overlay size"
            min={100}
            max={300}
            step={10}
            value={settings.clockSize}
            onChange={(v) => updateSettings({ clockSize: v })}
            format={(v) => `${v}px`}
          />
        </div>

        {/* ── Digital style picker ───────────────────── */}
        {settings.minimizeMode === "digital" && (
          <div
            style={{
              padding: "14px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 2,
              }}
            >
              Digital style
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Choose a look for your digital overlay
            </div>
            <StyleGrid>
              {DIGITAL_STYLES.map((s) => (
                <StyleCard
                  key={s.id}
                  label={s.label}
                  tag={s.tag}
                  preview={s.preview}
                  selected={settings.digitalWatchStyle === s.id}
                  onClick={() => updateSettings({ digitalWatchStyle: s.id })}
                />
              ))}
            </StyleGrid>
          </div>
        )}

        {/* ── Analog style picker ────────────────────── */}
        {settings.minimizeMode === "analog" && (
          <div
            style={{
              padding: "14px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 2,
              }}
            >
              Analog style
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Choose a watch face for your analog overlay
            </div>
            <StyleGrid>
              {ANALOG_STYLES.map((s) => (
                <StyleCard
                  key={s.id}
                  label={s.label}
                  tag={s.tag}
                  preview={s.preview}
                  selected={settings.analogWatchStyle === s.id}
                  onClick={() => updateSettings({ analogWatchStyle: s.id })}
                />
              ))}
            </StyleGrid>
          </div>
        )}

        {/* Show both pickers when no mode locked, or add a hint */}
        {settings.minimizeMode === "digital" && (
          <div style={{ padding: "10px 0 0" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Switch to{" "}
              <button
                onClick={() => updateSettings({ minimizeMode: "analog" })}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 11,
                  padding: 0,
                  fontFamily: "var(--font-body)",
                }}
              >
                Analog
              </button>{" "}
              to see analog watch styles.
            </div>
          </div>
        )}
        {settings.minimizeMode === "analog" && (
          <div style={{ padding: "10px 0 0" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Switch to{" "}
              <button
                onClick={() => updateSettings({ minimizeMode: "digital" })}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontSize: 11,
                  padding: 0,
                  fontFamily: "var(--font-body)",
                }}
              >
                Digital
              </button>{" "}
              to see digital watch styles.
            </div>
          </div>
        )}
      </Section>

      {/* ── Notifications ───────────────────────────── */}
      <Section title="NOTIFICATIONS">
        <SettingRow
          label="Notify before action"
          description="Show notification before power action fires"
          control={
            <Toggle
              checked={settings.notifyBeforeSeconds > 0}
              onChange={(v) =>
                updateSettings({ notifyBeforeSeconds: v ? 30 : 0 })
              }
            />
          }
        />
        {settings.notifyBeforeSeconds > 0 && (
          <div
            style={{
              padding: "14px 0",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Slider
              label="Warning lead time"
              min={5}
              max={120}
              step={5}
              value={settings.notifyBeforeSeconds}
              onChange={(v) => updateSettings({ notifyBeforeSeconds: v })}
              format={(v) => `${v}s before`}
            />
          </div>
        )}
        <SettingRow
          label="Confirm before action"
          description="Show 5-second countdown with cancel option"
          noBorder
          control={
            <Toggle
              checked={settings.confirmBeforeAction}
              onChange={(v) => updateSettings({ confirmBeforeAction: v })}
            />
          }
        />
      </Section>

      {/* ── Startup & System ────────────────────────── */}
      <Section title="STARTUP & SYSTEM">
        <SettingRow
          label="Start with Windows"
          description="Launch PoHtimer automatically at login"
          control={
            <Toggle
              checked={settings.autostart}
              onChange={(v) => updateSettings({ autostart: v })}
            />
          }
        />
        <SettingRow
          label="Start minimized"
          description="Open as desktop overlay on startup"
          control={
            <Toggle
              checked={settings.startMinimized}
              onChange={(v) => updateSettings({ startMinimized: v })}
            />
          }
        />
        <SettingRow
          label="Ask before closing"
          description="Prompt to exit or minimize to tray"
          control={
            <Toggle
              checked={settings.askBeforeClose}
              onChange={(v) => updateSettings({ askBeforeClose: v })}
            />
          }
        />
        <SettingRow
          label="Default close action"
          description="Used when 'Ask before closing' is off"
          noBorder
          control={
            <div style={{ display: "flex", gap: 6 }}>
              {(["minimize", "exit"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => updateSettings({ closeAction: v })}
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 11,
                    cursor: "pointer",
                    background:
                      settings.closeAction === v
                        ? "var(--accent-dim)"
                        : "var(--bg-overlay)",
                    border: `1px solid ${settings.closeAction === v ? "var(--border-accent)" : "var(--border)"}`,
                    color:
                      settings.closeAction === v
                        ? "var(--accent)"
                        : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {v === "minimize" ? "Minimize" : "Exit"}
                </button>
              ))}
            </div>
          }
        />
      </Section>

      {/* ── About ───────────────────────────────────── */}
      <Card style={{ padding: "20px", textAlign: "center" }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--accent)",
            color: "#0a0c10",
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 0 20px var(--accent-glow)",
          }}
        >
          ◷
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 24,
            letterSpacing: "0.04em",
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          POH<span style={{ color: "var(--accent)" }}>TIMER</span>
        </div>
        <div
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}
        >
          Version 0.1.6 · Built with Tauri 2 + React
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Power Scheduling Utility for Windows
        </div>
      </Card>
    </div>
  );
};
