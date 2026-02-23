import React from 'react';

export default function BottomStatusBar({ drones, wsStatus, dataSource, lastUpdate, onManualRefresh }) {
  const safeDrones = drones || [];
  const authorizedCount = safeDrones.filter(d => !d.unauthorized).length;
  const unauthorizedCount = safeDrones.filter(d => d.unauthorized).length;

  // Build ticker string from callsigns
  const allCallsigns = safeDrones.map(d => d.callsign || d.icao24 || 'UNKN').join('  ·  ');
  const tickerText = allCallsigns
    ? allCallsigns + '  ·  ' + allCallsigns
    : 'AWAITING DRONE DATA  ·  AWAITING DRONE DATA';

  // Last update formatted
  const lastUpdateStr = lastUpdate
    ? new Date(lastUpdate).toTimeString().slice(0, 8)
    : '—';

  return (
    <footer
      className="bottom-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 44,
        background: 'rgba(2,4,9,0.97)',
        borderTop: '1px solid var(--border-dim)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Left — status pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', letterSpacing: '1px' }}>
          {dataSource === 'live' ? '◉ LIVE' : '◎ SIM'}
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--hud-green)' }}>
          AUTH: {authorizedCount}
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--threat-red)' }}>
          UNAUTH: {unauthorizedCount}
        </span>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-dim)' }}>
          UPD: {lastUpdateStr}
        </span>
      </div>

      {/* Center — callsign marquee */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontFamily: 'var(--font-data)',
            fontSize: 9,
            color: 'var(--text-dim)',
            animation: 'marquee 30s linear infinite',
            willChange: 'transform',
          }}
        >
          {tickerText}
        </div>
      </div>

      {/* Right — refresh + kbd hint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', flexShrink: 0 }}>
        <button
          onClick={onManualRefresh}
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 8,
            color: 'var(--data-blue)',
            border: '1px solid var(--border-dim)',
            background: 'transparent',
            padding: '3px 8px',
            cursor: 'pointer',
            borderRadius: 2,
            letterSpacing: '1px',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-dim)')}
          title="Manual refresh (R)"
        >
          ↺ REFRESH
        </button>
        <span style={{ fontFamily: 'var(--font-data)', fontSize: 8, color: 'var(--text-dim)' }}>
          ? = HELP
        </span>
      </div>
    </footer>
  );
}
