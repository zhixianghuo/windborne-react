/**
 * Balloon data point type
 * Represents a single position measurement for a balloon
 */
export type BalloonPoint = {
  ts: number; // Timestamp (seconds)
  lat: number; // Latitude
  lon: number; // Longitude
  alt?: number; // Altitude (meters)
  speed?: number; // Speed (m/s)
  bearing?: number; // Bearing (degrees)
  windSpeed?: number; // Wind speed (m/s)
  windDir?: number; // Wind direction (degrees)
  temp?: number; // Temperature (Celsius)
  consistency?: number; // Consistency score (-1 to 1)
};

/**
 * Balloon trajectory type
 * Contains all data points for a single balloon
 */
export type BalloonTrack = { 
  id: string; 
  points: BalloonPoint[];
  score?: number; // Average consistency score
};

/**
 * Leaderboard item type
 * Used for displaying balloon rankings
 */
export type LeaderboardItem = {
  id: string;
  avg: number;
  last?: BalloonPoint;
};

/**
 * Chart data point type
 * Used for rendering charts in the detail panel
 */
export type ChartDataPoint = {
  time: string;
  speed?: number;
  wind?: number;
  temp?: number;
  consistency?: number;
};

/**
 * Map component props type
 * Props passed to the LeafletMap component
 */
export type MapProps = {
  tracks: Record<string, BalloonTrack>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  showTrails: boolean;
  maxBalloons: number;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
};

/**
 * Balloon detail component props type
 * Props passed to the BalloonDetail component
 */
export type BalloonDetailProps = {
  track: BalloonTrack;
  isClient: boolean;
};

/**
 * Weather data cache item type
 * Cached wind data from Open-Meteo API
 */
export type WindCacheItem = {
  windSpeed?: number;
  windDir?: number;
  temp?: number;
};
