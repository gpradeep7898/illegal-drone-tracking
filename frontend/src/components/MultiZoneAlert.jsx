import React from 'react';

export default function MultiZoneAlert({ drones }) {
  const unauthorizedDrones = (drones || []).filter(d => d.unauthorized);
  const show = unauthorizedDrones.length >= 2;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 500,
        height: 34,
        background: 'rgba(255,170,0,0.1)',
        borderBottom: '1px solid rgba(255,170,0,0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        transform: show ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease',
        willChange: 'transform',
      }}
    >
      <span style={{ fontSize: 14 }}>⚡</span>
      <span
        style={{
          fontFamily: 'var(--font-hud)',
          fontSize: 10,
          color: 'var(--warn-amber)',
          letterSpacing: '2px',
        }}
      >
        MULTI-ZONE INCURSION ACTIVE · {unauthorizedDrones.length} RESTRICTED ZONES BREACHED
      </span>
    </div>
  );
}
