import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Breach Arcs sub-component (uses useMap inside MapContainer) ──
function BreachArcs({ breachEvents }) {
  const map = useMap();
  return (
    <>
      {(breachEvents || []).map(evt => {
        const pt = map.latLngToContainerPoint([evt.lat, evt.lng]);
        return (
          <div
            key={evt.id}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: '2px solid var(--threat-red)',
              transform: 'translate(-50%,-50%)',
              opacity: 0,
              animation: 'breachArc 0.8s ease-out 3 forwards',
              pointerEvents: 'none',
              zIndex: 450,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </>
  );
}

function makeDroneIcon(isUnauthorized, isSelected) {
  const html = isUnauthorized
    ? `<div class="dm-wrap unauthorized${isSelected ? ' selected' : ''}">
         <div class="dm-dot"></div>
         <div class="dm-ring"></div>
         <div class="dm-ring r2"></div>
       </div>`
    : `<div class="dm-wrap authorized${isSelected ? ' selected' : ''}">
         <div class="dm-dot"></div>
         <div class="dm-ring"></div>
       </div>`;
  return L.divIcon({ html, className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
}

export default function MapComponent({
  drones,
  restrictedZones,
  getTrail,
  breachEvents,
  onDroneClick,
  selectedCallsign,
}) {
  const styleRef = useRef(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dm-wrap { position:relative; width:26px; height:26px; display:flex; align-items:center; justify-content:center; }
      .dm-dot { border-radius:50%; position:relative; z-index:2; }
      .authorized .dm-dot { width:8px; height:8px; background:#00ff88; box-shadow:0 0 8px rgba(0,255,136,0.9); }
      .unauthorized .dm-dot { width:10px; height:10px; background:#ff1a3c; box-shadow:0 0 10px rgba(255,26,60,1); }
      .dm-ring { position:absolute; border-radius:50%; border:1.5px solid; width:20px; height:20px; top:50%; left:50%; }
      .authorized .dm-ring { border-color:rgba(0,255,136,0.2); }
      .unauthorized .dm-ring { border-color:rgba(255,26,60,0.75); animation:droneRing 1.5s ease-out infinite; will-change:transform,opacity; }
      .unauthorized .r2 { animation-delay:0.75s; }
      .zone-tooltip { background:rgba(6,13,26,0.9) !important; border:1px solid rgba(255,26,60,0.3) !important; color:rgba(100,160,220,0.4) !important; font-family:'Orbitron',monospace !important; font-size:9px !important; border-radius:2px !important; box-shadow:none !important; padding:3px 7px !important; }
      .leaflet-container { background:var(--void) !important; cursor:crosshair !important; }
      .leaflet-tooltip-left::before, .leaflet-tooltip-right::before { display:none; }
    `;
    document.head.appendChild(style);
    styleRef.current = style;
    return () => {
      if (styleRef.current) document.head.removeChild(styleRef.current);
    };
  }, []);

  const safeDrones = drones || [];
  const safeZones = restrictedZones || [];

  return (
    <div
      className="hud-panel"
      style={{ height: '100%', position: 'relative', padding: 0, overflow: 'hidden' }}
    >
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        {/* Restricted Zones */}
        {safeZones.map((zone, i) => {
          const lat = zone.lat != null ? zone.lat : zone.latitude;
          const lng = zone.lng != null ? zone.lng : zone.longitude;
          if (lat == null || lng == null) return null;
          return (
            <Circle
              key={zone.id || zone.name || i}
              center={[lat, lng]}
              radius={(zone.radius || 10) * 1000}
              pathOptions={{
                color: '#ff1a3c',
                fillColor: '#ff1a3c',
                fillOpacity: 0.05,
                weight: 1.5,
                dashArray: '6 4',
              }}
            >
              <Tooltip
                permanent
                direction="center"
                className="zone-tooltip"
              >
                {zone.type || zone.name || 'RESTRICTED'}
              </Tooltip>
            </Circle>
          );
        })}

        {/* Flight Trails */}
        {safeDrones.map(drone => {
          const trail = getTrail(drone.callsign || drone.icao24);
          if (!trail || trail.length < 2) return null;
          return (
            <Polyline
              key={'trail-' + (drone.callsign || drone.icao24)}
              positions={trail.map(p => [p.lat, p.lng])}
              pathOptions={{
                color: drone.unauthorized ? '#ff1a3c' : '#00ff88',
                opacity: drone.unauthorized ? 0.4 : 0.22,
                weight: drone.unauthorized ? 2 : 1.5,
                dashArray: drone.unauthorized ? '3 4' : '5 6',
              }}
            />
          );
        })}

        {/* Drone Markers */}
        {safeDrones
          .filter(d => d.latitude != null && d.longitude != null)
          .map(drone => {
            const key = drone.callsign || drone.icao24 || `${drone.latitude}-${drone.longitude}`;
            return (
              <Marker
                key={key}
                position={[drone.latitude, drone.longitude]}
                icon={makeDroneIcon(
                  drone.unauthorized,
                  (drone.callsign || drone.icao24) === selectedCallsign
                )}
                eventHandlers={{ click: () => onDroneClick(drone) }}
              />
            );
          })}

        {/* Breach Arcs */}
        <BreachArcs breachEvents={breachEvents} />
      </MapContainer>

      {/* Radar sweep overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,255,136,0.012) 35deg, transparent 70deg)',
          animation: 'radarSweep 8s linear infinite',
          mixBlendMode: 'screen',
          zIndex: 400,
          willChange: 'transform',
        }}
      />

      {/* Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: 10,
          zIndex: 500,
          fontFamily: 'var(--font-hud)',
          fontSize: 8,
          color: 'rgba(0,212,255,0.2)',
          pointerEvents: 'none',
          letterSpacing: '2px',
        }}
      >
        ZONE MONITORING ACTIVE
      </div>
    </div>
  );
}
