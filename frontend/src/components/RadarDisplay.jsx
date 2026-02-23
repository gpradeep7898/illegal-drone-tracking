import React from 'react';

const DEFAULT_BOUNDS = { minLat: 24, maxLat: 50, minLng: -125, maxLng: -66 };

function latLngToXY(lat, lng, bounds) {
  let x = (lng - bounds.minLng) / (bounds.maxLng - bounds.minLng) * 186 + 7;
  let y = (bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat) * 186 + 7;
  x = Math.max(3, Math.min(197, x));
  y = Math.max(3, Math.min(197, y));
  return { x, y };
}

export default function RadarDisplay({ drones, restrictedZones, mapBounds }) {
  const bounds = mapBounds || DEFAULT_BOUNDS;
  const safeDrones = drones || [];
  const safeZones = restrictedZones || [];

  return (
    <svg
      width={200}
      height={200}
      viewBox="0 0 200 200"
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id="rc">
          <circle cx="100" cy="100" r="98" />
        </clipPath>
        <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(0,50,20,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
      </defs>

      {/* Background */}
      <circle cx="100" cy="100" r="98" fill="var(--surface-1)" />
      <circle cx="100" cy="100" r="98" fill="url(#radarBg)" />

      <g clipPath="url(#rc)">
        {/* Grid rings */}
        {[25, 50, 75, 98].map(r => (
          <circle
            key={r}
            cx="100" cy="100" r={r}
            stroke="var(--border-dim)"
            strokeWidth="0.8"
            fill="none"
          />
        ))}

        {/* Crosshair */}
        <line x1="2"   y1="100" x2="198" y2="100" stroke="var(--border-dim)" strokeWidth="0.5" />
        <line x1="100" y1="2"   x2="100" y2="198" stroke="var(--border-dim)" strokeWidth="0.5" />

        {/* Restricted zone centers */}
        {safeZones.map((zone, i) => {
          const lat = zone.lat != null ? zone.lat : zone.latitude;
          const lng = zone.lng != null ? zone.lng : zone.longitude;
          if (lat == null || lng == null) return null;
          const { x, y } = latLngToXY(lat, lng, bounds);
          return (
            <circle
              key={zone.id || zone.name || i}
              cx={x} cy={y} r="5"
              fill="none"
              stroke="rgba(255,26,60,0.3)"
              strokeWidth="1"
              strokeDasharray="3 2"
            />
          );
        })}

        {/* Radar sweep */}
        <g style={{ transformOrigin: '100px 100px', animation: 'radarSweep 3s linear infinite', willChange: 'transform' }}>
          <line x1="100" y1="100" x2="100" y2="4" stroke="var(--hud-green)" strokeWidth="1.5" opacity="0.9" />
          <line
            x1="100" y1="100" x2="84" y2="7"
            stroke="var(--hud-green)" strokeWidth="1" opacity="0.3"
            style={{ transform: 'rotate(-20deg)', transformOrigin: '100px 100px' }}
          />
        </g>

        {/* Drone blips */}
        {safeDrones
          .filter(d => d.latitude != null && d.longitude != null)
          .map((drone) => {
            const { x, y } = latLngToXY(drone.latitude, drone.longitude, bounds);
            const key = drone.callsign || drone.icao24 || `${drone.latitude}-${drone.longitude}`;
            if (drone.unauthorized) {
              return (
                <g key={key}>
                  <circle cx={x} cy={y} r="3" fill="var(--threat-red)" />
                  <circle
                    cx={x} cy={y} r="3"
                    fill="none"
                    stroke="var(--threat-red)"
                    strokeWidth="1"
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animation: 'droneRing 1.5s ease-out infinite',
                      willChange: 'transform, opacity',
                    }}
                  />
                  <circle
                    cx={x} cy={y} r="3"
                    fill="none"
                    stroke="var(--threat-red)"
                    strokeWidth="1"
                    style={{
                      transformOrigin: `${x}px ${y}px`,
                      animation: 'droneRing 1.5s ease-out 0.75s infinite',
                      willChange: 'transform, opacity',
                    }}
                  />
                </g>
              );
            }
            return (
              <circle
                key={key}
                cx={x} cy={y} r="2.5"
                fill="var(--hud-green)"
                opacity="0.9"
              />
            );
          })}
      </g>

      {/* Cardinal labels — outside clip */}
      <text x="100" y="10"  textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontFamily="var(--font-data)">N</text>
      <text x="193" y="104" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontFamily="var(--font-data)">E</text>
      <text x="100" y="197" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontFamily="var(--font-data)">S</text>
      <text x="7"   y="104" textAnchor="middle" fontSize="7" fill="var(--text-dim)" fontFamily="var(--font-data)">W</text>

      {/* Outer ring */}
      <circle
        cx="100" cy="100" r="98"
        fill="none"
        stroke="var(--data-blue)"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 3px var(--glow-blue))' }}
      />
    </svg>
  );
}
