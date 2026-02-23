import React, { useRef, useState, useEffect } from 'react';
import RadarDisplay from './RadarDisplay';
import useAnimatedCounter from '../hooks/useAnimatedCounter';

function getThreatLevel(unauthorizedCount) {
  if (unauthorizedCount === 0) return 'CLEAR';
  if (unauthorizedCount <= 2) return 'ELEVATED';
  return 'CRITICAL';
}

function getLevelColor(level) {
  if (level === 'CLEAR') return 'var(--hud-green)';
  if (level === 'ELEVATED') return 'var(--warn-amber)';
  return 'var(--threat-red)';
}

function getLevelBg(level) {
  if (level === 'CLEAR') return 'rgba(0,255,136,0.10)';
  if (level === 'ELEVATED') return 'rgba(255,170,0,0.12)';
  return 'rgba(255,26,60,0.13)';
}

function getLevelGlow(level) {
  if (level === 'CLEAR') return 'rgba(0,255,136,0.35)';
  if (level === 'ELEVATED') return 'rgba(255,170,0,0.35)';
  return 'rgba(255,26,60,0.45)';
}

function gaugeColor(val) {
  if (val < 70) return 'var(--hud-green)';
  if (val < 90) return 'var(--warn-amber)';
  return 'var(--threat-red)';
}

const CIRC = 2 * Math.PI * 22; // circumference for r=22

function strokeDashoffset(val) {
  return CIRC * (1 - val / 100);
}

export default function HoloStatsPanel({ drones, restrictedZones, cycleId, wsStatus }) {
  const safeDrones = drones || [];
  const safeZones = restrictedZones || [];

  const unauthorizedCount = safeDrones.filter(d => d.unauthorized).length;
  const totalCount = safeDrones.length;
  const authCount = totalCount - unauthorizedCount;
  const zoneCount = safeZones.length;

  const level = getThreatLevel(unauthorizedCount);
  const levelColor = getLevelColor(level);
  const levelBg = getLevelBg(level);
  const levelGlow = getLevelGlow(level);

  const totalDisplay = useAnimatedCounter(totalCount);
  const authDisplay = useAnimatedCounter(authCount);
  const unauthDisplay = useAnimatedCounter(unauthorizedCount);
  const zoneDisplay = useAnimatedCounter(zoneCount);

  // Incursion sparkline history
  const historyRef = useRef([]);
  const [, forceSparkUpdate] = useState(0);
  useEffect(() => {
    const newCount = safeDrones.filter(d => d.unauthorized).length;
    historyRef.current = [...historyRef.current, newCount].slice(-15);
    forceSparkUpdate(n => n + 1);
  }, [cycleId]); // eslint-disable-line react-hooks/exhaustive-deps

  // System health gauges
  const cpuRef = useRef(28);
  const memRef = useRef(41);
  const netRef = useRef(0);
  const [, forceGauge] = useState(0);
  useEffect(() => {
    const cpuInt = setInterval(() => {
      cpuRef.current = Math.max(10, Math.min(85, cpuRef.current + (Math.random() - 0.48) * 8));
      forceGauge(n => n + 1);
    }, 3000);
    const memInt = setInterval(() => {
      memRef.current = Math.max(20, Math.min(75, memRef.current + (Math.random() - 0.46) * 6));
      forceGauge(n => n + 1);
    }, 4000);
    const netInt = setInterval(() => {
      const base = wsStatus === 'connected' ? 65 : 0;
      netRef.current = wsStatus === 'connected'
        ? Math.max(40, Math.min(95, base + (Math.random() - 0.5) * 20))
        : 0;
      forceGauge(n => n + 1);
    }, 2500);
    return () => {
      clearInterval(cpuInt);
      clearInterval(memInt);
      clearInterval(netInt);
    };
  }, [wsStatus]);

  // Telemetry
  const validAlts = safeDrones.map(d => d.geo_altitude).filter(v => v != null && v >= 0);
  const validSpds = safeDrones.map(d => d.velocity).filter(v => v != null && v > 0);
  const avgAlt = validAlts.length ? validAlts.reduce((a, b) => a + b, 0) / validAlts.length : 0;
  const avgSpd = validSpds.length ? validSpds.reduce((a, b) => a + b, 0) / validSpds.length : 0;
  const altFt  = Math.round(avgAlt * 3.28084);
  const spdKts = Math.round(avgSpd * 1.944);
  const altPct = Math.min(avgAlt / 12000 * 100, 100);
  const spdPct = Math.min(avgSpd / 300 * 100, 100);

  // Sparkline
  const hist = historyRef.current;
  const maxVal = Math.max(...hist, 1);
  const allZero = hist.every(v => v === 0);
  let sparkPoints = '';
  let sparkArea = '';
  let lastX = 0, lastY = 40;
  if (!allZero && hist.length > 0) {
    const pts = hist.map((v, i) => {
      const x = i * (240 / Math.max(hist.length - 1, 1));
      const y = 46 - (v / maxVal) * 36;
      return [x, y];
    });
    sparkPoints = pts.map(p => p.join(',')).join(' ');
    sparkArea =
      'M' + pts[0][0] + ',' + pts[0][1] +
      pts.slice(1).map(p => 'L' + p[0] + ',' + p[1]).join('') +
      'L' + pts[pts.length - 1][0] + ',46 L' + pts[0][0] + ',46 Z';
    lastX = pts[pts.length - 1][0];
    lastY = pts[pts.length - 1][1];
  }

  const hexAnimation = level === 'CLEAR' ? 'none'
    : level === 'ELEVATED' ? 'threatPulse 1.8s ease-in-out infinite'
    : 'threatPulse 1.0s ease-in-out infinite';

  return (
    <>
      {/* CARD A — Threat Level */}
      <div className="hud-panel">
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 10, letterSpacing: '2px' }}>
          THREAT LEVEL
        </div>
        <div
          style={{
            width: 108,
            height: 108,
            margin: '0 auto 8px',
            clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
            background: levelBg,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${levelGlow}`,
            animation: hexAnimation,
            willChange: 'transform',
          }}
        >
          <span style={{ fontFamily: 'var(--font-data)', fontSize: 32, color: levelColor, lineHeight: 1 }}>
            {unauthDisplay}
          </span>
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: 9, color: levelColor, marginTop: 4, letterSpacing: '1px' }}>
            {level}
          </span>
        </div>
      </div>

      {/* CARD B — Live Counters */}
      <div className="hud-panel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'TOTAL DRONES', value: totalDisplay,  color: 'var(--text-bright)' },
            { label: 'AUTHORIZED',   value: authDisplay,   color: 'var(--hud-green)'   },
            { label: 'UNAUTHORIZED', value: unauthDisplay, color: 'var(--threat-red)'  },
            { label: 'ZONES ACTIVE', value: zoneDisplay,   color: 'var(--data-blue)'   },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontFamily: 'var(--font-data)', fontSize: 26, color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CARD C — Radar */}
      <div className="hud-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px' }}>TACTICAL RADAR</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--hud-green)', animation: 'ambientGlow 2s infinite', willChange: 'opacity' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <RadarDisplay drones={drones} restrictedZones={restrictedZones} mapBounds={null} />
        </div>
      </div>

      {/* CARD D — Telemetry Bars */}
      <div className="hud-panel">
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 6 }}>TELEMETRY</div>
        {[
          { label: 'ALT', pct: altPct, displayVal: altFt ? altFt.toLocaleString() + ' ft' : '— ft' },
          { label: 'SPD', pct: spdPct, displayVal: spdKts ? spdKts + ' kts' : '— kts' },
        ].map(({ label, pct, displayVal }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 9, color: 'var(--text-dim)', width: 28 }}>{label}</span>
            <div style={{ flex: 1, height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--data-blue)', borderRadius: 2, width: pct + '%', transition: 'width 0.7s ease', willChange: 'width' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 10, color: 'var(--text-mid)', width: 64, textAlign: 'right' }}>{displayVal}</span>
          </div>
        ))}
      </div>

      {/* CARD E — Incursion Sparkline */}
      <div className="hud-panel">
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 6 }}>INCURSION TREND</div>
        <svg width="240" height="50" style={{ display: 'block', overflow: 'visible' }}>
          {allZero || hist.length === 0 ? (
            <>
              <line x1="0" y1="40" x2="240" y2="40" stroke="var(--hud-green)" strokeWidth="1.5" />
              <text x="120" y="28" textAnchor="middle" fontSize="9" fill="var(--text-dim)" fontFamily="var(--font-data)">NO INCURSIONS</text>
            </>
          ) : (
            <>
              <defs>
                <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%"   stopColor="var(--threat-red)" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="var(--threat-red)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkArea} fill="url(#sg)" />
              <polyline points={sparkPoints} fill="none" stroke="var(--threat-red)" strokeWidth="1.5" />
              <circle cx={lastX} cy={lastY} r="3" fill="var(--threat-red)" />
            </>
          )}
        </svg>
      </div>

      {/* CARD F — System Health Gauges */}
      <div className="hud-panel">
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', letterSpacing: '2px', marginBottom: 8 }}>SYS HEALTH</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {[
            { label: 'CPU', val: cpuRef.current },
            { label: 'MEM', val: memRef.current },
            { label: 'NET', val: netRef.current },
          ].map(({ label, val }) => (
            <div key={label} style={{ width: 60, textAlign: 'center' }}>
              <svg width="54" height="54" style={{ display: 'block', margin: '0 auto' }}>
                <circle cx="27" cy="27" r="22" fill="none" stroke="var(--surface-3)" strokeWidth="4" />
                <circle
                  cx="27" cy="27" r="22"
                  fill="none"
                  stroke={gaugeColor(val)}
                  strokeWidth="4"
                  strokeDasharray={CIRC}
                  strokeDashoffset={strokeDashoffset(val)}
                  strokeLinecap="round"
                  transform="rotate(-90 27 27)"
                  style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                />
                <text x="27" y="31" textAnchor="middle" fontSize="10" fill="var(--text-bright)" fontFamily="var(--font-data)">
                  {Math.round(val)}%
                </text>
              </svg>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: 'var(--text-dim)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
