import React, { useEffect, useState } from 'react';
import { useStore } from '../store';

const DigitalOverlay: React.FC<{ size: number }> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, setClockMode } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find(t => t.status === 'running');
  const scale = size / 160;

  return (
    <div
      style={{
        position: 'relative',
        width: size, height: activeTimer ? size * 1.1 : size * 0.65,
        background: 'rgba(10,12,16,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-accent)',
        borderRadius: 16 * scale,
        padding: 14 * scale,
        cursor: 'pointer',
        userSelect: 'none',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px var(--accent-shadow)',
        transition: 'height 0.3s ease',
      }}
      onDoubleClick={() => setMinimized(false)}
      onContextMenu={e => { e.preventDefault(); setShowMenu(!showMenu); }}
    >
      <div
        data-tauri-drag-region
        style={{
          height: 12 * scale,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6 * scale,
          cursor: 'grab',
        }}
      >
        <div style={{
          width: 38 * scale,
          height: 3 * scale,
          borderRadius: 999,
          background: 'rgba(240,242,245,0.14)',
          border: '1px solid rgba(255,255,255,0.08)',
        }} />
      </div>

      {/* Time */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 32 * scale,
        fontWeight: 700,
        color: 'var(--accent)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        textShadow: '0 0 20px var(--accent-glow-strong)',
        textAlign: 'center',
      }}>
        {now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })}
        <span style={{ fontSize: 18 * scale, color: 'var(--accent-strong)', marginLeft: 2 }}>
          {String(now.getSeconds()).padStart(2, '0')}
        </span>
      </div>

      <div style={{
        fontSize: 9 * scale, color: 'rgba(240,242,245,0.4)',
        textAlign: 'center', marginTop: 3 * scale,
        letterSpacing: '0.05em',
      }}>
        {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
      </div>

      {/* Active timer countdown */}
      {activeTimer && (
        <div style={{
          marginTop: 8 * scale,
          padding: `${6 * scale}px ${8 * scale}px`,
          background: 'var(--accent-dim)',
          border: '1px solid var(--border-accent)',
          borderRadius: 8 * scale,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 8 * scale, color: 'rgba(240,242,245,0.4)', letterSpacing: '0.05em' }}>
            TIMER
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 18 * scale,
            fontWeight: 700,
            color: activeTimer.remaining <= 60 ? '#ff8c00' : 'var(--accent)',
            letterSpacing: '-0.01em',
          }}>
            {String(Math.floor(activeTimer.remaining / 3600)).padStart(2, '0')}:
            {String(Math.floor((activeTimer.remaining % 3600) / 60)).padStart(2, '0')}:
            {String(activeTimer.remaining % 60).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 8 * scale, color: 'rgba(240,242,245,0.35)', marginTop: 1 }}>
            {activeTimer.label}
          </div>
        </div>
      )}

      {/* Context menu */}
      {showMenu && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'rgba(24,28,36,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '4px', zIndex: 999, minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        }}>
          {[
            { label: 'Open PoHtimer', action: () => { setMinimized(false); setShowMenu(false); } },
            { label: 'Switch to Analog', action: () => { setClockMode('analog'); setShowMenu(false); } },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 5, fontSize: 11,
                background: 'none', border: 'none', color: 'rgba(240,242,245,0.7)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AnalogOverlay: React.FC<{ size: number }> = ({ size }) => {
  const [now, setNow] = useState(new Date());
  const { timers, setMinimized, setClockMode } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeTimer = timers.find(t => t.status === 'running');
  const cx = size / 2;
  const r = size / 2 - 4;

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  const hAngle = ((h + m / 60) / 12) * 360 - 90;
  const mAngle = ((m + s / 60) / 60) * 360 - 90;
  const sAngle = (s / 60) * 360 - 90;

  const toXY = (angle: number, len: number) => ({
    x: cx + Math.cos((angle * Math.PI) / 180) * len,
    y: cx + Math.sin((angle * Math.PI) / 180) * len,
  });

  const hPos = toXY(hAngle, r * 0.55);
  const mPos = toXY(mAngle, r * 0.75);
  const sPos = toXY(sAngle, r * 0.85);

  // Timer progress arc
  const timerPct = activeTimer ? 1 - activeTimer.remaining / activeTimer.duration : 0;
  const timerAngle = timerPct * 360;
  const timerR = r - 6;
  const timerStart = toXY(-90, timerR);
  const timerEnd = toXY(-90 + timerAngle, timerR);
  const largeArc = timerAngle > 180 ? 1 : 0;

  return (
    <div
      style={{
        position: 'relative',
        width: size, height: size,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onDoubleClick={() => setMinimized(false)}
      onContextMenu={e => { e.preventDefault(); setShowMenu(!showMenu); }}
    >
      <div
        data-tauri-drag-region
        style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 56,
          height: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          zIndex: 2,
        }}
      >
        <div style={{
          width: 36,
          height: 3,
          borderRadius: 999,
          background: 'rgba(240,242,245,0.14)',
          border: '1px solid rgba(255,255,255,0.08)',
        }} />
      </div>

      <svg width={size} height={size}>
        {/* Background */}
        <circle cx={cx} cy={cx} r={r} fill="rgba(10,12,16,0.85)" />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--border-accent)" strokeWidth={1.5} />

        {/* Backdrop blur effect via filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Timer arc */}
        {activeTimer && timerAngle > 0 && (
          <path
            d={`M ${timerStart.x} ${timerStart.y} A ${timerR} ${timerR} 0 ${largeArc} 1 ${timerEnd.x} ${timerEnd.y}`}
            fill="none"
            stroke={activeTimer.remaining <= 60 ? '#ff8c00' : 'var(--accent)'}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Hour markers */}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * 360 - 90;
          const inner = toXY(a, r - 8);
          const outer = toXY(a, r - 3);
          return (
            <line key={i}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={i === 0 || i % 3 === 0 ? 'var(--accent-strong)' : 'rgba(255,255,255,0.15)'}
              strokeWidth={i % 3 === 0 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1={cx} y1={cx} x2={hPos.x} y2={hPos.y}
          stroke="#f0f2f5" strokeWidth={3} strokeLinecap="round"
          filter="url(#glow)"
        />
        {/* Minute hand */}
        <line
          x1={cx} y1={cx} x2={mPos.x} y2={mPos.y}
          stroke="var(--accent)" strokeWidth={2} strokeLinecap="round"
          filter="url(#glow)"
        />
        {/* Second hand */}
        <line
          x1={cx} y1={cx} x2={sPos.x} y2={sPos.y}
          stroke="#ff4d4d" strokeWidth={1} strokeLinecap="round"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cx} r={3} fill="var(--accent)" />
        <circle cx={cx} cy={cx} r={1.5} fill="#0a0c10" />
      </svg>

      {showMenu && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'rgba(24,28,36,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: 4, zIndex: 999, minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}>
          {[
            { label: 'Open PoHtimer', action: () => { setMinimized(false); setShowMenu(false); } },
            { label: 'Switch to Digital', action: () => { setClockMode('digital'); setShowMenu(false); } },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 5, fontSize: 11,
                background: 'none', border: 'none', color: 'rgba(240,242,245,0.7)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const DesktopOverlay: React.FC = () => {
  const { settings, clockMode } = useStore();
  const size = settings.clockSize;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {clockMode === 'digital' || settings.minimizeMode === 'digital'
        ? <DigitalOverlay size={size} />
        : <AnalogOverlay size={size} />
      }
    </div>
  );
};
