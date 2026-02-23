import React, { useState, useEffect } from 'react';

function getStatusColor(wsStatus) {
  if (wsStatus === 'connected') return 'var(--hud-green)';
  if (wsStatus === 'connecting') return 'var(--warn-amber)';
  return 'var(--threat-red)';
}

function getStatusLabel(wsStatus) {
  if (wsStatus === 'connected') return 'CONNECTED';
  if (wsStatus === 'connecting') return 'RECONNECTING';
  return 'OFFLINE';
}

export default function TopNavBar({ wsStatus, wsLatency, isMuted, onToggleMute, onSituationReport }) {
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const iso = new Date().toISOString();
      setUtcTime(iso.replace('T', ' · ').slice(0, 22) + ' UTC');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const statusColor = getStatusColor(wsStatus);
  const statusLabel = getStatusLabel(wsStatus);
  const isDotBlinking = wsStatus === 'connecting';

  return (
    <nav
      className="top-nav"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '56px',
        background: 'rgba(2,4,9,0.97)',
        borderBottom: '1px solid var(--border-dim)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* LEFT — Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 18,
            color: 'var(--hud-green)',
            filter: 'drop-shadow(0 0 4px var(--hud-green))',
          }}
        >
          ⬡
        </span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 12,
              color: 'var(--text-bright)',
              letterSpacing: '2px',
            }}
          >
            AIRSPACE CONTROL SYSTEM
          </div>
          <div
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 8,
              color: 'var(--text-dim)',
              letterSpacing: '1.5px',
              marginTop: 1,
            }}
          >
            CLASSIFIED // OPERATOR: ADM-7741
          </div>
        </div>
      </div>

      {/* CENTER — UTC Clock */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 7,
            color: 'var(--text-dim)',
            letterSpacing: '2px',
            marginBottom: 2,
          }}
        >
          SYSTEM TIME
        </div>
        <div
          style={{
            fontFamily: 'var(--font-data)',
            fontSize: 15,
            color: 'var(--data-blue)',
          }}
        >
          {utcTime}
        </div>
      </div>

      {/* RIGHT — Controls + WS status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Mute button */}
        <button
          onClick={onToggleMute}
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 9,
            border: '1px solid var(--border-dim)',
            padding: '4px 10px',
            background: 'transparent',
            color: isMuted ? 'var(--warn-amber)' : 'var(--text-mid)',
            cursor: 'pointer',
            letterSpacing: '1px',
            borderRadius: 2,
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-dim)')}
        >
          {isMuted ? '🔇 MUTED' : '🔊 AUDIO'}
        </button>

        {/* SITREP button */}
        <button
          onClick={onSituationReport}
          style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 9,
            border: '1px solid var(--border-dim)',
            padding: '4px 10px',
            background: 'transparent',
            color: 'var(--data-blue)',
            cursor: 'pointer',
            letterSpacing: '1px',
            borderRadius: 2,
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-glow)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-dim)')}
        >
          📋 SITREP
        </button>

        {/* WS Status pill */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: statusColor,
                boxShadow: wsStatus === 'connected' ? '0 0 6px var(--glow-green)' : 'none',
                animation: isDotBlinking ? 'blink 0.8s infinite' : 'none',
                willChange: isDotBlinking ? 'opacity' : 'auto',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 9,
                color: statusColor,
                letterSpacing: '1px',
              }}
            >
              {statusLabel}
            </span>
          </div>
          {wsLatency >= 5 && (
            <div
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 8,
                color: 'var(--text-dim)',
              }}
            >
              LAST: {wsLatency}s AGO
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
