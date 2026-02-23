import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://127.0.0.1:8000/ws';
const REST_BASE = 'http://127.0.0.1:8000';
const RETRY_DELAYS = [3000, 6000, 12000, 24000, 30000];

/**
 * Normalizes a drone object from backend shape to component shape.
 * Backend uses: altitude, latitude, longitude
 * Components expect: geo_altitude, latitude, longitude, icao24, callsign
 */
function normalizeDrone(d) {
  return {
    ...d,
    geo_altitude: d.geo_altitude != null ? d.geo_altitude : (d.altitude != null ? d.altitude : null),
    icao24: d.icao24 || d.callsign || '',
    callsign: d.callsign || d.icao24 || 'UNKNOWN',
    velocity: d.velocity != null ? d.velocity : null,
    true_track: d.true_track != null ? d.true_track : null,
    on_ground: d.on_ground != null ? d.on_ground : false,
  };
}

/**
 * Normalizes a zone object from backend shape (latitude/longitude) to lat/lng.
 */
function normalizeZone(z) {
  return {
    ...z,
    lat: z.lat != null ? z.lat : z.latitude,
    lng: z.lng != null ? z.lng : z.longitude,
  };
}

export default function useWebSocket() {
  const [drones, setDrones] = useState([]);
  const [restrictedZones, setRestrictedZones] = useState([]);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [dataSource, setDataSource] = useState('simulation');
  const [cycleId, setCycleId] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [newThreats, setNewThreats] = useState([]);
  const [wsLatency, setWsLatency] = useState(0);

  const wsRef = useRef(null);
  const retryIndexRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const lastMessageTimeRef = useRef(Date.now());
  const prevUnauthorizedCallsigns = useRef(new Set());
  const latencyIntervalRef = useRef(null);

  // Fetch restricted zones once on mount
  useEffect(() => {
    fetch(`${REST_BASE}/restricted-zones`)
      .then(r => r.json())
      .then(data => {
        const zones = (data.restricted_zones || []).map(normalizeZone);
        setRestrictedZones(zones);
      })
      .catch(() => {});
  }, []);

  // Latency ticker — update every second
  useEffect(() => {
    latencyIntervalRef.current = setInterval(() => {
      const secs = Math.round((Date.now() - lastMessageTimeRef.current) / 1000);
      setWsLatency(secs);
    }, 1000);
    return () => clearInterval(latencyIntervalRef.current);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onerror = null;
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    setWsStatus('connecting');
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus('connected');
      retryIndexRef.current = 0;
      lastMessageTimeRef.current = Date.now();
    };

    ws.onmessage = (event) => {
      lastMessageTimeRef.current = Date.now();
      try {
        const data = JSON.parse(event.data);
        const rawDrones = Array.isArray(data.drones) ? data.drones : [];
        const normalized = rawDrones.map(normalizeDrone);

        // Detect new threats (unauthorized now but not in previous message)
        const currentUnauthorized = normalized.filter(d => d.unauthorized);
        const currentCallsigns = new Set(currentUnauthorized.map(d => d.callsign || d.icao24));
        const freshThreats = currentUnauthorized.filter(
          d => !prevUnauthorizedCallsigns.current.has(d.callsign || d.icao24)
        );
        prevUnauthorizedCallsigns.current = currentCallsigns;

        setDrones(normalized);
        setNewThreats(freshThreats.length > 0 ? freshThreats : []);
        setDataSource(data.data_source || 'simulation');
        setCycleId(data.cycle_id || 0);
        setLastUpdate(Date.now());
      } catch (e) {
        // Malformed message — ignore
      }
    };

    ws.onerror = () => {
      setWsStatus('error');
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      const delay = RETRY_DELAYS[Math.min(retryIndexRef.current, RETRY_DELAYS.length - 1)];
      retryIndexRef.current = Math.min(retryIndexRef.current + 1, RETRY_DELAYS.length - 1);
      retryTimeoutRef.current = setTimeout(connect, delay);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    connect();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    drones,
    restrictedZones,
    wsStatus,
    dataSource,
    cycleId,
    lastUpdate,
    newThreats,
    wsLatency,
  };
}
