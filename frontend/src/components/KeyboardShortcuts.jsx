import React, { useState, useEffect } from 'react';

const SHORTCUTS = [
  { key: 'M',      label: 'Toggle audio mute'          },
  { key: 'R',      label: 'Manual data refresh'        },
  { key: 'S',      label: 'Open situation report'      },
  { key: 'T',      label: 'Toggle threats-only filter' },
  { key: 'Escape', label: 'Close drawer / clear selection' },
  { key: '?',      label: 'Show this help'             },
];

export default function KeyboardShortcuts({
  onToggleMute,
  onSituationReport,
  onManualRefresh,
  onClearSelection,
  onToggleFilter,
}) {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      switch (e.key.toUpperCase()) {
        case 'M':      onToggleMute();      break;
        case 'R':      onManualRefresh();   break;
        case 'S':      onSituationReport(); break;
        case 'T':      onToggleFilter();    break;
        case 'ESCAPE': onClearSelection(); setShowHelp(false); break;
        case '?':      setShowHelp(h => !h); break;
        default: break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onToggleMute, onManualRefresh, onSituationReport, onToggleFilter, onClearSelection]);

  if (!showHelp) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9495,
        }}
        onClick={() => setShowHelp(false)}
      />

      {/* Modal */}
      <div
        className="hud-panel"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 320,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-glow)',
          borderRadius: 3,
          padding: 16,
          zIndex: 9496,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 10, color: 'var(--data-blue)', letterSpacing: '2px', marginBottom: 12 }}>
          KEYBOARD SHORTCUTS
        </div>

        {SHORTCUTS.map((s, i) => (
          <div
            key={s.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 0',
              borderBottom: i < SHORTCUTS.length - 1 ? '1px solid rgba(0,212,255,0.05)' : 'none',
            }}
          >
            <span style={{
              background: 'var(--surface-3)',
              border: '1px solid var(--border-dim)',
              borderRadius: 2,
              padding: '2px 8px',
              fontFamily: 'var(--font-data)',
              fontSize: 11,
              color: 'var(--data-blue)',
            }}>
              {s.key}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-mid)' }}>
              {s.label}
            </span>
          </div>
        ))}

        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: 'var(--text-dim)', textAlign: 'center', marginTop: 10, letterSpacing: '1px' }}>
          Press ESC to close
        </div>
      </div>
    </>
  );
}
