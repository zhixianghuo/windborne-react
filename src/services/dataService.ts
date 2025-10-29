import { BalloonTrack, BalloonPoint } from '../types';
import { HOURS } from '../utils/formatters';
import { haversine, bearing, coerceNumber } from '../utils/math';

/**
 * Fetches data for a specific hour from the API
 * @param hh - Hour string (00-23) to fetch data for
 * @returns Raw data payload from the API
 * @throws Error if the API request fails
 */
async function fetchHour(hh: string) {
  const url = `/api/treasure/${hh}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`hour ${hh} HTTP ${res.status}: ${errorData.error || 'Unknown error'}`);
  }
  const raw = await res.json().catch(() => null);
  return raw;
}

/**
 * Sanitizes and groups balloon data from hourly payloads
 * 
 * Processes raw API data and converts it into organized balloon tracks.
 * Handles both array format [lat, lon, alt] and object format with various field names.
 * Calculates speed and bearing for each point, filters outliers, and sorts points by timestamp.
 * 
 * @param hourlyPayloads - Array of hourly data payloads from the API
 * @returns Map of balloon tracks keyed by balloon ID
 */
function sanitizeAndGroup(hourlyPayloads: unknown[]): Record<string, BalloonTrack> {
  const map: Record<string, BalloonTrack> = {};
  
  const pushPoint = (id: string, p: BalloonPoint) => {
    if (!map[id]) map[id] = { id, points: [] };
    const arr = map[id].points;
    const last = arr[arr.length - 1];
    if (!last || last.ts !== p.ts || last.lat !== p.lat || last.lon !== p.lon) {
      arr.push(p);
    }
  };
  
  for (let hourIndex = 0; hourIndex < hourlyPayloads.length; hourIndex++) {
    const payload = hourlyPayloads[hourIndex];
    const arr = Array.isArray(payload) ? payload : ((payload as any)?.data ?? payload ?? []);
    
    // Calculate timestamp for this hour (assuming data goes back 23 hours from current time)
    const hourTimestamp = Math.floor(Date.now() / 1000) - (23 - hourIndex) * 3600;
    
    
    for (let i = 0; i < arr.length; i++) {
      const row = arr[i];
      // Handle array format [lat, lon, alt] or object format
      let lat, lon, alt, id, ts;
      
      if (Array.isArray(row) && row.length >= 2) {
        // Array format: [lat, lon, alt] - each point represents a balloon's position at that moment
        lat = coerceNumber(row[0]);
        lon = coerceNumber(row[1]);
        alt = coerceNumber(row[2]);
        id = `balloon_${i}`; // Each array element is an independent balloon
        ts = hourTimestamp + i * 60; // 1 minute interval between points
      } else if (typeof row === 'object' && row !== null) {
        // Object format
        const rowObj = row as any;
        id = String(rowObj.id ?? rowObj.name ?? rowObj.device_id ?? rowObj.balloon_id ?? `balloon_${i}`);
        lat = coerceNumber(rowObj.lat ?? rowObj.latitude);
        lon = coerceNumber(rowObj.lon ?? rowObj.longitude);
        alt = coerceNumber(rowObj.alt ?? rowObj.altitude);
        const tsRaw = rowObj.ts ?? rowObj.timestamp ?? rowObj.time;
        ts = typeof tsRaw === "number" ? tsRaw : Date.parse(tsRaw ?? "") / 1000;
      } else {
        continue;
      }
      
      if (lat == null || lon == null || !Number.isFinite(ts)) continue;
      pushPoint(id, { ts, lat, lon, alt });
    }
  }
  
  // Clean and calculate trajectory data
  for (const tr of Object.values(map)) {
    tr.points.sort((a, b) => a.ts - b.ts);
    const clean: BalloonPoint[] = [];
    
    for (let i = 0; i < tr.points.length; i++) {
      const p = tr.points[i];
      if (i > 0) {
        const q = tr.points[i - 1];
        const dist = haversine(q.lat, q.lon, p.lat, p.lon);
        const dt = Math.max(1, p.ts - q.ts);
        const spd = dist / dt;
        const brg = bearing(q.lat, q.lon, p.lat, p.lon);
        if (spd > 300) continue; // Filter outliers (speed > 300 m/s)
        p.speed = spd; 
        p.bearing = brg;
      }
      clean.push(p);
    }
    tr.points = clean;
    
  }
  
  
  return map;
}

/**
 * Loads balloon data for all 24 hours
 * 
 * Fetches data for each of the 24 hours in parallel, handles failures gracefully,
 * and returns sanitized and grouped balloon tracks.
 * 
 * @returns Promise that resolves to a map of balloon tracks keyed by balloon ID
 */
export async function loadAll24h(): Promise<Record<string, BalloonTrack>> {
  const settled = await Promise.allSettled(HOURS.map(fetchHour));
  const ok = settled.filter(s => s.status === "fulfilled").map((s: any) => s.value);
  return sanitizeAndGroup(ok);
}
