import React from 'react';

const DIRS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
function degreesToCompass(deg) {
  return DIRS[Math.round(deg / 22.5) % 16] + ' ' + Math.round(deg) + '°';
}

function haverDist(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function DroneDetailDrawer({ drone, restrictedZones, getTrail, onClose }) {
  const isOpen = drone != null;

  const trail = drone ? getTrail(drone.callsign || drone.icao24) : [];

  // Zone proximity
  const zonesWithDist = drone && (restrictedZones || []).map(zone => {
    const zoneLat = zone.lat != null ? zone.lat : zone.latitude;
    const zoneLng = zone.lng != null ? zone.lng : zone.longitude;
    const dist = haverDist(drone.latitude, drone.longitude, zoneLat, zoneLng);
    return { ...zone, dist };
  }).sort((a, b) => a.dist - b.dist).slice(0, 6);

  // Trail SVG
  let trailSvg = null;
  if (drone && trail && trail.length >= 2) {
    const minLng = Math.min(...trail.map(p => p.lng));
    const maxLng = Math.max(...trail.map(p => p.lng));
    const minLat = Math.min(...trail.map(p => p.lat));
    const maxLat = Math.max(...trail.map(p => p.lat));
    const pts = trail.map(p => {
      const x = (p.lng - minLng) / (maxLng - minLng + 0.001) * 314 + 8;
      const y = 64 - (p.lat - minLat) / (maxLat - minLat + 0.001) * 56;
      return [x, y];
    });
    const polyPts = pts.map(p => p.join(',')).join(' ');
    const lastX = pts[pts.length - 1][0];
    const lastY = pts[pts.length - 1][1];
    const trailColor = drone.unauthorized ? 'var(--threat-red)' : 'var(--hud-green)';
    trailSvg = (
      <svg width="330" height="72" style={{ display: 'block', borderRadius: 2 }}>
        <rect width="330" height="72" fill="var(--surface-2)" rx="2" />
        <polyline points={polyPts} fill="none" stroke={trailColor} strokeWidth="1.5" opacity="0.8" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.5" fill={trailColor} opacity="0.6" />
        ))}
        <circle cx={lastX} cy={lastY} r="4" fill={trailColor} />
        <text x={lastX + 6} y={lastY + 4} fontSize="8" fill={trailColor} fontFamily="var(--font-data)">NOW</text>
      </svg>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 56,
        width: 370,
        height: 'calc(100vh - 100px)',
        background: 'rgba(6,13,26,0.97)',
        borderLeft: '1px solid var(--border-glow)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        zIndex: 900,
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.34,1.2,0.64,1)',
        willChange: 'transform',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 14,
          background: 'none',
          border: 'none',
          fontFamily: 'var(--font-hud)',
          fontSize: 12,
          color: 'var(--data-blue)',
          cursor: 'pointer',
          padding: 0,
          lineHeight: 1,
          zIndex: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--threat-red)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--data-blue)')}
      >
        ✕
      </button>

      {drone && (
        <>
          {/* Header */}
          <div style={{ padding: '14px 14px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 20,
                color: drone.unauthorized ? 'var(--threat-red)' : 'var(--hud-green)',
                letterSpacing: '2px',
              }}>
                {drone.callsign || drone.icao24 || 'UNKNOWN'}
              </span>
              <span style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 9,
                padding: '3px 10px',
                borderRadius: 2,
                border: `1px solid ${drone.unauthorized ? 'var(--threat-red)' : 'var(--hud-green)'}`,
                color: drone.unauthorized ? 'var(--threat-red)' : 'var(--hud-green)',
                background: drone.unauthorized ? 'rgba(255,26,60,0.12)' : 'rgba(0,255,136,0.08)',
                letterSpacing: '1px',
              }}>
                {drone.unauthorized ? '⚠ UNAUTHORIZED' : '✓ AUTHORIZED'}
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
              ICAO24: {drone.icao24 || 'N/A'}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-dim)', margin: '10px 14px' }} />

          {/* Telemetry */}
          <div style={{ padding: '0 14px' }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 8 }}>TELEMETRY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'LATITUDE',  value: drone.latitude?.toFixed(4) || '—'  },
                { label: 'LONGITUDE', value: drone.longitude?.toFixed(4) || '—' },
                { label: 'ALTITUDE',  value: drone.geo_altitude != null ? (drone.geo_altitude * 3.28084).toLocaleString(undefined, {maximumFractionDigits: 0}) + ' ft' : '—' },
                { label: 'VELOCITY',  value: drone.velocity != null ? Math.round(drone.velocity * 1.944) + ' kts' : '—' },
                { label: 'HEADING',   value: drone.true_track != null ? degreesToCompass(drone.true_track) : '—' },
                { label: 'ON GROUND', value: drone.on_ground ? 'YES' : 'AIRBORNE', color: drone.on_ground ? 'var(--warn-amber)' : 'var(--hud-green)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="hud-panel" style={{ padding: 8 }}>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', letterSpacing: '1px' }}>{label}</div>
                  <div style={{ fontFamily: 'var(--font-data)', fontSize: 14, color: color || 'var(--text-bright)', marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-dim)', margin: '10px 14px' }} />

          {/* Zone Proximity */}
          <div style={{ padding: '0 14px' }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 6 }}>ZONE PROXIMITY</div>
            {(zonesWithDist || []).map((zone, i) => {
              const radius = zone.radius || 10;
              let zoneColor = 'var(--text-dim)';
              let label = '';
              if (zone.dist <= radius) { zoneColor = 'var(--threat-red)'; label = 'BREACH'; }
              else if (zone.dist <= radius * 2) { zoneColor = 'var(--warn-amber)'; }
              return (
                <div key={zone.name || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: zoneColor }}>{zone.name || 'ZONE'}</span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {label && (
                      <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--threat-red)', border: '1px solid var(--threat-red)', padding: '1px 4px', borderRadius: 2 }}>{label}</span>
                    )}
                    <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: zoneColor }}>{zone.dist.toFixed(1)} km</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'var(--border-dim)', margin: '10px 14px' }} />

          {/* Flight Trail */}
          <div style={{ padding: '0 14px 14px' }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 8 }}>FLIGHT PATH (LAST 20 POS)</div>
            {!trail || trail.length < 2 ? (
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', padding: 16 }}>
                INSUFFICIENT DATA
              </div>
            ) : trailSvg}
          </div>
        </>
      )}
    </div>
  );
}
