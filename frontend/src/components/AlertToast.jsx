import React, { useState, useEffect, useCallback } from 'react';

export default function AlertToast({ newThreats, onPlaySound }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 280);
  }, []);

  useEffect(() => {
    if (!newThreats || newThreats.length === 0) return;

    // Screen flash
    const div = document.createElement('div');
    Object.assign(div.style, {
      position: 'fixed',
      inset: '0',
      background: 'var(--threat-red)',
      opacity: '0.04',
      pointerEvents: 'none',
      zIndex: '9990',
      transition: 'opacity 80ms ease',
    });
    document.body.appendChild(div);
    requestAnimationFrame(() => {
      setTimeout(() => {
        div.style.opacity = '0';
        setTimeout(() => document.body.removeChild(div), 100);
      }, 60);
    });

    onPlaySound();

    const id = Date.now();
    const newToast = newThreats.length >= 2
      ? { id, type: 'multi', count: newThreats.length, progress: 100, removing: false }
      : { id, type: 'single', callsign: newThreats[0].callsign || newThreats[0].icao24 || 'UNKNOWN', progress: 100, removing: false };

    setToasts(prev => [newToast, ...prev].slice(0, 3));

    const interval = setInterval(() => {
      setToasts(prev =>
        prev.map(t => t.id === id
          ? { ...t, progress: Math.max(0, t.progress - (100 / 50)) }
          : t
        )
      );
    }, 100);

    const dismiss = setTimeout(() => {
      clearInterval(interval);
      dismissToast(id);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(dismiss);
    };
  }, [newThreats]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'fixed',
        top: 68,
        right: 16,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            width: 300,
            background: 'rgba(12,2,6,0.97)',
            borderLeft: `4px solid ${toast.type === 'single' ? 'var(--threat-red)' : 'var(--warn-amber)'}`,
            border: '1px solid rgba(255,26,60,0.25)',
            borderRadius: 3,
            backdropFilter: 'blur(16px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
            animation: toast.removing
              ? 'toastOut 0.28s ease-in forwards'
              : 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            position: 'relative',
            overflow: 'hidden',
            padding: '11px 14px 8px',
            pointerEvents: 'all',
            willChange: 'transform, opacity',
          }}
        >
          {/* Header */}
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 9,
            color: toast.type === 'single' ? 'var(--threat-red)' : 'var(--warn-amber)',
            letterSpacing: '1px',
          }}>
            {toast.type === 'single' ? '⚠ INCURSION DETECTED' : '⚠ MULTI-ZONE BREACH'}
          </div>

          {/* Main text */}
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 17,
            color: toast.type === 'single' ? 'var(--text-bright)' : 'var(--warn-amber)',
            marginTop: 3,
            letterSpacing: '1px',
          }}>
            {toast.type === 'single' ? toast.callsign : `${toast.count} ZONES BREACHED`}
          </div>

          {/* Sub */}
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-mid)', marginTop: 2 }}>
            {toast.type === 'single' ? 'Unauthorized airspace entry' : 'Simultaneous multi-zone incursion'}
          </div>

          {/* Close button */}
          <button
            onClick={() => dismissToast(toast.id)}
            style={{
              position: 'absolute',
              top: 8,
              right: 10,
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-hud)',
              fontSize: 10,
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--threat-red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            ✕
          </button>

          {/* Progress bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: 3,
            background: toast.type === 'single' ? 'var(--threat-red)' : 'var(--warn-amber)',
            width: toast.progress + '%',
            transition: 'width 0.1s linear',
            borderRadius: '0 2px 0 0',
          }} />
        </div>
      ))}
    </div>
  );
}
