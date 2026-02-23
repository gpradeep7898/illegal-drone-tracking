import React, { useState, useEffect } from 'react';

export default function DroneDataTable({ drones, onDroneClick, selectedCallsign, filterThreats }) {
  const [filter, setFilter] = useState(filterThreats ? 'threats' : 'all');

  useEffect(() => {
    setFilter(filterThreats ? 'threats' : 'all');
  }, [filterThreats]);

  const filteredDrones = filter === 'threats'
    ? (drones || []).filter(d => d.unauthorized)
    : (drones || []);

  const sortedDrones = [...filteredDrones].sort((a, b) => {
    if (a.unauthorized && !b.unauthorized) return -1;
    if (!a.unauthorized && b.unauthorized) return 1;
    return (a.callsign || '').localeCompare(b.callsign || '');
  });

  return (
    <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 9, color: 'var(--text-dim)', letterSpacing: '2px' }}>
          DRONE REGISTRY
        </span>
        <span style={{
          fontFamily: 'var(--font-hud)',
          fontSize: 8,
          color: 'var(--data-blue)',
          background: 'rgba(0,212,255,0.08)',
          border: '1px solid rgba(0,212,255,0.3)',
          borderRadius: 10,
          padding: '1px 7px',
        }}>
          {sortedDrones.length}
        </span>
      </div>

      {/* Filter buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['all', 'threats'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 8,
              padding: '3px 10px',
              borderRadius: 2,
              cursor: 'pointer',
              letterSpacing: '1px',
              background: filter === f ? 'var(--surface-3)' : 'transparent',
              border: filter === f ? '1px solid var(--data-blue)' : '1px solid var(--border-dim)',
              color: filter === f ? 'var(--data-blue)' : 'var(--text-dim)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            {f === 'all' ? '[ALL]' : '[THREATS]'}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '4px 0',
        borderBottom: '1px solid var(--border-dim)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface-1)',
        zIndex: 1,
      }}>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', width: 80 }}>STATUS</span>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', flex: 1 }}>CALLSIGN</span>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', width: 60, textAlign: 'right' }}>ALT</span>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', width: 55, textAlign: 'right' }}>SPD</span>
      </div>

      {/* Drone list */}
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {sortedDrones.length === 0 ? (
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 10,
            color: 'var(--text-dim)',
            textAlign: 'center',
            padding: 20,
            animation: 'blink 2s ease-in-out infinite',
            willChange: 'opacity',
          }}>
            NO CONTACTS
          </div>
        ) : (
          sortedDrones.map(drone => {
            const key = drone.callsign || drone.icao24;
            const isSelected = key === selectedCallsign;
            let borderColor = 'transparent';
            if (isSelected && drone.unauthorized) borderColor = 'var(--threat-red)';
            else if (isSelected) borderColor = 'var(--data-blue)';
            else if (drone.unauthorized) borderColor = 'rgba(255,26,60,0.5)';

            let bg = 'transparent';
            if (isSelected) bg = 'rgba(0,212,255,0.06)';
            else if (drone.unauthorized) bg = 'rgba(255,26,60,0.03)';

            return (
              <div
                key={key}
                onClick={() => onDroneClick(drone)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 4px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${borderColor}`,
                  background: bg,
                  animation: 'rowSlideIn 0.2s ease-out',
                  willChange: 'transform, opacity',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--surface-3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = bg;
                }}
              >
                {/* Status badge */}
                <div style={{
                  width: 80,
                  flexShrink: 0,
                  fontFamily: 'var(--font-hud)',
                  fontSize: 8,
                  padding: '2px 5px',
                  borderRadius: 2,
                  textAlign: 'center',
                  ...(drone.unauthorized
                    ? { background: 'rgba(255,26,60,0.12)', border: '1px solid rgba(255,26,60,0.4)', color: 'var(--threat-red)' }
                    : { background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: 'var(--hud-green)' }
                  ),
                }}>
                  {drone.unauthorized ? '⚠ UNAUTH' : '✓ AUTH'}
                </div>

                {/* Callsign */}
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 11, color: 'var(--text-bright)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {drone.callsign || drone.icao24 || 'UNKNOWN'}
                </span>

                {/* Altitude */}
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-mid)', width: 60, textAlign: 'right' }}>
                  {drone.geo_altitude != null
                    ? Math.round(drone.geo_altitude * 3.28084).toLocaleString() + ' ft'
                    : '—'}
                </span>

                {/* Speed */}
                <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-mid)', width: 55, textAlign: 'right' }}>
                  {drone.velocity != null ? Math.round(drone.velocity * 1.944) + ' k' : '—'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
