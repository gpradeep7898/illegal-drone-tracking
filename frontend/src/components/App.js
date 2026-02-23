import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/globals.css';
import '../styles/animations.css';

import useWebSocket from '../hooks/useWebSocket';
import useDroneHistory from '../hooks/useDroneHistory';
import useSoundSystem from '../hooks/useSoundSystem';

import BootSequence from './BootSequence';
import TopNavBar from './TopNavBar';
import HoloStatsPanel from './HoloStatsPanel';
import MapComponent from './MapComponent';
import DroneDataTable from './DroneDataTable';
import ThreatTimeline from './ThreatTimeline';
import DroneDetailDrawer from './DroneDetailDrawer';
import AlertToast from './AlertToast';
import MultiZoneAlert from './MultiZoneAlert';
import SituationReport from './SituationReport';
import KeyboardShortcuts from './KeyboardShortcuts';
import BottomStatusBar from './BottomStatusBar';

export default function App() {
  const [booted, setBooted] = useState(false);
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [siRepOpen, setSiRepOpen] = useState(false);
  const [filterThreats, setFilterThreats] = useState(false);
  const [breachEvents, setBreachEvents] = useState([]);

  const {
    drones,
    restrictedZones,
    wsStatus,
    dataSource,
    cycleId,
    lastUpdate,
    newThreats,
    wsLatency,
  } = useWebSocket();

  const { update: updateHistory, getTrail } = useDroneHistory();
  const sounds = useSoundSystem();

  // Update flight history whenever drones data arrives
  useEffect(() => {
    if (drones && drones.length > 0) {
      updateHistory(drones);
    }
  }, [drones, updateHistory]);

  // WS connect/disconnect sounds
  const prevWsStatus = useRef('connecting');
  useEffect(() => {
    if (wsStatus === 'connected' && prevWsStatus.current !== 'connected') {
      sounds.playConnect();
    }
    if (wsStatus === 'disconnected' && prevWsStatus.current === 'connected') {
      sounds.playDisconnect();
    }
    prevWsStatus.current = wsStatus;
  }, [wsStatus, sounds]);

  // Threat sounds
  useEffect(() => {
    if (!newThreats || newThreats.length === 0) return;
    if (newThreats.length >= 2) {
      sounds.playMultiZone();
    } else {
      sounds.playThreat();
    }
  }, [newThreats, sounds]);

  // Breach events detection for map arcs
  const prevUnauthorizedCallsigns = useRef(new Set());
  useEffect(() => {
    const currentUnauth = (drones || []).filter(d => d.unauthorized);
    const newBreaches = currentUnauth.filter(d =>
      !prevUnauthorizedCallsigns.current.has(d.callsign || d.icao24)
    );

    if (newBreaches.length > 0) {
      const newEvents = newBreaches.map(d => {
        // Find which zone the drone is in (inline haversine)
        const zone = (restrictedZones || []).find(z => {
          const zLat = z.lat != null ? z.lat : z.latitude;
          const zLng = z.lng != null ? z.lng : z.longitude;
          if (zLat == null || zLng == null) return false;
          const R = 6371;
          const dLat = (zLat - d.latitude) * Math.PI / 180;
          const dLng = (zLng - d.longitude) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(d.latitude * Math.PI / 180) *
            Math.cos(zLat * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return dist <= (z.radius || 10);
        });
        return {
          id: Date.now() + Math.random(),
          lat: zone ? (zone.lat != null ? zone.lat : zone.latitude) : d.latitude,
          lng: zone ? (zone.lng != null ? zone.lng : zone.longitude) : d.longitude,
          ts: Date.now(),
        };
      });

      setBreachEvents(prev => [...prev, ...newEvents]);
      setTimeout(() => {
        setBreachEvents(prev => prev.filter(e => Date.now() - e.ts < 2600));
      }, 2700);
    }

    prevUnauthorizedCallsigns.current = new Set(
      (drones || []).filter(d => d.unauthorized).map(d => d.callsign || d.icao24)
    );
  }, [drones, restrictedZones]);

  const handleDroneClick = useCallback((drone) => {
    setSelectedDrone(drone);
    setDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedDrone(null);
  }, []);

  const handleRefresh = useCallback(() => {
    fetch('http://127.0.0.1:8000/fetch-drones-live').catch(() => {});
  }, []);

  const handleToggleFilter = useCallback(() => {
    setFilterThreats(f => !f);
  }, []);

  const multiZoneActive = (drones || []).filter(d => d.unauthorized).length >= 2;

  return (
    <>
      <BootSequence onComplete={() => setBooted(true)} />

      {booted && (
        <div className="app-shell">
          <TopNavBar
            wsStatus={wsStatus}
            wsLatency={wsLatency}
            isMuted={sounds.isMuted}
            onToggleMute={sounds.toggleMute}
            onSituationReport={() => setSiRepOpen(true)}
          />

          <aside className="left-panel">
            <HoloStatsPanel
              drones={drones}
              restrictedZones={restrictedZones}
              cycleId={cycleId}
              wsStatus={wsStatus}
            />
          </aside>

          <main className="map-area">
            {multiZoneActive && <MultiZoneAlert drones={drones} />}
            <MapComponent
              drones={drones}
              restrictedZones={restrictedZones}
              getTrail={getTrail}
              breachEvents={breachEvents}
              onDroneClick={handleDroneClick}
              selectedCallsign={selectedDrone?.callsign}
            />
          </main>

          <aside className="right-panel">
            <DroneDataTable
              drones={drones}
              onDroneClick={handleDroneClick}
              selectedCallsign={selectedDrone?.callsign}
              filterThreats={filterThreats}
            />
            <ThreatTimeline
              newThreats={newThreats}
              drones={drones}
              cycleId={cycleId}
            />
          </aside>

          <footer className="bottom-bar">
            <BottomStatusBar
              drones={drones}
              wsStatus={wsStatus}
              dataSource={dataSource}
              lastUpdate={lastUpdate}
              onManualRefresh={handleRefresh}
            />
          </footer>

          <DroneDetailDrawer
            drone={drawerOpen ? selectedDrone : null}
            restrictedZones={restrictedZones}
            getTrail={getTrail}
            onClose={handleCloseDrawer}
          />

          <AlertToast
            newThreats={newThreats}
            onPlaySound={() => {
              if ((newThreats || []).length >= 2) {
                sounds.playMultiZone();
              } else {
                sounds.playThreat();
              }
            }}
          />

          {siRepOpen && (
            <SituationReport
              isOpen={siRepOpen}
              onClose={() => setSiRepOpen(false)}
              drones={drones}
              restrictedZones={restrictedZones}
              dataSource={dataSource}
            />
          )}

          <KeyboardShortcuts
            onToggleMute={sounds.toggleMute}
            onSituationReport={() => setSiRepOpen(true)}
            onManualRefresh={handleRefresh}
            onClearSelection={handleCloseDrawer}
            onToggleFilter={handleToggleFilter}
          />
        </div>
      )}
    </>
  );
}
