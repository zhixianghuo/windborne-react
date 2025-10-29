import { WindCacheItem } from '../types';

// Weather data cache and request rate limiting
const windCache = new Map<string, WindCacheItem>();
let lastRequestTime = 0;
const REQUEST_INTERVAL = 200; // 200ms interval to reduce API pressure

/**
 * Loads weather data from Open-Meteo API
 * 
 * Fetches wind speed, wind direction, and temperature for a given location and timestamp.
 * Uses aggressive caching (0.25 degree precision, 2-hour time buckets) to minimize API requests.
 * Implements rate limiting to avoid API throttling.
 * 
 * @param lat - Latitude of the location
 * @param lon - Longitude of the location
 * @param ts - Unix timestamp (seconds)
 * @returns Promise that resolves to wind data (windSpeed, windDir, temp) or empty object on error
 */
export async function loadWind(lat: number, lon: number, ts: number): Promise<WindCacheItem> {
  // Coarse-grained cache key to significantly reduce request count
  const key = `${Math.round(lat * 4) / 4}_${Math.round(lon * 4) / 4}_${Math.floor(ts / 7200)}`; // 2-hour cache, 0.25 degree precision
  
  if (windCache.has(key)) {
    return windCache.get(key)!;
  }
  
  // Add request interval throttling
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m,winddirection_10m,temperature_2m&past_days=1&forecast_days=1&timeformat=unixtime`;
    const res = await fetch(url);
    
    if (res.status === 429) {
      console.warn('Open-Meteo rate limit reached, skipping wind data');
      return {};
    }
    
    if (!res.ok) {
      console.warn(`Open-Meteo API error: ${res.status}`);
      return {};
    }
    
    const data = await res.json();
    const times: number[] = data?.hourly?.time ?? [];
    const ws: number[] = data?.hourly?.windspeed_10m ?? [];
    const wd: number[] = data?.hourly?.winddirection_10m ?? [];
    const t2m: number[] = data?.hourly?.temperature_2m ?? [];
    
    if (!times.length) return {};
    
    // Find the closest time point
    let idx = 0, min = Infinity;
    for (let i = 0; i < times.length; i++) {
      const diff = Math.abs(times[i] - ts);
      if (diff < min) { 
        min = diff; 
        idx = i; 
      }
    }
    
    const result = { 
      windSpeed: ws[idx], 
      windDir: wd[idx], 
      temp: t2m[idx] 
    };
    
    windCache.set(key, result);
    return result;
  } catch (error) {
    console.warn('Open-Meteo request failed:', error);
    return {};
  }
}

/**
 * Enriches balloon tracks with wind data (DEPRECATED - use on-demand loading instead)
 * 
 * This function was used to pre-load wind data for all balloons, but has been replaced
 * with on-demand loading in the main page component. Kept for reference.
 * 
 * @param tracks - Map of balloon tracks to enrich
 * @param angleDiff - Function to calculate angle difference between two angles
 * @returns Promise that resolves when enrichment is complete
 */
export async function enrichWithWind(
  tracks: Record<string, any>, 
  angleDiff: (a: number, b: number) => number
): Promise<void> {
  const limit = 5; // Reduce concurrent requests to avoid API throttling
  const queue: Promise<any>[] = [];
  let enrichedCount = 0;
  
  // Smart sampling: adjust strategy based on number of balloons
  const trackArray = Object.values(tracks);
  const maxTracksToProcess = Math.min(trackArray.length, 20); // Process max 20 balloons
  
  for (let i = 0; i < maxTracksToProcess; i++) {
    const tr = trackArray[i];
    const points = tr.points;
    if (points.length === 0) continue;

    // Request wind data for only 1 key point per balloon (last point)
    const samplePoints = [points[points.length - 1]];
    
    for (const p of samplePoints) {
      if (queue.length >= limit) await Promise.race(queue);
      const task = (async () => {
        try {
          const w = await loadWind(p.lat, p.lon, p.ts);
          
          if (w.windDir != null && w.windSpeed != null) {
            p.windDir = w.windDir; 
            p.windSpeed = w.windSpeed; 
            p.temp = w.temp;
            enrichedCount++;
            
            
            if (p.bearing != null && w.windDir != null) {
              const ang = angleDiff(p.bearing, w.windDir);
              p.consistency = Math.cos((ang * Math.PI) / 180);
            } else {
              console.warn(`Missing data for consistency calculation:`, {
                balloonId: tr.id,
                bearing: p.bearing,
                windDir: w.windDir
              });
            }
          } else {
            console.warn(`No valid wind data for point:`, { lat: p.lat, lon: p.lon, windData: w });
          }
        } catch (error) {
          console.warn('Wind enrichment failed:', error);
        }
      })();
      
      task.finally(() => {
        const idx = queue.indexOf(task);
        if (idx >= 0) queue.splice(idx, 1);
      });
      queue.push(task);
    }
  }
  
  await Promise.allSettled(queue);
  
  // Propagate wind data to unsampled points for consistency calculation
  for (const tr of Object.values(tracks)) {
    const points = tr.points;
    if (points.length === 0) continue;
    
    // Find points with wind data
    const enrichedPoints = points.filter((p: any) => p.windDir != null && p.windSpeed != null);
    if (enrichedPoints.length === 0) continue;
    
    // Assign closest wind data to points without wind data
    for (const p of points) {
      if (p.windDir == null || p.windSpeed == null) {
        // Find the closest point with wind data
        let closestPoint = enrichedPoints[0];
        let minDistance = Infinity;
        
        for (const ep of enrichedPoints) {
          const distance = Math.sqrt(
            Math.pow(p.lat - ep.lat, 2) + Math.pow(p.lon - ep.lon, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = ep;
          }
        }
        
        // Propagate wind data
        p.windDir = closestPoint.windDir;
        p.windSpeed = closestPoint.windSpeed;
        p.temp = closestPoint.temp;
        
        // Calculate consistency
        if (p.bearing != null && p.windDir != null) {
          const ang = angleDiff(p.bearing, p.windDir);
          p.consistency = Math.cos((ang * Math.PI) / 180);
        }
      }
    }
  }
  
}
