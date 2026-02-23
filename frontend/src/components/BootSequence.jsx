import React, { useState, useEffect } from 'react';

const BOOT_LINES = [
  '> AIRSPACE CONTROL SYSTEM  v2.4.1',
  '> OPERATOR AUTHENTICATION ......... VERIFIED',
  '> LOADING ZONE CONFIGURATION ...... OK  [7 ZONES]',
  '> CALIBRATING HAVERSINE ENGINE ..... OK',
  '> ESTABLISHING WEBSOCKET LINK ...... CONNECTED',
  '> INITIALIZING THREAT DETECTION .... OK',
  '> LOADING FLIGHT HISTORY CACHE ..... OK',
  '> AUDIO SUBSYSTEM .................. STANDBY',
  '> ALL SYSTEMS NOMINAL',
  '',
  'LAUNCHING INTERFACE...',
];

export default function BootSequence({ onComplete }) {
  const [visibleLines, setVisibleLines] = useState([]);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Skip if already booted this session
    if (sessionStorage.getItem('acs_booted') === '1') {
      onComplete();
      return;
    }

    const timeouts = [];
    BOOT_LINES.forEach((line, i) => {
      const t = setTimeout(() => {
        setVisibleLines(prev => [...prev, line]);
        if (i === BOOT_LINES.length - 1) {
          const fadeTo = setTimeout(() => {
            setFading(true);
            const doneT = setTimeout(() => {
              sessionStorage.setItem('acs_booted', '1');
              onComplete();
            }, 500);
            timeouts.push(doneT);
          }, 900);
          timeouts.push(fadeTo);
        }
      }, i * 340);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (sessionStorage.getItem('acs_booted') === '1') return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        willChange: 'opacity',
        backgroundImage: [
          'repeating-linear-gradient(60deg, transparent, transparent 28px, rgba(0,255,136,0.015) 28px, rgba(0,255,136,0.015) 29px)',
          'repeating-linear-gradient(120deg, transparent, transparent 28px, rgba(0,255,136,0.015) 28px, rgba(0,255,136,0.015) 29px)',
          'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,255,136,0.015) 28px, rgba(0,255,136,0.015) 29px)',
        ].join(', '),
      }}
    >
      <div style={{ maxWidth: 560, width: '90%' }}>
        {visibleLines.map((line, i) => (
          <div
            key={i}
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 13,
              color: 'var(--hud-green)',
              lineHeight: '1.7',
              letterSpacing: '0.5px',
              animation: 'panelEntry 0.15s ease-out',
              minHeight: '1.7em',
              willChange: 'transform, opacity',
            }}
          >
            {line}
            {i === visibleLines.length - 1 && (
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 2,
                  animation: 'blink 0.8s infinite',
                  willChange: 'opacity',
                }}
              >
                █
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
