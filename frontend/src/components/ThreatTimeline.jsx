import React, { useState, useEffect, useRef } from 'react';

function formatTime(ts) {
  return new Date(ts).toTimeString().slice(0, 8);
}

function dotColor(type) {
  if (type === 'INCURSION') return 'var(--threat-red)';
  if (type === 'MULTI_ZONE') return 'var(--warn-amber)';
  if (type === 'ALL_CLEAR') return 'var(--hud-green)';
  return 'var(--data-blue)';
}

export default function ThreatTimeline({ newThreats, drones, cycleId }) {
  const [events, setEvents] = useState([{
    id: 'boot',
    type: 'SYSTEM',
    msg: 'MONITORING ACTIVE',
    ts: Date.now(),
    isNew: false,
  }]);
  const prevUnauthorized = useRef(0);
  const containerRef = useRef(null);

  // React to new threats
  useEffect(() => {
    if (!newThreats || newThreats.length === 0) return;
    const count = newThreats.length;
    const newEvent = count >= 2
      ? { id: Date.now(), type: 'MULTI_ZONE', msg: `MULTI-ZONE BREACH (${count} CONTACTS)`, ts: Date.now(), isNew: true }
      : { id: Date.now(), type: 'INCURSION', msg: `INCURSION — ${newThreats[0].callsign || newThreats[0].icao24 || 'UNKNOWN'}`, ts: Date.now(), isNew: true };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
    const t = setTimeout(() => {
      setEvents(prev => prev.map(e => e.id === newEvent.id ? { ...e, isNew: false } : e));
    }, 10000);
    return () => clearTimeout(t);
  }, [newThreats]);

  // React to all-clear
  useEffect(() => {
    const current = (drones || []).filter(d => d.unauthorized).length;
    if (prevUnauthorized.current > 0 && current === 0) {
      const e = { id: Date.now(), type: 'ALL_CLEAR', msg: 'AREA CLEAR — No unauthorized contacts', ts: Date.now(), isNew: true };
      setEvents(prev => [e, ...prev].slice(0, 50));
      const t = setTimeout(() => {
        setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, isNew: false } : ev));
      }, 10000);
      return () => clearTimeout(t);
    }
    prevUnauthorized.current = current;
  }, [drones]);

  // Scroll to top on new event
  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [events[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const incursionCount = events.filter(e => e.type === 'INCURSION' || e.type === 'MULTI_ZONE').length;

  return (
    <div className="hud-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px' }}>
          THREAT TIMELINE
        </span>
        {incursionCount > 0 && (
          <span style={{
            background: 'rgba(255,26,60,0.15)',
            border: '1px solid var(--threat-red)',
            borderRadius: 10,
            fontFamily: 'var(--font-hud)',
            fontSize: 8,
            color: 'var(--threat-red)',
            padding: '1px 7px',
          }}>
            {incursionCount}
          </span>
        )}
      </div>

      {/* Event list */}
      <div
        ref={containerRef}
        style={{ maxHeight: 180, overflowY: 'auto', paddingTop: 4 }}
      >
        {events.map((evt, idx) => (
          <div
            key={evt.id}
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              padding: '4px 0',
              borderBottom: idx < events.length - 1 ? '1px solid rgba(0,212,255,0.05)' : 'none',
              animation: 'rowSlideIn 0.25s ease-out',
              willChange: 'transform, opacity',
            }}
          >
            {/* Dot */}
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: dotColor(evt.type),
              flexShrink: 0,
              marginTop: 3,
            }} />
            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-dim)' }}>
                [{formatTime(evt.ts)}]
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-mid)', marginTop: 1 }}>
                {evt.msg}
              </div>
            </div>
            {/* NEW badge */}
            {evt.isNew && (
              <span style={{
                background: 'rgba(255,26,60,0.2)',
                border: '1px solid var(--threat-red)',
                borderRadius: 2,
                fontFamily: 'var(--font-hud)',
                fontSize: 7,
                color: 'var(--threat-red)',
                padding: '1px 5px',
                flexShrink: 0,
              }}>
                NEW
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
