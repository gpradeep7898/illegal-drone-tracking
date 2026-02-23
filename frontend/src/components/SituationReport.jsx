import React, { useState, useMemo } from 'react';

function getThreatLevel(count) {
  if (count === 0) return 'CLEAR';
  if (count <= 2) return 'ELEVATED';
  return 'CRITICAL';
}

export default function SituationReport({ isOpen, onClose, drones, restrictedZones, dataSource }) {
  const [copied, setCopied] = useState(false);

  const reportText = useMemo(() => {
    const safeDrones = drones || [];
    const safeZones = restrictedZones || [];
    const totalCount = safeDrones.length;
    const unauthorized = safeDrones.filter(d => d.unauthorized);
    const authCount = totalCount - unauthorized.length;
    const unauthorizedCount = unauthorized.length;
    const zoneCount = safeZones.length;
    const level = getThreatLevel(unauthorizedCount);

    const incursionLines = unauthorized.length === 0
      ? '  NO ACTIVE INCURSIONS'
      : unauthorized.map(d => {
          const cs = d.callsign || d.icao24 || 'UNKNOWN';
          const alt = d.geo_altitude != null
            ? Math.round(d.geo_altitude * 3.28084).toLocaleString() + ' ft'
            : 'N/A';
          const spd = d.velocity != null
            ? Math.round(d.velocity * 1.944) + ' kts'
            : 'N/A';
          return `  [UNAUTH] ${cs} — ALT: ${alt} — SPD: ${spd}`;
        }).join('\n');

    return `AIRSPACE CONTROL SYSTEM — SITUATION REPORT
Generated: ${new Date().toISOString()}
Operator:  ADM-7741
Classification: RESTRICTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA SOURCE:    ${dataSource === 'live' ? 'LIVE — OPENSKY NETWORK' : 'SIMULATION MODE'}
TOTAL CONTACTS: ${totalCount}
AUTHORIZED:     ${authCount}
UNAUTHORIZED:   ${unauthorizedCount}
THREAT LEVEL:   ${level}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTIVE INCURSIONS (${unauthorizedCount}):
${incursionLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZONES MONITORED: ${zoneCount}
SYSTEM STATUS:   NOMINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END OF REPORT`;
  }, [drones, restrictedZones, dataSource]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 9500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="hud-panel"
        style={{
          width: 560,
          maxHeight: '80vh',
          overflow: 'hidden',
          background: 'var(--surface-1)',
          border: '1px solid var(--border-glow)',
          borderRadius: 3,
          boxShadow: '0 0 40px rgba(0,212,255,0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: 13, color: 'var(--data-blue)', letterSpacing: '2px' }}>
            SITUATION REPORT
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-dim)' }}>
              {new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC
            </span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', fontFamily: 'var(--font-hud)', fontSize: 12, color: 'var(--data-blue)', cursor: 'pointer', padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--threat-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--data-blue)')}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-dim)' }} />

        {/* Report textarea */}
        <textarea
          readOnly
          value={reportText}
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: 11,
            color: 'var(--hud-green)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-dim)',
            width: '100%',
            height: 280,
            resize: 'none',
            padding: 12,
            lineHeight: 1.6,
            outline: 'none',
            flexShrink: 0,
          }}
        />

        {/* Button row */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border-dim)' }}>
          <button
            onClick={handleCopy}
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 9,
              color: 'var(--data-blue)',
              border: '1px solid var(--data-blue)',
              padding: '6px 16px',
              background: 'transparent',
              cursor: 'pointer',
              letterSpacing: '1px',
              borderRadius: 2,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {copied ? '✓ COPIED' : 'COPY TO CLIPBOARD'}
          </button>
          <button
            onClick={onClose}
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 9,
              color: 'var(--text-dim)',
              border: '1px solid var(--border-dim)',
              padding: '6px 16px',
              background: 'transparent',
              cursor: 'pointer',
              letterSpacing: '1px',
              borderRadius: 2,
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-dim)')}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
