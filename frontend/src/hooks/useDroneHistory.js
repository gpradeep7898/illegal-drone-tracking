import { useRef, useMemo, useCallback, useState } from 'react';

/**
 * Tracks flight path history per drone callsign.
 * Stores up to 20 positions (FIFO) per drone, pruning entries older than 5 minutes.
 */
export default function useDroneHistory() {
  const historyMap = useRef(new Map());
  const trailsVersionRef = useRef(0);
  const [trailsVersion, setTrailsVersion] = useState(0);

  const update = useCallback((drones) => {
    if (!drones || !drones.length) return;
    const now = Date.now();
    const FIVE_MIN = 300000;
    const MAX_TRAIL = 20;

    drones.forEach((drone) => {
      const lat = drone.latitude;
      const lng = drone.longitude;
      if (lat == null || lng == null) return;

      const key = drone.callsign || drone.icao24;
      if (!key) return;

      if (!historyMap.current.has(key)) {
        historyMap.current.set(key, []);
      }
      const trail = historyMap.current.get(key);

      // Only append if position changed or trail is empty
      const last = trail[trail.length - 1];
      if (!last || last.lat !== lat || last.lng !== lng) {
        trail.push({ lat, lng, ts: now });
      }

      // Trim to max entries
      while (trail.length > MAX_TRAIL) trail.shift();

      // Prune old entries
      const cutoff = now - FIVE_MIN;
      while (trail.length > 0 && trail[0].ts < cutoff) trail.shift();
    });

    trailsVersionRef.current += 1;
    setTrailsVersion(trailsVersionRef.current);
  }, []);

  const getTrail = useCallback((callsign) => {
    if (!callsign) return [];
    return historyMap.current.get(callsign) || [];
  }, []);

  return useMemo(() => ({
    update,
    getTrail,
    trailsVersion,
  }), [update, getTrail, trailsVersion]);
}
